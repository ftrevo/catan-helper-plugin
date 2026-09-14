/**
 * Writes examples/variants.json, the gap report the focus worker reads, from the curated map
 * (examples/curated/map.json, built by `npm run curate`). Unlike `npm run variants`, which counts piece
 * sightings in the raw readings, this counts IMAGES that contain each asset after the classification 3
 * corrections (relabels, drops, phantom colours removed), so the wanted list matches the "N images per
 * asset" goal and is not inflated by misreads.
 *
 *   npm run gaps -- [--min N]        (default 5)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { EXAMPLES_DIR } from './paths.ts'

const COLOURS = [
  'red',
  'blue',
  'orange',
  'black',
  'green',
  'white',
  'pink',
  'purple',
  'mysticblue',
  'silver',
  'gold',
  'bronze',
]
const VARIANTS = [
  'settlement',
  'city',
  'road',
  'metropolis science',
  'metropolis politics',
  'metropolis trade',
  'knight level 1 active',
  'knight level 1 inactive',
  'knight level 2 active',
  'knight level 2 inactive',
  'knight level 3 active',
  'knight level 3 inactive',
]

type CuratedMap = {
  generatedAt: string
  assetTypes: { colour: string; variant: string; totalImagesAvailable: number; totalGamesAvailable?: number }[]
}

const args = process.argv.slice(2)
const minIndex = args.indexOf('--min')
const min = minIndex >= 0 ? Number(args[minIndex + 1]) : 5
const mapFile = resolve(EXAMPLES_DIR, 'curated', 'map.json')
const outFile = resolve(EXAMPLES_DIR, 'variants.json')

const map = JSON.parse(readFileSync(mapFile, 'utf8')) as CuratedMap
const counts: Record<string, Record<string, number>> = {}
const games: Record<string, Record<string, number>> = {}
const gaps: Record<string, Record<string, number>> = {}
for (const colour of COLOURS) {
  counts[colour] = {}
  games[colour] = {}
  for (const variant of VARIANTS) {
    const entry = map.assetTypes.find((a) => a.colour === colour && a.variant === variant)
    const n = entry?.totalImagesAvailable ?? 0
    counts[colour][variant] = n
    games[colour][variant] = entry?.totalGamesAvailable ?? 0
    if (n < min) (gaps[colour] ??= {})[variant] = n
  }
}

writeFileSync(
  outFile,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      min,
      unit: 'images containing the asset (corrected labels)',
      source: { map: 'examples/curated/map.json', mapGeneratedAt: map.generatedAt },
      counts,
      games,
      gaps,
    },
    null,
    2
  ) + '\n'
)
const list = Object.entries(gaps).flatMap(([colour, g]) => Object.entries(g).map(([v, n]) => `${colour} ${v} (${n})`))
console.log(`gaps below ${min} images: ${list.length}\n${list.join('\n')}`)
