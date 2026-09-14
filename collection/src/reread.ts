/**
 * Re-runs the extension reading on every capture under examples/games (and examples/rejected when asked),
 * rewriting the *.reading.json files and the per-game summaries. Use after retraining or changing the
 * vision code, so the stored readings always reflect the current models.
 *
 * Captures curated into examples/kept (and examples/kept/corner-cases/<case>) keep their game.json entry
 * under examples/games, so each capture is looked up across all of those roots.
 *
 *   npm run reread -- [--rejected] [--check]
 *
 * --check only reports where every capture resolves (or that it is missing) without re-reading anything.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { type GameMeta, rereadCapture } from './reading.ts'
import { EXAMPLES_DIR, GAMES_DIR } from './registry.ts'

const KEPT_DIR = resolve(EXAMPLES_DIR, 'kept')
const CORNER_DIR = resolve(KEPT_DIR, 'corner-cases')
const check = process.argv.includes('--check')

const dirs = [GAMES_DIR, ...(process.argv.includes('--rejected') ? [resolve(EXAMPLES_DIR, 'rejected')] : [])]

/** Folders that may hold a game's captures besides its own folder under `root`. */
const captureRoots = (root: string): string[] => [
  root,
  KEPT_DIR,
  ...(existsSync(CORNER_DIR) ? readdirSync(CORNER_DIR).map((c) => resolve(CORNER_DIR, c)) : []),
]

/** The folder that actually holds `file` for `game`, or undefined when the capture is gone. */
const findCaptureDir = (root: string, game: string, file: string): string | undefined =>
  captureRoots(root)
    .map((r) => resolve(r, game))
    .find((dir) => existsSync(resolve(dir, file)))

let captures = 0
let ok = 0
let moved = 0
let missing = 0

for (const root of dirs) {
  if (!existsSync(root)) continue
  for (const game of readdirSync(root).sort()) {
    const dir = resolve(root, game)
    const gameFile = resolve(dir, 'game.json')
    if (!existsSync(gameFile)) continue
    const meta = JSON.parse(readFileSync(gameFile, 'utf8')) as GameMeta
    for (const capture of meta.captures) {
      const captureDir = findCaptureDir(root, game, capture.file)
      if (!captureDir) {
        missing++
        if (check) console.log(`${game}/${capture.file}: missing`)
        continue
      }
      captures++
      if (captureDir !== dir) moved++
      if (check) {
        if (captureDir !== dir) console.log(`${game}/${capture.file}: ${captureDir.replace(EXAMPLES_DIR + '/', '')}`)
        continue
      }
      const kinds = rereadCapture(captureDir, capture, meta.anyMap)
      if (!kinds) {
        console.log(`${game}/${capture.file}: read failed`)
        continue
      }
      if (capture.ok) ok++
      console.log(
        `${game}/${capture.file}: ${capture.ok ? 'ok' : 'not ok'} tokens ${capture.tokens} ${JSON.stringify(kinds)} roads ${capture.roads} colours ${capture.colours.join(',')}`
      )
    }
    if (!check) writeFileSync(gameFile, JSON.stringify(meta, null, 2) + '\n')
  }
}
if (check) console.log(`${captures} captures resolve (${moved} outside their game folder), ${missing} missing`)
else console.log(`re-read ${captures} captures, ${ok} readable`)
