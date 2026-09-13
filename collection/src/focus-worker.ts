/**
 * Focus worker: fills the gaps in the rare player colours. One Chrome window, two tabs.
 *
 * - The scout tab reads the spectate list (base map only; base game and Cities & Knights modes), joins a game,
 *   reads the seat colours from the page and leaves at once unless a player uses a colour that still has
 *   gaps in examples/variants.json (written by `npm run variants -- --min N`). A wanted game gets one
 *   capture and goes into the revisit queue.
 * - The revisit tab returns to every queued game for another capture, every 2 to 5 minutes depending on
 *   how many games wait (about 40 s of interval per queued game keeps the tab caught up), because
 *   knights get promoted and metropolises appear as the game goes on, until the game ends or --max-visits
 *   is spent. The queue is persisted in examples/revisit.json, so a restart resumes it.
 *
 * Both tabs share the one Chrome profile that colonist.io accepts; a second browser would not get past the
 * site's bot check. Screenshots bring the tab to the front, since a hidden WebGL canvas stops drawing.
 *
 *   npm run focus -- --agent f1 --profile <dir> [--revisit-minutes 5] [--min-revisit-minutes 2] [--max-visits 20] [--max-queue 8] [--once] [--list]
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import { EXTENSION_DIR, PROFILES_DIR } from './paths.ts'
import {
  EXAMPLES_DIR,
  GAMES_DIR,
  claim,
  finish,
  heartbeat,
  reject,
  shouldStop,
  skip,
  unavailableRooms,
} from './registry.ts'
import { type Revisit, dueNow, loadQueue, modifyQueue } from './revisit-queue.ts'

const REJECTED_DIR = resolve(EXAMPLES_DIR, 'rejected')
const VARIANTS_FILE = resolve(EXAMPLES_DIR, 'variants.json')
/** The first capture is retried this many times while the spectator view finishes loading. */
const FIRST_CAPTURE_ATTEMPTS = 4
const FIRST_CAPTURE_RETRY_MS = 12_000
/** A standard board: most tokens located and nothing token-like outside the lattice (larger maps fail this). */
const MIN_TOKENS = 15
const MAX_EXTRA_TOKENS = 2
const ACCEPTED_MAP = 'Base'
/** A queued game that cannot be reached this many times in a row is dropped. */
const MAX_REVISIT_FAILURES = 3
const PLAYER_COLOUR_NAMES = [
  'red',
  'blue',
  'orange',
  'black',
  'green',
  'white',
  'purple',
  'pink',
  'silver',
  'bronze',
  'gold',
  'mysticblue',
]

const { values } = parseArgs({
  options: {
    agent: { type: 'string', default: 'f0' },
    once: { type: 'boolean', default: false },
    list: { type: 'boolean', default: false },
    'settle-seconds': { type: 'string', default: '15' },
    /** Longest gap between visits to one game; the gap shrinks to --min-revisit-minutes when the queue is short. */
    'revisit-minutes': { type: 'string', default: '5' },
    'min-revisit-minutes': { type: 'string', default: '2' },
    'max-visits': { type: 'string', default: '20' },
    /** Scouting pauses while this many games wait for revisits; the revisit tab serves about 10 per 5 min. */
    'max-queue': { type: 'string', default: '8' },
    /** Chrome profile to reuse; defaults to a per-agent profile under collection/.profiles. */
    profile: { type: 'string' },
  },
})
const AGENT = values.agent
const SETTLE_MS = Number(values['settle-seconds']) * 1000
const MAX_REVISIT_MS = Number(values['revisit-minutes']) * 60_000
const MIN_REVISIT_MS = Number(values['min-revisit-minutes']) * 60_000
/** A visit takes about 35 s (rejoin, settle, capture, read), so this much interval per queued game keeps up. */
const VISIT_COST_MS = 40_000
const revisitInterval = (queued: number) => Math.min(MAX_REVISIT_MS, Math.max(MIN_REVISIT_MS, queued * VISIT_COST_MS))
const MAX_VISITS = Number(values['max-visits'])
const MAX_QUEUE = Number(values['max-queue'])
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const VIEWPORT = { width: 1600, height: 900, deviceScaleFactor: 1 }
const LOG_DIR = resolve(EXAMPLES_DIR, 'logs')

/** Base game and Cities & Knights; Seafarers adds ships and fog, Colonist Rush is too noisy. */
const isAcceptedMode = (mode: string) =>
  !/seafarers/i.test(mode) && (/^base(\s*game)?(\s*\d-\dp)?$/i.test(mode) || /cities|c&k/i.test(mode))

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

