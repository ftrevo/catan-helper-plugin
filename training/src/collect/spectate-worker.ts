/**
 * Spectates colonist.io games on the base map, captures the board a few times per game and runs the
 * extension's reading on every capture. Meant to run as one of several parallel workers sharing the
 * registry in examples/registry.json.
 *
 *   node --import tsx src/collect/spectate-worker.ts --agent w1 [--once] [--captures 3] [--interval 300] [--list]
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import { EXTENSION_DIR, TRAINING_DIR } from '../paths.ts'
import { EXAMPLES_DIR, GAMES_DIR, claim, finish, heartbeat, reject, shouldStop, unavailableRooms } from './registry.ts'

/** Rejected games are kept here (PNGs are gitignored) so failures can be inspected. */
const REJECTED_DIR = resolve(EXAMPLES_DIR, 'rejected')
/** The first capture is retried this many times while the spectator view finishes loading. */
const FIRST_CAPTURE_ATTEMPTS = 4
const FIRST_CAPTURE_RETRY_MS = 12_000
/**
 * Mid-game boards hide tokens: the robber sits on one, pieces and chat bubbles brush others. The locator
 * fits the grid from 12 tokens; this keeps a margin so the tile reading stays trustworthy.
 */
const MIN_TOKENS = 15

const { values } = parseArgs({
  options: {
    agent: { type: 'string', default: 'w0' },
    once: { type: 'boolean', default: false },
    list: { type: 'boolean', default: false },
    captures: { type: 'string', default: '3' },
    interval: { type: 'string', default: '300' },
    'settle-seconds': { type: 'string', default: '12' },
    /** Chrome profile to reuse; defaults to a per-agent profile under training/.collect. */
    profile: { type: 'string' },
  },
})
const AGENT = values.agent
const CAPTURES = Number(values.captures)
const INTERVAL_MS = Number(values.interval) * 1000
const SETTLE_MS = Number(values['settle-seconds']) * 1000
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const VIEWPORT = { width: 1600, height: 900, deviceScaleFactor: 1 }
const LOG_DIR = resolve(EXAMPLES_DIR, 'logs')

/**
 * Only the standard board ("Base 7-8 Player" and expansion maps are excluded) in the regular game modes:
 * the base game and Cities & Knights. Colonist Rush is skipped; its simultaneous play makes boards noisy.
 */
const ACCEPTED_MAP = 'Base'
const isAcceptedMode = (mode: string) => /^base/i.test(mode) || /cities/i.test(mode)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const stamp = () => new Date().toISOString()
const hhmmss = () => stamp().slice(11, 19).replace(/:/g, '')
const yyyymmdd = () => stamp().slice(0, 10).replace(/-/g, '')

mkdirSync(LOG_DIR, { recursive: true })
const log = (message: string) => {
  const line = `${stamp()} [${AGENT}] ${message}`
  console.log(line)
  appendFileSync(resolve(LOG_DIR, `${AGENT}.log`), line + '\n')
}

const clickText = async (page: Page, text: string, exact = false): Promise<boolean> => {
  const handles = await page.$$('button, a, div, span, p, li, [role=button]')
  for (const h of handles) {
    const t = (await h.evaluate((el) => (el as HTMLElement).innerText || '')).trim()
    if (!(exact ? t === text : t.includes(text))) continue
    const hasChild = await h.evaluate(
      (el, text, exact) =>
        [...el.querySelectorAll('*')].some((c) => {
          const t = ((c as HTMLElement).innerText || '').trim()
          return exact ? t === text : t.includes(text)
        }),
      text,
      exact
    )
    if (hasChild) continue
    const box = await h.boundingBox()
    if (!box || box.width === 0) continue
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    return true
  }
  return false
}

type Row = { index: number; mode: string; map: string; timer: string }

