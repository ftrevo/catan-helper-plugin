/**
 * Scores every shipped model set on every fixture screenshot, exactly as the popup would read them.
 *
 *   npm run evaluate
 *
 * Prints one table per fixture (correct tiles per set) and a summary, so model sets can be compared before
 * changing the default in src/vision/modelSets.ts.
 */
import { createBoardReader } from '../src/vision/boardReader'
import { MODEL_SETS, modelSetPaths } from '../src/vision/modelSets'
import { FIXTURES, FIXTURE_PIECES } from '../test/fixtures'
import { NO_PIECES } from '../src/domain/pieces'
import { locateBoard } from '../src/vision/boardLocator'
import { pieceModelPaths } from '../src/vision/modelSets'
import { createPieceReader } from '../src/vision/pieceReader'
import { loadPng } from '../test/loadPng'
import { nodeModelSource } from '../test/nodeModelSource'

type Score = { resources: number; numbers: number; confidence: number; mistakes: string[]; error?: string }

const scores = new Map<string, Map<string, Score>>()

for (const set of MODEL_SETS) {
  const paths = modelSetPaths(set.id)
  let reader
  try {
    reader = await createBoardReader({
      resources: await nodeModelSource(`public/${paths.resources}`),
      numbers: await nodeModelSource(`public/${paths.numbers}`),
    })
  } catch (error) {
    console.log(`skipping ${set.id}: ${(error as Error).message}`)
    continue
  }
  const perFixture = new Map<string, Score>()

  for (const fixture of FIXTURES) {
    try {
      const { board, confidence } = await reader.read(await loadPng(fixture.file))
      const mistakes: string[] = []
      let resources = 0
      let numbers = 0
      board.tiles.forEach((tile, i) => {
        if (tile.resource === fixture.truth.resources[i]) resources++
        else mistakes.push(`tile ${i}: ${tile.resource} (expected ${fixture.truth.resources[i]})`)
        if (tile.number === fixture.truth.numbers[i]) numbers++
        else mistakes.push(`tile ${i}: ${tile.number} (expected ${fixture.truth.numbers[i]})`)
      })
      const mean = confidence.reduce((sum, c) => sum + c.resource + c.number, 0) / (confidence.length * 2)
      perFixture.set(fixture.name, { resources, numbers, confidence: mean, mistakes })
    } catch (error) {
      perFixture.set(fixture.name, { resources: 0, numbers: 0, confidence: 0, mistakes: [], error: String(error) })
    }
  }

  reader.dispose()
  scores.set(set.id, perFixture)
}

const pad = (text: string, width: number) => text.padEnd(width)
const setWidth = Math.max(...MODEL_SETS.map((s) => s.id.length), 9)

const evaluated = MODEL_SETS.filter((set) => scores.has(set.id))
console.log(`\n${pad('fixture', 44)} ${evaluated.map((s) => pad(s.id, setWidth + 14)).join('')}`)
for (const fixture of FIXTURES) {
  const cells = evaluated.map((set) => {
    const score = scores.get(set.id)?.get(fixture.name)
    if (!score) return pad('-', setWidth + 14)
    if (score.error) return pad('error', setWidth + 14)
    return pad(`${score.resources}/19 res ${score.numbers}/19 num`, setWidth + 14)
  })
  console.log(`${pad(fixture.name, 44)} ${cells.join('')}`)
}

console.log('\nsummary')
for (const set of evaluated) {
  const perFixture = [...(scores.get(set.id)?.values() ?? [])]
  const correct = perFixture.reduce((sum, s) => sum + s.resources + s.numbers, 0)
  const total = perFixture.length * 38
  const confidence = perFixture.reduce((sum, s) => sum + s.confidence, 0) / perFixture.length
  console.log(`  ${pad(set.id, setWidth)}  ${correct}/${total} tiles correct, mean confidence ${confidence.toFixed(3)}`)
  for (const [name, score] of scores.get(set.id) ?? []) {
    for (const mistake of score.mistakes) console.log(`    ${name}: ${mistake}`)
    if (score.error) console.log(`    ${name}: ${score.error}`)
  }
}

// Piece detectors: exact matches of (position, kind, colour) against the hand-labelled fixtures.
try {
  const paths = pieceModelPaths()
  const pieceReader = await createPieceReader({
    buildings: await nodeModelSource(`public/${paths.buildings}`),
    colours: await nodeModelSource(`public/${paths.colours}`),
    roads: await nodeModelSource(`public/${paths.roads}`),
  })
  console.log('\npieces')
  let hits = 0
  let expectedTotal = 0
  let predictedTotal = 0
  for (const fixture of FIXTURES) {
    const image = await loadPng(fixture.file)
    const { pieces } = await pieceReader.read(image, locateBoard(image))
    const truth = FIXTURE_PIECES[fixture.file] ?? NO_PIECES
    const key = (p: { vertex?: number; edge?: number; kind?: string; colour: string }) =>
      `${p.vertex ?? 'e' + p.edge}:${p.kind ?? 'road'}:${p.colour}`
    const expected = new Set([...truth.buildings, ...truth.roads].map(key))
    const predicted = new Set([...pieces.buildings, ...pieces.roads].map(key))
    const correct = [...predicted].filter((k) => expected.has(k)).length
    hits += correct
    expectedTotal += expected.size
    predictedTotal += predicted.size
    const missed = [...expected].filter((k) => !predicted.has(k))
    const extra = [...predicted].filter((k) => !expected.has(k))
    console.log(
      `  ${pad(fixture.name, 44)} ${correct}/${expected.size} found, ${extra.length} spurious${missed.length ? ` · missed ${missed.join(' ')}` : ''}${extra.length ? ` · extra ${extra.join(' ')}` : ''}`
    )
  }
  console.log(`  recall ${hits}/${expectedTotal}, precision ${hits}/${predictedTotal}`)
  pieceReader.dispose()
} catch (error) {
  console.log(`\npieces: skipped (${(error as Error).message})`)
}
