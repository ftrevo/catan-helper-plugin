/**
 * Re-reads the rooms under examples/rejected with the current vision code and moves those whose captures
 * now pass back into examples/games, marking them done in the registry. Use after a locator fix that was
 * wrongly rejecting standard boards.
 *
 *   npm run recover
 */
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { type GameMeta, rereadCapture } from './reading.ts'
import { EXAMPLES_DIR, GAMES_DIR, recover } from './registry.ts'

const rejectedDir = resolve(EXAMPLES_DIR, 'rejected')
let recovered = 0

for (const game of readdirSync(rejectedDir).sort()) {
  const dir = resolve(rejectedDir, game)
  const gameFile = resolve(dir, 'game.json')
  if (!existsSync(gameFile)) continue
  const meta = JSON.parse(readFileSync(gameFile, 'utf8')) as GameMeta
  const captures = meta.captures.filter((c) => existsSync(resolve(dir, c.file)))
  for (const capture of captures) rereadCapture(dir, capture)
  const good = captures.filter((c) => c.ok)
  if (good.length === 0) {
    console.log(`${game}: still rejected (${captures.map((c) => c.reason).join('; ')})`)
    continue
  }
  meta.notes = [...meta.notes.filter((n) => !n.startsWith('rejected:')), 'recovered: re-read after a locator fix']
  writeFileSync(gameFile, JSON.stringify(meta, null, 2) + '\n')
  renameSync(dir, resolve(GAMES_DIR, game))
  recover(meta.roomCode, {
    captures: good.length,
    colours: [...new Set(good.flatMap((c) => c.colours))],
    buildings: Math.max(...good.map((c) => c.buildings)),
    roads: Math.max(...good.map((c) => c.roads)),
  })
  recovered++
  console.log(`${game}: recovered with ${good.length} capture(s), tokens ${good.map((c) => c.tokens).join('/')}`)
}
console.log(`recovered ${recovered} rooms`)