const openSpectateList = async (page: Page): Promise<Row[]> => {
  await page.goto('https://colonist.io/#lobby=1', { waitUntil: 'networkidle2', timeout: 60_000 })
  await sleep(2000)
  if ((await page.evaluate(() => document.querySelectorAll('canvas').length)) >= 2) {
    // Reconnected into the previous room as a spectator; the deep link needs a second load from the lobby.
    await page.goto('https://colonist.io/#lobby=1', { waitUntil: 'networkidle2', timeout: 60_000 })
    await sleep(2000)
  }
  if (await clickText(page, 'Manage options', true)) {
    await sleep(1500)
    await clickText(page, 'Confirm choices', true)
    await sleep(1500)
  }
  // The landing page has no navigation until "Play Online" opens the app.
  if (!(await clickText(page, 'Rooms', true))) {
    await clickText(page, 'Play Online', true)
    await sleep(2500)
    await clickText(page, 'Rooms', true)
  }
  await page.waitForSelector('table tr', { timeout: 20_000 }).catch(() => undefined)
  await sleep(1000)
  await clickText(page, 'Spectate', true)
  await page
    .waitForFunction(() => document.querySelectorAll('table tr td').length > 6, { timeout: 20_000 })
    .catch(() => undefined)
  await sleep(2000)
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('table tr')]
      .map((tr, index) => {
        const cells = [...tr.querySelectorAll('td')].map((td) => (td as HTMLElement).innerText.trim())
        return { index, mode: cells[0] ?? '', map: cells[1] ?? '', timer: cells[2] ?? '' }
      })
      .filter((r) => r.map)
  )
  if (rows.length === 0)
    await page.screenshot({ path: resolve(LOG_DIR, `${AGENT}-no-rows.png`) }).catch(() => undefined)
  return rows
}

const isBaseGame = (row: Row) => row.map === ACCEPTED_MAP && isAcceptedMode(row.mode)

