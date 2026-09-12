/**
 * Re-runs the extension reading on every capture under examples/games (and examples/rejected when asked),
 * rewriting the *.reading.json files and the per-game summaries. Use after retraining or changing the
 * vision code, so the stored readings always reflect the current models.
 *
 *   node --import tsx src/collect/reread.ts [--rejected]
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { EXTENSION_DIR } from '../paths.ts'
import { EXAMPLES_DIR, GAMES_DIR } from './registry.ts'

const dirs = [GAMES_DIR, ...(process.argv.includes('--rejected') ? [resolve(EXAMPLES_DIR, 'rejected')] : [])]
let captures = 0
let ok = 0

for (const root of dirs) {
  if (!existsSync(root)) continue
  for (const game of readdirSync(root).sort()) {
    const dir = resolve(root, game)
    const gameFile = resolve(dir, 'game.json')
    if (!existsSync(gameFile)) continue
    const meta = JSON.parse(readFileSync(gameFile, 'utf8')) as {
      captures: Array<{
        file: string
        ok: boolean
        tokens?: number
        buildings: number
        roads: number
        colours: string[]
        reason?: string
      }>
    }
    for (const capture of meta.captures) {
      const png = resolve(dir, capture.file)
      const json = png.replace(/\.png$/, '.reading.json')
      if (!existsSync(png)) continue
      captures++
      try {
        execFileSync('npx', ['vite-node', 'scripts/read-capture.ts', png, json], {
          cwd: EXTENSION_DIR,
          stdio: 'pipe',
          timeout: 180_000,
        })
      } catch (error) {
        console.log(`${game}/${capture.file}: read failed (${(error as Error).message.slice(0, 120)})`)
        continue
      }
      const reading = JSON.parse(readFileSync(json, 'utf8')) as {
        ok: boolean
        reason?: string
        location?: { tokensFound: number }
        pieces?: { buildings: { colour: string; kind: string }[]; roads: { colour: string }[] }
      }
      const tokens = reading.location?.tokensFound ?? 0
      capture.ok = reading.ok && tokens >= 15
      capture.tokens = tokens
      capture.buildings = reading.pieces?.buildings.length ?? 0
      capture.roads = reading.pieces?.roads.length ?? 0
      capture.colours = [
        ...new Set([...(reading.pieces?.buildings ?? []), ...(reading.pieces?.roads ?? [])].map((p) => p.colour)),
      ]
      if (capture.ok) {
        delete capture.reason
        ok++
      } else capture.reason = reading.reason ?? `only ${tokens} tokens`
      const kinds = (reading.pieces?.buildings ?? []).reduce<Record<string, number>>(
        (acc, b) => ((acc[b.kind] = (acc[b.kind] ?? 0) + 1), acc),
        {}
      )
      console.log(
        `${game}/${capture.file}: ${capture.ok ? 'ok' : 'not ok'} tokens ${tokens} ${JSON.stringify(kinds)} roads ${capture.roads} colours ${capture.colours.join(',')}`
      )
    }
    writeFileSync(gameFile, JSON.stringify(meta, null, 2) + '\n')
  }
}
console.log(`re-read ${captures} captures, ${ok} readable`)