type Match = 'exact' | 'includes' | 'prefix'
const matches = (t: string, text: string, mode: Match) =>
  mode === 'exact' ? t === text : mode === 'prefix' ? t.startsWith(text) : t.includes(text)

const clickText = async (page: Page, text: string, mode: Match = 'includes'): Promise<boolean> => {
  const handles = await page.$$('button, a, div, span, p, li, [role=button]')
  for (const h of handles) {
    const t = (await h.evaluate((el) => (el as HTMLElement).innerText || '')).trim()
    if (!matches(t, text, mode)) continue
    const hasChild = await h.evaluate(
      (el, text, mode) =>
        [...el.querySelectorAll('*')].some((c) => {
          const t = ((c as HTMLElement).innerText || '').trim()
          return mode === 'exact' ? t === text : mode === 'prefix' ? t.startsWith(text) : t.includes(text)
        }),
      text,
      mode
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
  if (await clickText(page, 'Manage options', 'exact')) {
    await sleep(1500)
    await clickText(page, 'Confirm choices', 'exact')
    await sleep(1500)
  }
  // The landing page has no navigation until "Play Online" opens the app.
  if (!(await clickText(page, 'Rooms', 'exact'))) {
    await clickText(page, 'Play Online', 'exact')
    await sleep(2500)
    await clickText(page, 'Rooms', 'exact')
  }
  await page.waitForSelector('table tr', { timeout: 20_000 }).catch(() => undefined)
  await sleep(1000)
  await clickText(page, 'Spectate', 'exact')
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

/** Missing variants per colour, from the gap report. Without a report every colour needs everything. */
const readGaps = (): Record<string, string[]> => {
  try {
    const report = JSON.parse(readFileSync(VARIANTS_FILE, 'utf8')) as { gaps: Record<string, Record<string, number>> }
    return Object.fromEntries(Object.entries(report.gaps).map(([colour, variants]) => [colour, Object.keys(variants)]))
  } catch {
    log(`${VARIANTS_FILE} is missing or unreadable; every colour counts as wanted`)
    return Object.fromEntries(PLAYER_COLOUR_NAMES.map((c) => [c, ['any']]))
  }
}

/** Knights and metropolises exist only in Cities & Knights; the other variants appear in every mode. */
const isCitiesAndKnights = (mode: string) => /cities|c&k/i.test(mode)
const obtainableIn = (variant: string, mode: string) => isCitiesAndKnights(mode) || !/metropolis|knight/.test(variant)

/** Seat colours whose missing variants this game's mode can still produce. */
const wantedSeats = (seats: string[], mode: string, gaps: Record<string, string[]>): string[] =>
  seats.filter((colour) => (gaps[colour] ?? []).some((variant) => obtainableIn(variant, mode)))

/** The game page marks each player's avatar with a class named after the colour, e.g. "red-mDDVK4ZW". */
const readSeatColours = (page: Page): Promise<string[]> =>
  page.evaluate((names) => {
    const found = new Set<string>()
    for (const el of document.querySelectorAll('[class*="avatar"]')) {
      for (const cls of el.classList) {
        const name = cls.split('-')[0] ?? ''
        if (names.includes(name)) found.add(name)
      }
    }
    return [...found]
  }, PLAYER_COLOUR_NAMES)

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
    location?: { tokensFound: number; spacing: number; extraTokens: number }
    pieces?: { buildings: { colour: string }[]; roads: { colour: string }[] }
  }
}

type Capture = {
  file: string
  takenAt: string
  ok: boolean
  tokens: number
  buildings: number
  roads: number
  colours: string[]
  reason?: string
}
type Game = {
  roomCode: string
  url: string
  mode: string
  map: string
  turnTimer: string
  agent: string
  claimedAt: string
  finishedAt?: string
  seats: string[]
  wanted: string[]
  viewport: typeof VIEWPORT
  captures: Capture[]
  notes: string[]
}
const gameFile = (dir: string) => resolve(dir, 'game.json')
const loadGame = (dir: string): Game => JSON.parse(readFileSync(gameFile(dir), 'utf8')) as Game
const saveGame = (dir: string, game: Game) => writeFileSync(gameFile(dir), JSON.stringify(game, null, 2) + '\n')

/** Screenshots are serialised and taken with the tab in front, otherwise the hidden canvas is stale. */
let frontLock: Promise<void> = Promise.resolve()
const withFront = <T>(page: Page, fn: () => Promise<T>): Promise<T> => {
  const run = frontLock.then(async () => {
    await page.bringToFront()
    await sleep(1200)
    return fn()
  })
  frontLock = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

/** Dismisses the mode info card and parks the pointer over the empty bottom bar so no tooltip covers the board. */
const settleIn = async (page: Page) => {
  await sleep(SETTLE_MS)
  await withFront(page, async () => {
    await page.mouse.click(700, VIEWPORT.height - 40).catch(() => undefined)
    await page.mouse.move(700, VIEWPORT.height - 30)
    await sleep(800)
  })
}

/** On the Game Over overlay, the "Map" button reveals the complete final board. */
const revealFinalBoardIfOver = async (page: Page, game: Game): Promise<'playing' | 'final' | 'unreachable'> => {
  if (!(await gameState(page)).ended) return 'playing'
  const clicked = await withFront(page, () => clickText(page, 'Map', 'prefix'))
  if (clicked) {
    await sleep(4000)
    // The click sometimes leaves the room (the site then shows the lobby with a sign-up dialog).
    const state = await gameState(page)
    if (state.canvases >= 2 && !state.inLobby && roomCodeOf(page.url()) === game.roomCode) {
      game.notes.push('game over: captured the final board via the Map button')
      return 'final'
    }
    game.notes.push('game over: the Map button left the room')
    return 'unreachable'
  }
  game.notes.push('game over overlay without a Map button')
  return 'unreachable'
}

/** Takes one capture into the game folder and records it; returns whether it was readable. */
const captureOnce = async (page: Page, dir: string, game: Game): Promise<Capture> => {
  const seq = game.captures.length + 1
  const base = `${String(seq).padStart(2, '0')}-${hhmmss()}`
  const png = resolve(dir, `${base}.png`)
  const json = resolve(dir, `${base}.reading.json`)
  await withFront(page, () => page.screenshot({ path: png }))
  let reading: ReturnType<typeof readCapture>
  try {
    reading = readCapture(png, json)
  } catch (error) {
    reading = { ok: false, reason: `read-capture failed: ${(error as Error).message.slice(0, 200)}` }
    writeFileSync(json, JSON.stringify(reading, null, 2) + '\n')
  }
  const tokens = reading.location?.tokensFound ?? 0
  const extra = reading.location?.extraTokens ?? 0
  const ok = reading.ok && tokens >= MIN_TOKENS && extra <= MAX_EXTRA_TOKENS
  const colours = [
    ...new Set([...(reading.pieces?.buildings ?? []), ...(reading.pieces?.roads ?? [])].map((p) => p.colour)),
  ]
  const capture: Capture = {
    file: `${base}.png`,
    takenAt: stamp(),
    ok,
    tokens,
    buildings: reading.pieces?.buildings.length ?? 0,
    roads: reading.pieces?.roads.length ?? 0,
    colours,
    ...(ok
      ? {}
      : {
          reason:
            reading.reason ??
            (tokens < MIN_TOKENS ? `only ${tokens} tokens` : `${extra} stray tokens: not the base map`),
        }),
  }
  game.captures.push(capture)
  saveGame(dir, game)
  log(
    `${game.roomCode} capture ${seq}: ${ok ? `ok, ${colours.length} colours, ${capture.buildings} buildings, ${capture.roads} roads` : `rejected (${capture.reason})`}`
  )
  return capture
}

/** Removes a capture that turned out unreadable, so no junk frame stays in the set. */
const discardCapture = (dir: string, game: Game, capture: Capture) => {
  game.captures = game.captures.filter((c) => c !== capture)
  rmSync(resolve(dir, capture.file), { force: true })
  rmSync(resolve(dir, capture.file.replace(/\.png$/, '.reading.json')), { force: true })
  saveGame(dir, game)
}

const finishGame = (dir: string, game: Game, why: string) => {
  const good = game.captures.filter((c) => c.ok)
  game.finishedAt = stamp()
  game.notes.push(why)
  saveGame(dir, game)
  if (good.length === 0) {
    rmSync(dir, { recursive: true, force: true })
    reject(game.roomCode, AGENT, 'no readable capture')
    return
  }
  const last = good.at(-1)
  finish(game.roomCode, AGENT, {
    captures: good.length,
    colours: [...new Set(good.flatMap((c) => c.colours))],
    buildings: last?.buildings,
    roads: last?.roads,
    seats: game.seats,
  })
  log(`${game.roomCode} done: ${good.length} captures (${why})`)
}

// ---------------------------------------------------------------------------------------------- scout

const scoutOne = async (page: Page): Promise<'queued' | 'skipped' | 'nothing' | 'full'> => {
  if (loadQueue().length >= MAX_QUEUE) return 'full'
  const rows = await openSpectateList(page)
  const candidates = rows.filter((r) => r.map === ACCEPTED_MAP && isAcceptedMode(r.mode))
  log(`spectate list: ${rows.length} games, ${candidates.length} base-map games in accepted modes`)
  if (candidates.length === 0) return 'nothing'

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
    return scoutGame(page, roomCode, row)
  }
  return 'nothing'
}

const scoutGame = async (page: Page, roomCode: string, row: Row): Promise<'queued' | 'skipped'> => {
  const dir = resolve(GAMES_DIR, `${yyyymmdd()}-${roomCode}`)
  const game: Game = {
    roomCode,
    url: page.url(),
    mode: row.mode,
    map: row.map,
    turnTimer: row.timer,
    agent: AGENT,
    claimedAt: stamp(),
    seats: [],
    wanted: [],
    viewport: VIEWPORT,
    captures: [],
    notes: [],
  }

  await settleIn(page)
  game.seats = await readSeatColours(page).catch(() => [])
  const gaps = readGaps()
  game.wanted = wantedSeats(game.seats, row.mode, gaps)
  if (game.seats.length > 0 && game.wanted.length === 0) {
    const gapColours = game.seats.filter((c) => gaps[c])
    log(
      `${roomCode} skipped: seats ${game.seats.join(',')} ${gapColours.length ? `only need Cities & Knights pieces (${gapColours.join(',')}) and this is ${row.mode}` : `have no wanted colour (${Object.keys(gaps).join(',')})`}`
    )
    skip(roomCode, AGENT, game.seats)
    return 'skipped'
  }
  if (game.seats.length === 0) game.notes.push('seat colours not found on the page; watched anyway')
  mkdirSync(dir, { recursive: true })
  saveGame(dir, game)
  log(
    `${roomCode} wanted: ${game.wanted.map((c) => `${c} [${(gaps[c] ?? []).filter((v) => obtainableIn(v, row.mode)).join(', ')}]`).join('; ') || 'unknown seats'} (seats ${game.seats.join(',')}, ${row.mode})`
  )

  const over = await revealFinalBoardIfOver(page, game)
  if (over === 'unreachable') {
    reject(roomCode, AGENT, 'game already over')
    rmSync(dir, { recursive: true, force: true })
    return 'skipped'
  }

  for (let attempt = 1; ; attempt++) {
    const capture = await captureOnce(page, dir, game)
    if (capture.ok) break
    if (attempt < FIRST_CAPTURE_ATTEMPTS) {
      game.captures.pop()
      rmSync(resolve(dir, capture.file), { force: true })
      rmSync(resolve(dir, capture.file.replace(/\.png$/, '.reading.json')), { force: true })
      log(`${roomCode} first capture not readable yet, retrying (${attempt + 1}/${FIRST_CAPTURE_ATTEMPTS})`)
      await sleep(FIRST_CAPTURE_RETRY_MS)
      continue
    }
    game.notes.push('rejected: first capture unreadable')
    saveGame(dir, game)
    mkdirSync(REJECTED_DIR, { recursive: true })
    rmSync(resolve(REJECTED_DIR, `${yyyymmdd()}-${roomCode}`), { recursive: true, force: true })
    renameSync(dir, resolve(REJECTED_DIR, `${yyyymmdd()}-${roomCode}`))
    reject(roomCode, AGENT, capture.reason ?? 'unreadable')
    return 'skipped'
  }

  if (over === 'final') {
    finishGame(dir, game, 'final board captured on the first visit')
    return 'queued'
  }
  const queue = modifyQueue((q) => {
    q.push({
      roomCode,
      url: game.url,
      dir,
      seats: game.seats,
      wanted: game.wanted,
      agent: AGENT,
      addedAt: stamp(),
      nextVisitAt: new Date(Date.now() + revisitInterval(q.length + 1)).toISOString(),
      visits: 1,
      maxVisits: MAX_VISITS,
      failures: 0,
    })
  })
  log(
    `${roomCode} queued, next visit in ${Math.round(revisitInterval(queue.length) / 60_000)} min (${queue.length} in queue)`
  )
  return 'queued'
}

// -------------------------------------------------------------------------------------------- revisit

const revisit = async (page: Page, entry: Revisit) => {
  const drop = () => modifyQueue((q) => q.filter((r) => r.roomCode !== entry.roomCode))
  /** Patches this entry in the stored queue and returns the queue length, for the next interval. */
  const update = (patch: Partial<Revisit>): number =>
    modifyQueue((q) => {
      const current = q.find((r) => r.roomCode === entry.roomCode)
      if (current) Object.assign(current, patch)
    }).length
  if (!existsSync(gameFile(entry.dir))) {
    log(`${entry.roomCode} revisit: game folder is gone, dropping`)
    drop()
    return
  }
  const game = loadGame(entry.dir)
  heartbeat(entry.roomCode, AGENT)

  await page.goto(entry.url, { waitUntil: 'networkidle2', timeout: 60_000 }).catch(() => undefined)
  await settleIn(page)
  const state = await gameState(page)
  if (state.canvases < 2 || state.inLobby || roomCodeOf(page.url()) !== entry.roomCode) {
    const failures = entry.failures + 1
    if (failures >= MAX_REVISIT_FAILURES) {
      log(`${entry.roomCode} revisit: could not reach the game ${failures} times, finishing`)
      drop()
      finishGame(entry.dir, game, `revisits stopped: game unreachable after ${entry.visits} visits`)
    } else {
      log(`${entry.roomCode} revisit: no game canvas (hash ${state.hash || 'none'}), will retry`)
      update({ failures, nextVisitAt: new Date(Date.now() + revisitInterval(loadQueue().length)).toISOString() })
    }
    return
  }

  const over = await revealFinalBoardIfOver(page, game)
  if (over === 'unreachable') {
    drop()
    finishGame(entry.dir, game, `game over after ${entry.visits} visits`)
    return
  }
  const capture = await captureOnce(page, entry.dir, game)
  const visits = entry.visits + 1
  if (over === 'final') {
    if (!capture.ok) discardCapture(entry.dir, game, capture)
    drop()
    finishGame(entry.dir, game, capture.ok ? `final board captured on visit ${visits}` : `game over on visit ${visits}`)
    return
  }
  if (visits >= entry.maxVisits) {
    drop()
    finishGame(entry.dir, game, `visit budget of ${entry.maxVisits} spent`)
    return
  }
  const interval = revisitInterval(loadQueue().length)
  update({ visits, failures: 0, nextVisitAt: new Date(Date.now() + interval).toISOString() })
  log(`${entry.roomCode} revisit ${visits}/${entry.maxVisits} done, next in ${Math.round(interval / 60_000)} min`)
}

// ----------------------------------------------------------------------------------------------- main

const main = async () => {
  const profile = values.profile ?? resolve(PROFILES_DIR, AGENT)
  mkdirSync(profile, { recursive: true })
  const browser: Browser = await puppeteer.launch({
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
      const accepted = rows.filter((r) => r.map === ACCEPTED_MAP && isAcceptedMode(r.mode))
      console.table(accepted.slice(0, 30))
      console.log(`${rows.length} rows, ${accepted.length} base-map games in accepted modes`)
      return
    }
    const pending = loadQueue().length
    if (pending > 0) log(`resuming ${pending} queued game(s) from ${resolve(EXAMPLES_DIR, 'revisit.json')}`)

    const scoutPage = await browser.newPage()
    await scoutPage.setViewport(VIEWPORT)
    const revisitPage = await browser.newPage()
    await revisitPage.setViewport(VIEWPORT)

    const scoutLoop = async () => {
      let idle = 0
      while (!shouldStop()) {
        const outcome = await scoutOne(scoutPage).catch((error: Error) => {
          log(`scout error: ${error.message.slice(0, 300)}`)
          return 'nothing' as const
        })
        if (values.once) break
        if (outcome === 'full') {
          await sleep(60_000)
          continue
        }
        idle = outcome === 'nothing' ? idle + 1 : 0
        if (outcome === 'nothing') await sleep(Math.min(120_000, 15_000 * idle))
      }
    }
    const revisitLoop = async () => {
      while (!shouldStop()) {
        const due = dueNow(loadQueue())
        if (due) {
          await revisit(revisitPage, due).catch((error: Error) => {
            log(`revisit error (${due.roomCode}): ${error.message.slice(0, 300)}`)
          })
        } else if (values.once && loadQueue().length === 0) break
        await sleep(15_000)
      }
    }
    await Promise.all([scoutLoop(), revisitLoop()])
    log(shouldStop() ? 'stop requested' : 'exiting')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  log(`fatal: ${(error as Error).stack ?? error}`)
  process.exit(1)
})