const roomCodeOf = (url: string): string | undefined => {
  const hash = new URL(url).hash.replace(/^#/, '')
  return /^[a-z0-9]{4,}$/i.test(hash) && !hash.includes('=') ? hash : undefined
}

const gameState = (page: Page) =>
  page.evaluate(() => ({
    hash: location.hash,
    canvases: document.querySelectorAll('canvas').length,
    ended: /won the game|has won|Game Over|game has ended|winner/i.test(document.body.innerText),
    inLobby: /Open Rooms|Spectate/.test(document.body.innerText) && document.querySelectorAll('canvas').length < 2,
  }))

const readCapture = (png: string, json: string) => {
  execFileSync('npx', ['vite-node', 'scripts/read-capture.ts', png, json], {
    cwd: EXTENSION_DIR,
    stdio: 'pipe',
    timeout: 180_000,
  })
  return JSON.parse(readFileSync(json, 'utf8')) as {
    ok: boolean
    reason?: string
    location?: { tokensFound: number; spacing: number }
    pieces?: { buildings: { colour: string }[]; roads: { colour: string }[] }
  }
}

const watchOne = async (browser: Browser): Promise<'watched' | 'nothing'> => {
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  try {
    const rows = await openSpectateList(page)
    const candidates = rows.filter(isBaseGame)
    const modes = [...new Set(rows.filter((r) => r.map === ACCEPTED_MAP).map((r) => r.mode))].join(', ')
    log(`spectate list: ${rows.length} games, ${candidates.length} accepted (base map modes seen: ${modes})`)
    if (candidates.length === 0) return 'nothing'

    // Random order so parallel workers rarely race for the same room; the registry settles any race.
    const shuffled = [...candidates].sort(() => Math.random() - 0.5)
    const taken = unavailableRooms()
    for (const row of shuffled.slice(0, 6)) {
      const before = page.url()
      await page.evaluate((i) => {
        const tr = document.querySelectorAll('table tr')[i] as HTMLElement | undefined
        tr?.scrollIntoView()
        tr?.click()
      }, row.index)
      let roomCode: string | undefined
      for (let t = 0; t < 20 && !roomCode; t++) {
        await sleep(500)
        if (page.url() !== before) roomCode = roomCodeOf(page.url())
      }
      if (!roomCode) {
        log(`row ${row.index} (${row.mode} / ${row.map}) did not open a game`)
        await openSpectateList(page)
        continue
      }
      if (taken.has(roomCode) || !claim(roomCode, AGENT)) {
        log(`room ${roomCode} already taken, trying another`)
        await openSpectateList(page)
        continue
      }
      log(`claimed ${roomCode} (${row.mode} / ${row.map} / ${row.timer})`)
      await captureGame(page, roomCode, row)
      return 'watched'
    }
    return 'nothing'
  } finally {
    await page.close().catch(() => undefined)
  }
}

const captureGame = async (page: Page, roomCode: string, row: Row) => {
  const dir = resolve(GAMES_DIR, `${yyyymmdd()}-${roomCode}`)
  mkdirSync(dir, { recursive: true })
  const game = {
    roomCode,
    url: page.url(),
    mode: row.mode,
    map: row.map,
    turnTimer: row.timer,
    agent: AGENT,
    claimedAt: stamp(),
    finishedAt: undefined as string | undefined,
    viewport: VIEWPORT,
    captures: [] as Array<{
      file: string
      takenAt: string
      ok: boolean
      tokens: number
      buildings: number
      roads: number
      colours: string[]
      reason?: string
    }>,
    notes: [] as string[],
  }
  const save = () => writeFileSync(resolve(dir, 'game.json'), JSON.stringify(game, null, 2) + '\n')
  save()

  await sleep(SETTLE_MS)
  // Dismiss the mode info card that opens on join and park the pointer over the empty bottom bar.
  await page.mouse.click(700, VIEWPORT.height - 40).catch(() => undefined)
  await page.mouse.move(700, VIEWPORT.height - 30)
  await sleep(800)

  // A finished game still appears in the list; its Game Over overlay has a Map button showing the final board.
  let finalBoard = false
  if ((await gameState(page)).ended) {
    if (await clickText(page, 'Map', true)) {
      await sleep(2500)
      finalBoard = true
      game.notes.push('game over: captured the final board via the Map button')
    } else {
      game.notes.push('game over overlay without a Map button')
      reject(roomCode, AGENT, 'game already over')
      rmSync(dir, { recursive: true, force: true })
      return
    }
  }
  const plannedCaptures = finalBoard ? 1 : CAPTURES

  let firstAttempt = 1
  for (let seq = 1; seq <= plannedCaptures; seq++) {
    const state = await gameState(page)
    if (state.canvases < 2 || state.inLobby) {
      game.notes.push(`capture ${seq}: no game canvas (hash ${state.hash || 'none'})`)
      break
    }
    const base = `${String(seq).padStart(2, '0')}-${hhmmss()}`
    const png = resolve(dir, `${base}.png`)
    const json = resolve(dir, `${base}.reading.json`)
    await page.screenshot({ path: png })
    let reading: ReturnType<typeof readCapture>
    try {
      reading = readCapture(png, json)
    } catch (error) {
      reading = { ok: false, reason: `read-capture failed: ${(error as Error).message.slice(0, 200)}` }
      writeFileSync(json, JSON.stringify(reading, null, 2) + '\n')
    }
    const tokens = reading.location?.tokensFound ?? 0
    const standard = reading.ok && tokens >= MIN_TOKENS
    const colours = [
      ...new Set([...(reading.pieces?.buildings ?? []), ...(reading.pieces?.roads ?? [])].map((p) => p.colour)),
    ]
    game.captures.push({
      file: `${base}.png`,
      takenAt: stamp(),
      ok: standard,
      tokens,
      buildings: reading.pieces?.buildings.length ?? 0,
      roads: reading.pieces?.roads.length ?? 0,
      colours,
      ...(standard ? {} : { reason: reading.reason ?? `only ${tokens} tokens` }),
    })
    save()
    log(
      `${roomCode} capture ${seq}: ${standard ? `ok, ${colours.length} colours, ${game.captures.at(-1)?.buildings} buildings, ${game.captures.at(-1)?.roads} roads` : `rejected (${game.captures.at(-1)?.reason})`}`
    )

    if (!standard && seq === 1) {
      if (firstAttempt < FIRST_CAPTURE_ATTEMPTS) {
        firstAttempt++
        game.captures.pop()
        rmSync(png, { force: true })
        rmSync(json, { force: true })
        log(`${roomCode} first capture not readable yet, retrying (${firstAttempt}/${FIRST_CAPTURE_ATTEMPTS})`)
        await sleep(FIRST_CAPTURE_RETRY_MS)
        seq--
        continue
      }
      // Not a readable standard board: keep the evidence aside and drop the game.
      game.notes.push('rejected: first capture unreadable')
      save()
      mkdirSync(REJECTED_DIR, { recursive: true })
      rmSync(resolve(REJECTED_DIR, `${yyyymmdd()}-${roomCode}`), { recursive: true, force: true })
      renameSync(dir, resolve(REJECTED_DIR, `${yyyymmdd()}-${roomCode}`))
      reject(roomCode, AGENT, game.captures[0]?.reason ?? 'unreadable')
      return
    }
    if (state.ended && !finalBoard) {
      game.notes.push('game ended')
      break
    }
    if (seq < plannedCaptures) {
      const until = Date.now() + INTERVAL_MS
      while (Date.now() < until) {
        await sleep(Math.min(30_000, until - Date.now()))
        heartbeat(roomCode, AGENT)
        const s = await gameState(page)
        if (s.ended || s.canvases < 2 || s.inLobby) break
      }
    }
  }

  const good = game.captures.filter((c) => c.ok)
  game.finishedAt = stamp()
  save()
  if (good.length === 0) {
    rmSync(dir, { recursive: true, force: true })
    reject(roomCode, AGENT, 'no readable capture')
    return
  }
  const last = good.at(-1)
  finish(roomCode, AGENT, {
    captures: good.length,
    colours: [...new Set(good.flatMap((c) => c.colours))],
    buildings: last?.buildings,
    roads: last?.roads,
  })
  log(`${roomCode} done: ${good.length} captures`)
}

const main = async () => {
  const profile = values.profile ?? resolve(TRAINING_DIR, '.collect/profiles', AGENT)
  mkdirSync(profile, { recursive: true })
  // A visible, ordinary Chrome window: the game is a WebGL canvas and the site treats headless browsers as
  // bots. Same launch shape as the extension test harness.
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    pipe: true,
    userDataDir: profile,
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--mute-audio',
      '--disable-infobars',
      `--window-size=${VIEWPORT.width},${VIEWPORT.height + 90}`,
      '--window-position=0,0',
    ],
  })
  try {
    if (values.list) {
      const page = await browser.newPage()
      const rows = await openSpectateList(page)
      console.table(rows.filter(isBaseGame).slice(0, 20))
      const byMode = rows
        .filter((r) => r.map === ACCEPTED_MAP)
        .reduce<Record<string, number>>((acc, r) => ((acc[r.mode] = (acc[r.mode] ?? 0) + 1), acc), {})
      console.log(
        `${rows.length} rows, ${rows.filter(isBaseGame).length} accepted; base-map games by mode: ${JSON.stringify(byMode)}`
      )
      return
    }
    let idle = 0
    while (!shouldStop()) {
      const outcome = await watchOne(browser).catch((error: Error) => {
        log(`error: ${error.message.slice(0, 300)}`)
        return 'nothing' as const
      })
      if (values.once) break
      idle = outcome === 'nothing' ? idle + 1 : 0
      if (outcome === 'nothing') await sleep(Math.min(120_000, 15_000 * idle))
    }
    log(shouldStop() ? 'stop requested or target reached' : 'exiting')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  log(`fatal: ${(error as Error).stack ?? error}`)
  process.exit(1)
})
