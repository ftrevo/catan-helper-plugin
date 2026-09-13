/**
 * Re-runs the extension reading on every capture under examples/games (and examples/rejected when asked),
 * rewriting the *.reading.json files and the per-game summaries. Use after retraining or changing the
 * vision code, so the stored readings always reflect the current models.
 *
 *   npm run reread -- [--rejected]
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { type GameMeta, rereadCapture } from './reading.ts'
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
    const meta = JSON.parse(readFileSync(gameFile, 'utf8')) as GameMeta
    for (const capture of meta.captures) {
      if (!existsSync(resolve(dir, capture.file))) continue
      captures++
      const kinds = rereadCapture(dir, capture)
      if (!kinds) {
        console.log(`${game}/${capture.file}: read failed`)
        continue
      }
      if (capture.ok) ok++
      console.log(
        `${game}/${capture.file}: ${capture.ok ? 'ok' : 'not ok'} tokens ${capture.tokens} ${JSON.stringify(kinds)} roads ${capture.roads} colours ${capture.colours.join(',')}`
      )
    }
    writeFileSync(gameFile, JSON.stringify(meta, null, 2) + '\n')
  }
}
console.log(`re-read ${captures} captures, ${ok} readable`)
