/**
 * Curates `examples/curated`: a navigable map of the captured board images per player colour and asset
 * type, built from classification A (`examples/games/<game>/<capture>.reading.json`) corrected in memory
 * by classification 3 (`examples/classification-v3/<game>/<capture>.b.json`) and its audit.
 *
 * Nothing under `examples/games` is touched: kept images are COPIED into `examples/curated/images/`.
 * Writes map.json, map.md and a plain-HTML browser (index.html, <colour>/index.html, <colour>/<asset>.html)
 * with no CSS, no JavaScript and no external resources.
 *
 *   node --import tsx src/curate.ts
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { TILE_VERTICES, VERTEX_TILES } from '../../extension-local/src/domain/vertices.ts'
import { EDGES } from '../../extension-local/src/domain/edges.ts'
import { vertexCenters } from '../../extension-local/src/vision/layout.ts'
import { EXAMPLES_DIR } from './paths.ts'
import { GAMES_DIR, readRegistry } from './registry.ts'

const V3_DIR = resolve(EXAMPLES_DIR, 'classification-v3')
const OUT_DIR = resolve(EXAMPLES_DIR, 'curated')
const IMAGES_DIR = resolve(OUT_DIR, 'images')

/* ------------------------------------------------------------------------------------------ the world */

const COLOURS = [
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
] as const

/** The asset variants a curation covers. "knight unknown" / "metropolis unknown" are not among them. */
const VARIANTS = [
  'settlement',
  'city',
  'road',
  'metropolis science',
  'metropolis politics',
  'metropolis trade',
  ...[1, 2, 3].flatMap((l) => ['active', 'inactive'].map((s) => `knight level ${l} ${s}`)),
]
const IS_VARIANT = new Set(VARIANTS)

const CASES = ['board-edge', 'shore-road', 'metropolis-tower-overlap', 'near-robber', 'near-merchant'] as const
type CaseName = (typeof CASES)[number]

const CASE_RULES: Record<CaseName, string> = {
  'board-edge':
    'A settlement, city, metropolis or knight standing on an outer-corner vertex - a vertex that belongs to exactly one tile (18 of the 54), so the sprite is drawn half over the sea and the shore tile art.',
  'shore-road':
    'A road on a shore edge - an edge that borders exactly one tile (30 of the 72), so the road runs along the coastline with sea and harbour art behind it.',
  'metropolis-tower-overlap':
    'A metropolis tower whose drawn sprite rectangle overlaps the sprite of a piece on a neighbouring vertex by more than 2% of a building sprite area. Both the covering metropolis and the covered piece are flagged. Draw geometry: buildings 154 px at spacing/416*1.2 anchored -0.065 spacings above the vertex, the tower the same scale offset 0.28*154*pieceScale to the right, knight badges 0.35 spacings centred on the vertex.',
  'near-robber': 'The piece touches the tile the robber stands on (classification 3 `near-robber` flag).',
  'near-merchant':
    'The piece touches the tile the Cities & Knights merchant stands on (classification 3 `near-merchant` flag).',
}

/** The five drop-piece actions the audit marked unclear: kept as A reads them and tagged `uncertain`. */
const UNCLEAR_DROPS = new Set([
  '20260912-crop490/01-211026 e26',
  '20260912-crop490/02-211300 e26',
  '20260914-event659/03-034252 e37',
  '20260914-ore1633/07-002852 e57',
  '20260913-army4015/13-232427 e21',
])

/** The one complete-seats action of classification 3. */
const SEAT_COMPLETIONS: Record<string, string[]> = { '20260913-fort4077': ['purple'] }

const RARE_MAX = 10
const MIN_PER_ASSET = 5
const SOFT_MAX_PER_ASSET = 10
const MAX_PER_CORNER_BUCKET = 3

/* -------------------------------------------------------------------------------------------- geometry */

/** Vertex centres in units of spacing, relative to the board centre: the lattice is the same everywhere. */
const VERTEX_POS = vertexCenters({ center: { x: 0, y: 0 }, spacing: 1 })
const OUTER_VERTICES = new Set(VERTEX_TILES.flatMap((tiles, v) => (tiles.length === 1 ? [v] : [])))
const EDGE_TILES = EDGES.map(([a, b]) =>
  TILE_VERTICES.flatMap((vs, t) => (vs.includes(a as never) && vs.includes(b as never) ? [t] : []))
)
const SHORE_EDGES = new Set(EDGE_TILES.flatMap((tiles, e) => (tiles.length === 1 ? [e] : [])))

const PIECE_SCALE = 1.2 / 416
const BUILDING_SIDE = 154 * PIECE_SCALE
const TOWER_SIDE = 155 * PIECE_SCALE
const TOWER_DX = 0.28 * 154 * PIECE_SCALE
const BUILDING_ANCHOR_DY = -0.065
const KNIGHT_SIDE = 0.35
const OVERLAP_THRESHOLD = 0.02 * BUILDING_SIDE * BUILDING_SIDE

type Rect = { x0: number; y0: number; x1: number; y1: number }
const squareAt = (cx: number, cy: number, side: number): Rect => ({
  x0: cx - side / 2,
  y0: cy - side / 2,
  x1: cx + side / 2,
  y1: cy + side / 2,
})
const overlap = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0))

const spriteRect = (vertex: number, kind: string): Rect => {
  const p = VERTEX_POS[vertex] ?? { x: 0, y: 0 }
  return kind === 'knight' ? squareAt(p.x, p.y, KNIGHT_SIDE) : squareAt(p.x, p.y + BUILDING_ANCHOR_DY, BUILDING_SIDE)
}
const towerRect = (vertex: number): Rect => {
  const p = VERTEX_POS[vertex] ?? { x: 0, y: 0 }
  return squareAt(p.x + TOWER_DX, p.y + BUILDING_ANCHOR_DY, TOWER_SIDE)
}

/* ------------------------------------------------------------------------------------------ input data */

type Reading = {
  ok: boolean
  location?: { center: { x: number; y: number }; spacing: number }
  pieces?: {
    buildings?: { vertex: number; kind: string; colour: string }[]
    roads?: { edge: number; colour: string }[]
  }
}

type BPiece = {
  vertex?: number
  edge?: number
  A: { kind: string; colour: string | null }
  B: {
    kind: string
    colour: string | null
    colourSeatConstrained: string | null
    type?: string
    level?: number
    state?: string
    scores: { best: number | null }
  }
  flags: string[]
}

type BCapture = {
  game: string
  capture: string
  skipped?: string
  seats: { colours: string[]; inferred: boolean } | null
  robber: { tile: number } | null
  merchant: { tile: number; colour: string } | null
  overlaySuspected: boolean
  overlayRules: string[]
  pieces: BPiece[]
}

const gameDirs = readdirSync(V3_DIR)
  .filter((d) => statSync(resolve(V3_DIR, d)).isDirectory() && !d.startsWith('crops') && !d.startsWith('audit'))
  .sort()

const registry = readRegistry()
/** Only games the registry calls done or watching, or does not know at all, are curated. */
const eligibleGame = (game: string) => {
  const claim = registry.claims[game.replace(/^\d{8}-/, '')]
  return !claim || claim.status === 'done' || claim.status === 'watching'
}

const captures: BCapture[] = []
const skipped: string[] = []
const ineligible: string[] = []
for (const game of gameDirs) {
  if (!eligibleGame(game)) {
    ineligible.push(game)
    continue
  }
  for (const file of readdirSync(resolve(V3_DIR, game))
    .filter((f) => f.endsWith('.b.json'))
    .sort()) {
    const c = JSON.parse(readFileSync(resolve(V3_DIR, game, file), 'utf8')) as BCapture
    if (c.skipped) skipped.push(`${c.game}/${c.capture} (${c.skipped})`)
    else captures.push(c)
  }
}

/* ------------------------------------------------------------------------------ corrections, in memory */

type Correction = { action: string; position: string; from?: string; to?: string; note?: string }
type Piece = { position: string; vertex?: number; edge?: number; colour: string; variant: string; flags: string[] }

type Img = {
  key: string
  game: string
  capture: string
  path: string
  reading: string
  assets: Map<string, number>
  /** "<colour> knight unknown" / "<colour> metropolis unknown": recorded, never an asset type. */
  unclassified: Map<string, number>
  corrections: Correction[]
  contaminated: boolean
  overlayRules: string[]
  uncertain: boolean
  robberTile: number | null
  merchantTile: number | null
  merchantColour: string | null
  seats: string[] | null
  seatsInferred: boolean | null
  cases: Map<CaseName, Set<string>>
}

const posOf = (p: BPiece) => (p.vertex !== undefined ? `v${p.vertex}` : `e${p.edge}`)
const score = (p: BPiece) => p.B.scores.best ?? 99
const bColour = (p: BPiece) => p.B.colour
const variantOfB = (p: BPiece | undefined, kind: string): string => {
  if (kind === 'metropolis') return `metropolis ${p?.B.type ?? 'unknown'}`
  if (kind === 'knight') return p?.B.level ? `knight level ${p.B.level} ${p.B.state}` : 'knight unknown'
  return kind
}
const label = (colour: string | null, variant: string) => `${colour ?? 'none'} ${variant}`

const images: Img[] = []
const contaminatedCaptures: string[] = []

for (const c of captures) {
  const readingFile = resolve(GAMES_DIR, c.game, `${c.capture}.reading.json`)
  const pngFile = resolve(GAMES_DIR, c.game, `${c.capture}.png`)
  if (!existsSync(readingFile) || !existsSync(pngFile)) {
    skipped.push(`${c.game}/${c.capture} (source file missing)`)
    continue
  }
  const reading = JSON.parse(readFileSync(readingFile, 'utf8')) as Reading
  const byPos = new Map(c.pieces.map((p) => [posOf(p), p]))
  const corrections: Correction[] = []
  const drops = new Set<string>()
  const relabels = new Map<string, string>()
  const kindFixes = new Map<string, string>()
  const added: BPiece[] = []
  let uncertain = false

  // The six action rules of classification 3, exactly as classify-b-report.ts derives them.
  for (const p of c.pieces) {
    const pos = posOf(p)
    const s = score(p)
    if (p.flags.includes('missed-by-a')) {
      added.push(p)
      continue
    }
    if (p.flags.includes('phantom-colour')) {
      // The seat list was short, not the piece: complete-seats handles it, the piece stays.
      if (p.A.colour !== null && p.B.colour === p.A.colour && s < 20) continue
      if (s < 20 && p.B.colour !== p.A.colour) relabels.set(pos, bColour(p) ?? p.A.colour ?? 'none')
      else if (s >= 45 || p.B.kind === 'none') {
        if (UNCLEAR_DROPS.has(`${c.game}/${c.capture} ${pos}`)) {
          uncertain = true
          corrections.push({
            action: 'keep-uncertain',
            position: pos,
            from: label(p.A.colour, p.A.kind),
            note: 'drop-piece proposed; the audit could not tell by eye, so A is kept',
          })
        } else drops.add(pos)
      }
    } else if (p.flags.includes('colour-mismatch') && s < 20) relabels.set(pos, bColour(p) ?? p.A.colour ?? 'none')
    if (p.flags.includes('kind-mismatch') && s < 20 && !p.flags.includes('under-overlay')) kindFixes.set(pos, p.B.kind)
  }

  const seats = c.seats ? [...c.seats.colours] : null
  const completions = SEAT_COMPLETIONS[c.game]
  if (seats && completions)
    for (const colour of completions)
      if (!seats.includes(colour)) {
        seats.push(colour)
        corrections.push({
          action: 'complete-seats',
          position: '-',
          to: colour,
          note: 'classification 3 complete-seats',
        })
      }
  const seated = seats ? new Set(seats) : null

  const pieces: Piece[] = []
  const pushPiece = (
    position: string,
    vertex: number | undefined,
    edge: number | undefined,
    colour: string,
    variant: string,
    flags: string[]
  ) => {
    if (seated && !seated.has(colour)) {
      corrections.push({ action: 'drop-unseated-colour', position, from: label(colour, variant) })
      return
    }
    pieces.push({ position, vertex, edge, colour, variant, flags })
  }

  for (const b of reading.pieces?.buildings ?? []) {
    const pos = `v${b.vertex}`
    const bp = byPos.get(pos)
    if (drops.has(pos)) {
      corrections.push({ action: 'drop-piece', position: pos, from: label(b.colour, b.kind) })
      continue
    }
    let colour = b.colour
    let kind = b.kind
    if (relabels.has(pos)) {
      const to = relabels.get(pos)!
      corrections.push({ action: 'relabel-piece', position: pos, from: colour, to })
      colour = to
    }
    if (kindFixes.has(pos)) {
      const to = kindFixes.get(pos)!
      corrections.push({ action: 'fix-kind', position: pos, from: kind, to })
      kind = to
    }
    pushPiece(pos, b.vertex, undefined, colour, variantOfB(bp, kind), bp?.flags ?? [])
  }
  for (const r of reading.pieces?.roads ?? []) {
    const pos = `e${r.edge}`
    const bp = byPos.get(pos)
    if (drops.has(pos)) {
      corrections.push({ action: 'drop-piece', position: pos, from: label(r.colour, 'road') })
      continue
    }
    let colour = r.colour
    if (relabels.has(pos)) {
      const to = relabels.get(pos)!
      corrections.push({ action: 'relabel-piece', position: pos, from: colour, to })
      colour = to
    }
    pushPiece(pos, undefined, r.edge, colour, 'road', bp?.flags ?? [])
  }
  for (const p of added) {
    const pos = posOf(p)
    const colour = bColour(p)
    const variant = variantOfB(p, p.B.kind)
    if (!colour) continue
    corrections.push({ action: 'add-piece', position: pos, to: label(colour, variant) })
    pushPiece(pos, p.vertex, p.edge, colour, variant, p.flags)
  }

  const assets = new Map<string, number>()
  const unclassified = new Map<string, number>()
  for (const p of pieces) {
    const key = label(p.colour, p.variant)
    const target = IS_VARIANT.has(p.variant) ? assets : unclassified
    target.set(key, (target.get(key) ?? 0) + 1)
  }

  /* corner cases */
  const cases = new Map<CaseName, Set<string>>(CASES.map((c2) => [c2, new Set<string>()]))
  const add = (name: CaseName, p: Piece) => {
    if (IS_VARIANT.has(p.variant)) cases.get(name)!.add(label(p.colour, p.variant))
  }
  for (const p of pieces) {
    if (p.vertex !== undefined && OUTER_VERTICES.has(p.vertex)) add('board-edge', p)
    if (p.edge !== undefined && SHORE_EDGES.has(p.edge)) add('shore-road', p)
    if (p.flags.includes('near-robber')) add('near-robber', p)
    if (p.flags.includes('near-merchant')) add('near-merchant', p)
  }
  for (const m of pieces) {
    if (m.vertex === undefined || !m.variant.startsWith('metropolis')) continue
    const tower = towerRect(m.vertex)
    for (const other of pieces) {
      if (other === m || other.vertex === undefined) continue
      const kind = other.variant.startsWith('knight') ? 'knight' : 'building'
      if (overlap(tower, spriteRect(other.vertex, kind)) <= OVERLAP_THRESHOLD) continue
      add('metropolis-tower-overlap', m)
      add('metropolis-tower-overlap', other)
    }
  }

  if (c.overlaySuspected) contaminatedCaptures.push(`${c.game}/${c.capture}`)

  images.push({
    key: `${c.game}/${c.capture}`,
    game: c.game,
    capture: c.capture,
    path: `images/${c.game}/${c.capture}.png`,
    reading: `images/${c.game}/${c.capture}.reading.json`,
    assets,
    unclassified,
    corrections,
    contaminated: c.overlaySuspected,
    overlayRules: c.overlayRules ?? [],
    uncertain,
    robberTile: c.robber?.tile ?? null,
    merchantTile: c.merchant?.tile ?? null,
    merchantColour: c.merchant?.colour ?? null,
    seats,
    seatsInferred: c.seats?.inferred ?? null,
    cases,
  })
}

/* ------------------------------------------------------------------------------------------- inventory */

const availableImages = new Map<string, Img[]>()
const availableGames = new Map<string, Set<string>>()
for (const img of images)
  for (const key of img.assets.keys()) {
    ;(availableImages.get(key) ?? availableImages.set(key, []).get(key)!).push(img)
    ;(availableGames.get(key) ?? availableGames.set(key, new Set()).get(key)!).add(img.game)
  }

const assetKeys = [...availableImages.keys()].sort()
const available = (key: string) => availableImages.get(key)?.length ?? 0
const isRare = (key: string) => available(key) <= RARE_MAX
const rareKeys = assetKeys.filter(isRare)
const rareSet = new Set(rareKeys)

/* ------------------------------------------------------------------------------------------- selection */

const kept = new Map<string, Img>()
const keptReason = new Map<string, string>()
const keepImage = (img: Img, reason: string) => {
  if (!kept.has(img.key)) {
    kept.set(img.key, img)
    keptReason.set(img.key, reason)
  }
}

// Rule 1: every image holding a rare asset, overlay-contaminated or not.
for (const img of images) if ([...img.assets.keys()].some((k) => rareSet.has(k))) keepImage(img, 'rare-asset')

const keptImagesOf = (key: string) => [...kept.values()].filter((img) => img.assets.has(key))
const keptCount = new Map<string, number>()
const keptGames = new Map<string, Set<string>>()
const recount = () => {
  keptCount.clear()
  keptGames.clear()
  for (const key of assetKeys) {
    const imgs = keptImagesOf(key)
    keptCount.set(key, imgs.length)
    keptGames.set(key, new Set(imgs.map((i) => i.game)))
  }
}
recount()

const target = (key: string) => Math.min(MIN_PER_ASSET, available(key))
const deficits = () => assetKeys.filter((k) => (keptCount.get(k) ?? 0) < target(k))

const compare = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return (a[i] ?? 0) - (b[i] ?? 0)
  return 0
}
// Rule 2: greedy fill, game diversity first, clean images preferred, contaminated only as a last resort.
const fill = (pool: Img[]) => {
  for (;;) {
    const need = new Set(deficits())
    if (need.size === 0) return
    let best: { img: Img; rank: number[] } | null = null
    for (const img of pool) {
      if (kept.has(img.key)) continue
      let newGame = 0
      let anyGain = 0
      let pieceGain = 0
      let overflow = 0
      for (const [key, count] of img.assets) {
        if (need.has(key)) {
          anyGain++
          pieceGain += count
          if (!keptGames.get(key)!.has(img.game)) newGame++
        } else if ((keptCount.get(key) ?? 0) >= SOFT_MAX_PER_ASSET) overflow++
      }
      if (anyGain === 0) continue
      const rank = [-newGame, -anyGain, img.uncertain ? 1 : 0, img.contaminated ? 1 : 0, overflow, -pieceGain]
      if (!best || compare(rank, best.rank) < 0 || (compare(rank, best.rank) === 0 && img.key < best.img.key))
        best = { img, rank }
    }
    if (!best) return
    keepImage(best.img, 'coverage-fill')
    recount()
  }
}
fill(images.filter((i) => !i.contaminated))
fill(images) // only reached when a type has too few clean images left

// Corner cases: up to 3 images per (colour, asset type, case), different games first.
const cornerPicks = new Map<CaseName, Map<string, Img[]>>(CASES.map((c) => [c, new Map<string, Img[]>()]))
for (const name of CASES) {
  const buckets = cornerPicks.get(name)!
  for (const key of assetKeys) {
    const candidates = images.filter((i) => i.cases.get(name)!.has(key) && (!i.contaminated || kept.has(i.key)))
    if (candidates.length === 0) continue
    const picked: Img[] = []
    const usedGames = new Set<string>()
    while (picked.length < MAX_PER_CORNER_BUCKET) {
      let best: { img: Img; rank: number[] } | null = null
      for (const img of candidates) {
        if (picked.includes(img)) continue
        const rank = [
          usedGames.has(img.game) ? 1 : 0,
          kept.has(img.key) ? 0 : 1,
          img.uncertain ? 1 : 0,
          img.contaminated ? 1 : 0,
          -(img.assets.get(key) ?? 0),
        ]
        if (!best || compare(rank, best.rank) < 0 || (compare(rank, best.rank) === 0 && img.key < best.img.key))
          best = { img, rank }
      }
      if (!best) break
      picked.push(best.img)
      usedGames.add(best.img.game)
      keepImage(best.img, `corner-case:${name}`)
    }
    buckets.set(key, picked)
  }
}
recount()

const tagsOf = (img: Img) => {
  const tags: string[] = []
  if (img.contaminated) tags.push('overlay-contaminated')
  if (img.uncertain) tags.push('uncertain')
  for (const name of CASES) {
    const buckets = cornerPicks.get(name)!
    if ([...buckets.values()].some((imgs) => imgs.includes(img))) tags.push(name)
  }
  return tags
}

/* ------------------------------------------------------------------------------------------ the output */

if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true })
mkdirSync(IMAGES_DIR, { recursive: true })

let copiedBytes = 0
for (const img of [...kept.values()].sort((a, b) => a.key.localeCompare(b.key))) {
  const dir = resolve(IMAGES_DIR, img.game)
  mkdirSync(dir, { recursive: true })
  for (const ext of ['.png', '.reading.json']) {
    const from = resolve(GAMES_DIR, img.game, img.capture + ext)
    const to = resolve(dir, img.capture + ext)
    copyFileSync(from, to)
    copiedBytes += statSync(to).size
  }
}

const slugOfVariant = (variant: string) =>
  variant
    .replace(/^knight level (\d) (\w+)$/, 'knight-l$1-$2')
    .replace(/^metropolis (\w+)$/, 'metropolis-$1')
    .replace(/\s+/g, '-')
const pageOf = (colour: string, variant: string) => `${colour}/${slugOfVariant(variant)}.html`

type AssetEntry = {
  colour: string
  variant: string
  slug: string
  page: string
  rare: boolean
  totalImagesAvailable: number
  totalGamesAvailable: number
  keptImageCount: number
  keptImages: string[]
  games: string[]
  gamesCount: number
  cornerCases: Record<string, string[]>
}

const sortImgs = (imgs: Img[]) => [...imgs].sort((a, b) => a.key.localeCompare(b.key))

const assetEntries: AssetEntry[] = assetKeys.map((key) => {
  const [colour, ...rest] = key.split(' ')
  const variant = rest.join(' ')
  const imgs = sortImgs(keptImagesOf(key))
  const cornerCases: Record<string, string[]> = {}
  for (const name of CASES) {
    const picked = cornerPicks.get(name)!.get(key) ?? []
    if (picked.length) cornerCases[name] = sortImgs(picked).map((i) => i.path)
  }
  return {
    colour: colour ?? '',
    variant,
    slug: slugOfVariant(variant),
    page: pageOf(colour ?? '', variant),
    rare: rareSet.has(key),
    totalImagesAvailable: available(key),
    totalGamesAvailable: availableGames.get(key)?.size ?? 0,
    keptImageCount: imgs.length,
    keptImages: imgs.map((i) => i.path),
    games: [...new Set(imgs.map((i) => i.game))].sort(),
    gamesCount: new Set(imgs.map((i) => i.game)).size,
    cornerCases,
  }
})
const entryOf = new Map(assetEntries.map((e) => [`${e.colour} ${e.variant}`, e]))
const coloursUsed = COLOURS.filter((c) => assetEntries.some((e) => e.colour === c))

const imageEntries = [...kept.values()]
  .sort((a, b) => a.key.localeCompare(b.key))
  .map((img) => ({
    path: img.path,
    reading: img.reading,
    game: img.game,
    capture: img.capture,
    keptBecause: keptReason.get(img.key),
    assets: Object.fromEntries([...img.assets.entries()].sort()),
    unclassifiedPieces: Object.fromEntries([...img.unclassified.entries()].sort()),
    corrections: img.corrections,
    tags: tagsOf(img),
    overlayRules: img.contaminated ? img.overlayRules : undefined,
    robberTile: img.robberTile,
    merchantTile: img.merchantTile,
    merchantColour: img.merchantColour,
    seats: img.seats,
    seatsSource: img.seatsInferred === null ? 'none' : img.seatsInferred ? 'classification-3 inferred' : 'registry',
    cornerCases: Object.fromEntries(
      CASES.map((name) => [name, [...img.cases.get(name)!].sort()] as const).filter(([, v]) => v.length)
    ),
  }))

const seatsByGame: Record<string, { source: string; colours: string[] }> = {}
for (const img of images)
  if (!seatsByGame[img.game])
    seatsByGame[img.game] = {
      source: img.seatsInferred === null ? 'none' : img.seatsInferred ? 'classification-3 inferred' : 'registry',
      colours: img.seats ?? [],
    }

const contaminatedKept = contaminatedCaptures.filter((k) => kept.has(k))
const contaminatedExcluded = contaminatedCaptures.filter((k) => !kept.has(k))
const generatedAt = new Date().toISOString()

const map = {
  generatedAt,
  source: {
    labels: 'examples/games/<game>/<capture>.reading.json (classification A)',
    corrections: 'examples/classification-v3 (classification B v3): report.md, report.json, audit.md, audit.json',
    games: `${gameDirs.length - ineligible.length} games with registry status done or watching, or missing from the registry`,
    imagesAnalysed: images.length,
    capturesSkipped: skipped,
  },
  rules: {
    assetType:
      '(colour, variant); variants: settlement, city, road, metropolis science/politics/trade, knight level 1-3 active/inactive',
    corrections: [
      '1. 15 relabel-piece actions (colour changes) applied',
      '2. 6 fix-kind actions applied',
      '3. 87 add-piece knights added, level and state from classification 3',
      `4. 257 drop-piece actions applied except the 5 the audit marked unclear (${[...UNCLEAR_DROPS].join(', ')}), which keep A's label and are tagged "uncertain"`,
      '5. pieces whose colour is not a seat of the game are removed (registry seats, else classification 3 inferred seats; 20260913-fort4077 gains purple from the complete-seats action)',
      '6. the 168 mark-capture-overlay-contaminated captures are excluded from selection unless they carry a rare asset (a rare asset has at most 10 sources), in which case they are kept and tagged "overlay-contaminated"',
      '7. knight level/state and metropolis type come from classification 3; a "knight (no close match)" stays a knight with level unknown and, like "metropolis unknown", is listed per image but is not an asset type and never counts towards coverage',
    ],
    rare: `an asset type present in ${RARE_MAX} or fewer images is RARE; every image containing one is kept, no exceptions`,
    fill: `greedy fill to at least ${MIN_PER_ASSET} kept images per asset type: an image from a game not yet represented for that asset type outranks another frame of a game that already contributes one, then images covering more under-covered asset types, then clean images (no uncertain piece, not overlay-contaminated), then images that would not push an already saturated asset type further`,
    softMax: `${SOFT_MAX_PER_ASSET} kept images per asset type is a preference only; the rare rule overrides it`,
    cornerCases: `at most ${MAX_PER_CORNER_BUCKET} images per (colour, asset type, case), different games first, then images already kept (so nothing is copied twice), then clean ones. Board-piece interactions only; no UI-overlay cases.`,
    layout: 'every kept image is copied once to examples/curated/images/<game>/<capture>.png with its reading',
  },
  cornerCaseRules: CASE_RULES,
  totals: {
    imagesAnalysed: images.length,
    imagesKept: kept.size,
    imagesKeptByRareRule: [...keptReason.values()].filter((r) => r === 'rare-asset').length,
    imagesKeptByFill: [...keptReason.values()].filter((r) => r === 'coverage-fill').length,
    imagesKeptByCornerCase: [...keptReason.values()].filter((r) => r.startsWith('corner-case')).length,
    distinctGamesKept: new Set([...kept.values()].map((i) => i.game)).size,
    distinctGamesAnalysed: new Set(images.map((i) => i.game)).size,
    assetTypes: assetKeys.length,
    rareAssetTypes: rareKeys.length,
    copiedBytes,
    overlayContaminatedCaptures: contaminatedCaptures.length,
    overlayContaminatedKeptForRareAssets: contaminatedKept.length,
    overlayContaminatedExcluded: contaminatedExcluded.length,
    assetTypesBelowMinimum: assetKeys.filter((k) => (keptCount.get(k) ?? 0) < target(k)),
    /** Coverage is a count rule, so a type whose 5 images arrived via other rules may show fewer games. */
    assetTypesBelowGameTarget: assetKeys.filter(
      (k) => (keptGames.get(k)?.size ?? 0) < Math.min(MIN_PER_ASSET, availableGames.get(k)?.size ?? 0)
    ),
  },
  seatsByGame,
  rareAssetTypes: rareKeys.map((k) => ({
    assetType: k,
    images: available(k),
    games: availableGames.get(k)?.size ?? 0,
  })),
  assetTypes: assetEntries,
  cornerCases: CASES.map((name) => {
    const buckets = cornerPicks.get(name)!
    const imgs = new Set<string>()
    for (const picked of buckets.values()) for (const i of picked) imgs.add(i.path)
    return {
      name,
      rule: CASE_RULES[name],
      assetTypes: [...buckets.entries()].filter(([, v]) => v.length).length,
      images: imgs.size,
      entries: [...buckets.entries()]
        .filter(([, v]) => v.length)
        .map(([key, picked]) => ({
          assetType: key,
          images: sortImgs(picked).map((i) => i.path),
          games: [...new Set(picked.map((i) => i.game))].sort(),
        })),
    }
  }),
  images: imageEntries,
  overlayContaminatedExcluded: contaminatedExcluded,
  overlayContaminatedKept: contaminatedKept,
}

writeFileSync(resolve(OUT_DIR, 'map.json'), JSON.stringify(map, null, 2) + '\n')

/* ----------------------------------------------------------------------------------------------- map.md */

const caseCount = (colour: string, variant: string, name: CaseName) =>
  (cornerPicks.get(name)!.get(`${colour} ${variant}`) ?? []).length

const md: string[] = []
md.push('# Curated board images (`examples/curated`)')
md.push('')
md.push(
  `Generated ${generatedAt} from ${images.length} captures in the ${new Set(images.map((i) => i.game)).size} games whose registry status is \`done\` or \`watching\` (or that the registry does not know). Labels are classification A corrected in memory by classification 3; nothing under \`examples/games\` was modified and every kept image is a **copy**.`
)
md.push('')
md.push(
  `- **${kept.size}** images kept out of ${images.length}, from **${new Set([...kept.values()].map((i) => i.game)).size}** distinct games (${map.totals.imagesKeptByRareRule} forced by the rare rule, ${map.totals.imagesKeptByFill} added by the greedy fill, ${map.totals.imagesKeptByCornerCase} added for a corner case).`
)
md.push(`- **${assetKeys.length}** asset types, **${rareKeys.length}** of them RARE (${RARE_MAX} images or fewer).`)
md.push(
  `- **${contaminatedCaptures.length}** captures are overlay-contaminated: ${contaminatedKept.length} kept because they carry a rare asset, ${contaminatedExcluded.length} excluded.`
)
md.push(`- Copied bytes: ${(copiedBytes / 1024 / 1024).toFixed(1)} MiB (PNG + reading per image).`)
md.push('')
md.push('## Rules')
md.push('')
for (const r of map.rules.corrections) md.push(`- Correction ${r}`)
md.push(`- Rare: ${map.rules.rare}`)
md.push(`- Fill: ${map.rules.fill}`)
md.push(`- Soft maximum: ${map.rules.softMax}`)
md.push(`- Corner cases: ${map.rules.cornerCases}`)
md.push('')

for (const colour of coloursUsed) {
  const rows = assetEntries.filter((e) => e.colour === colour)
  md.push(`## ${colour}`)
  md.push('')
  md.push('| variant | rare | images available | images kept | distinct games | ' + CASES.join(' | ') + ' |')
  md.push('| --- | --- | ---: | ---: | ---: | ' + CASES.map(() => '---:').join(' | ') + ' |')
  for (const e of rows)
    md.push(
      `| [${e.variant}](${e.page}) | ${e.rare ? 'yes' : ''} | ${e.totalImagesAvailable} | ${e.keptImageCount} | ${e.gamesCount} | ` +
        CASES.map((n) => caseCount(colour, e.variant, n)).join(' | ') +
        ' |'
    )
  md.push('')
}

md.push('## Corner cases')
md.push('')
for (const c of map.cornerCases) {
  md.push(`### ${c.name}`)
  md.push('')
  md.push(c.rule)
  md.push('')
  md.push(`${c.assetTypes} asset types, ${c.images} images.`)
  md.push('')
  md.push('| asset type | images | games |')
  md.push('| --- | ---: | --- |')
  for (const e of c.entries) md.push(`| ${e.assetType} | ${e.images.length} | ${e.games.join(', ')} |`)
  md.push('')
}

md.push('## Totals')
md.push('')
md.push('| measure | value |')
md.push('| --- | ---: |')
for (const [k, v] of Object.entries(map.totals))
  md.push(`| ${k} | ${Array.isArray(v) ? (v.length ? v.join(', ') : 'none') : v} |`)
md.push('')
md.push(`## Excluded overlay-contaminated captures (${contaminatedExcluded.length})`)
md.push('')
md.push(contaminatedExcluded.length ? contaminatedExcluded.map((c) => `- ${c}`).join('\n') : '- none')
md.push('')
if (contaminatedKept.length) {
  md.push(`## Overlay-contaminated captures kept for a rare asset (${contaminatedKept.length})`)
  md.push('')
  md.push(contaminatedKept.map((c) => `- ${c}`).join('\n'))
  md.push('')
}
if (skipped.length) {
  md.push(`## Captures with no usable reading (${skipped.length})`)
  md.push('')
  md.push(skipped.map((c) => `- ${c}`).join('\n'))
  md.push('')
}
writeFileSync(resolve(OUT_DIR, 'map.md'), md.join('\n'))

/* ------------------------------------------------------------------------------------------------ html */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const page = (title: string, body: string) =>
  `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${esc(title)}</title>\n</head>\n<body>\n${body}</body>\n</html>\n`

/** "1 game" / "3 games": the captions read badly otherwise. */
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const imageBlock = (img: Img, key: string, depth: number) => {
  const up = '../'.repeat(depth)
  const tags = tagsOf(img)
  const own = CASES.filter((n) => img.cases.get(n)!.has(key))
  const others = [...img.assets.entries()]
    .filter(([k]) => k !== key)
    .sort()
    .map(([k, n]) => `${k} x${n}`)
  const unclassified = [...img.unclassified.entries()].sort().map(([k, n]) => `${k} x${n}`)
  const out: string[] = []
  out.push(`<p><img src="${up}${img.path}" width="800" alt="${esc(img.key)}"></p>`)
  out.push(
    `<p><b>${esc(img.game)}</b> / ${esc(img.capture)} &mdash; ${esc(key)} x${img.assets.get(key) ?? 0}` +
      ` &mdash; tags: ${tags.length ? esc(tags.join(', ')) : 'none'}` +
      ` &mdash; cases for this asset: ${own.length ? esc(own.join(', ')) : 'none'}` +
      ` &mdash; robber tile ${img.robberTile ?? '?'}` +
      ` &mdash; merchant tile ${img.merchantTile ?? 'none'}` +
      ` &mdash; <a href="${up}${img.reading}">reading</a></p>`
  )
  if (img.contaminated)
    out.push(
      `<p><b>WARNING: overlay-contaminated capture</b> (${esc(img.overlayRules.join(', ') || 'ui')}) &mdash; UI is drawn over part of the board.</p>`
    )
  if (img.uncertain)
    out.push('<p><b>WARNING: holds a piece the audit could not read by eye</b> (tagged <code>uncertain</code>).</p>')
  if (img.corrections.length)
    out.push(
      `<p>corrections: ${esc(img.corrections.map((c) => `${c.action} ${c.position}${c.from ? ` ${c.from}` : ''}${c.to ? ` -> ${c.to}` : ''}`).join('; '))}</p>`
    )
  out.push(`<p>other assets: ${others.length ? esc(others.join(', ')) : 'none'}</p>`)
  if (unclassified.length) out.push(`<p>unclassified pieces: ${esc(unclassified.join(', '))}</p>`)
  out.push('<hr>')
  return out.join('\n')
}

for (const colour of coloursUsed) mkdirSync(resolve(OUT_DIR, colour), { recursive: true })

const imgByPath = new Map([...kept.values()].map((i) => [i.path, i]))

for (const e of assetEntries) {
  const key = `${e.colour} ${e.variant}`
  const body: string[] = []
  body.push(`<h1>${esc(key)}</h1>`)
  body.push(
    `<p><a href="index.html">back to ${esc(e.colour)}</a> | <a href="../index.html">back to all colours</a></p>`
  )
  body.push(
    `<p>${e.rare ? '<b>RARE asset type</b> &mdash; ' : ''}${plural(e.totalImagesAvailable, 'image')} available in ${plural(e.totalGamesAvailable, 'game')}; ${e.keptImageCount} kept from ${plural(e.gamesCount, 'game')}.</p>`
  )
  const caseLinks = CASES.filter((n) => (e.cornerCases[n] ?? []).length).map(
    (n) => `<a href="#${n}">${n} (${e.cornerCases[n]!.length})</a>`
  )
  body.push(`<p>corner cases: ${caseLinks.length ? caseLinks.join(' | ') : 'none'}</p>`)
  body.push('<hr>')
  body.push(`<h2>Kept images (${e.keptImageCount})</h2>`)
  for (const path of e.keptImages) body.push(imageBlock(imgByPath.get(path)!, key, 1))
  for (const name of CASES) {
    const paths = e.cornerCases[name] ?? []
    if (!paths.length) continue
    body.push(`<h2 id="${name}">Corner case: ${name} (${paths.length})</h2>`)
    body.push(`<p>${esc(CASE_RULES[name])}</p>`)
    for (const path of paths) body.push(imageBlock(imgByPath.get(path)!, key, 1))
  }
  body.push(
    `<p><a href="index.html">back to ${esc(e.colour)}</a> | <a href="../index.html">back to all colours</a></p>`
  )
  writeFileSync(resolve(OUT_DIR, e.page), page(key, body.join('\n') + '\n'))
}

for (const colour of coloursUsed) {
  const rows = assetEntries.filter((e) => e.colour === colour)
  const imgs = new Set<string>()
  for (const e of rows) for (const p of e.keptImages) imgs.add(p)
  const body: string[] = []
  body.push(`<h1>${esc(colour)}</h1>`)
  body.push('<p><a href="../index.html">back to all colours</a></p>')
  body.push(`<p>${rows.length} asset types (${rows.filter((r) => r.rare).length} rare), ${imgs.size} kept images.</p>`)
  body.push('<table border="1" cellpadding="4">')
  body.push(
    '<tr><th>asset type</th><th>rare</th><th>available</th><th>kept</th><th>games</th>' +
      CASES.map((n) => `<th>${n}</th>`).join('') +
      '</tr>'
  )
  for (const e of rows)
    body.push(
      `<tr><td><a href="${e.slug}.html">${esc(e.variant)}</a></td><td>${e.rare ? 'RARE' : ''}</td>` +
        `<td>${e.totalImagesAvailable}</td><td>${e.keptImageCount}</td><td>${e.gamesCount}</td>` +
        CASES.map((n) => {
          const c = (e.cornerCases[n] ?? []).length
          return `<td>${c ? `<a href="${e.slug}.html#${n}">${c}</a>` : '-'}</td>`
        }).join('') +
        '</tr>'
    )
  body.push('</table>')
  body.push('<p><a href="../index.html">back to all colours</a></p>')
  writeFileSync(resolve(OUT_DIR, colour, 'index.html'), page(colour, body.join('\n') + '\n'))
}

const indexBody: string[] = []
indexBody.push('<h1>Curated board images</h1>')
indexBody.push(
  `<p>Generated ${esc(generatedAt)} from ${images.length} captures of ${new Set(images.map((i) => i.game)).size} games. ` +
    `${kept.size} images kept, ${assetKeys.length} asset types (${rareKeys.length} rare). ` +
    `Labels: classification A corrected by classification 3.</p>`
)
indexBody.push('<p>Machine-readable map: <a href="map.json">map.json</a>. Tables: <a href="map.md">map.md</a>.</p>')
indexBody.push('<h2>Colours</h2>')
indexBody.push('<table border="1" cellpadding="4">')
indexBody.push('<tr><th>colour</th><th>asset types</th><th>rare asset types</th><th>kept images</th></tr>')
for (const colour of coloursUsed) {
  const rows = assetEntries.filter((e) => e.colour === colour)
  const imgs = new Set<string>()
  for (const e of rows) for (const p of e.keptImages) imgs.add(p)
  indexBody.push(
    `<tr><td><a href="${colour}/index.html">${esc(colour)}</a></td><td>${rows.length}</td>` +
      `<td>${rows.filter((r) => r.rare).length}</td><td>${imgs.size}</td></tr>`
  )
}
indexBody.push('</table>')
indexBody.push('<h2>Rare asset types</h2>')
indexBody.push('<table border="1" cellpadding="4">')
indexBody.push('<tr><th>asset type</th><th>images available</th><th>images kept</th><th>games</th></tr>')
for (const key of rareKeys) {
  const e = entryOf.get(key)!
  indexBody.push(
    `<tr><td><a href="${e.page}">${esc(key)}</a></td><td>${e.totalImagesAvailable}</td>` +
      `<td>${e.keptImageCount}</td><td>${e.gamesCount}</td></tr>`
  )
}
indexBody.push('</table>')
indexBody.push('<h2>Corner cases</h2>')
indexBody.push('<ul>')
for (const c of map.cornerCases)
  indexBody.push(`<li><b>${esc(c.name)}</b>: ${c.assetTypes} asset types, ${c.images} images. ${esc(c.rule)}</li>`)
indexBody.push('</ul>')
writeFileSync(resolve(OUT_DIR, 'index.html'), page('Curated board images', indexBody.join('\n') + '\n'))

/* ---------------------------------------------------------------------------------------- verification */

const problems: string[] = []
for (const key of assetKeys) {
  const want = target(key)
  const got = keptCount.get(key) ?? 0
  if (got < want) problems.push(`${key}: ${got} kept, wanted ${want} (of ${available(key)} available)`)
}
for (const key of rareKeys)
  for (const img of availableImages.get(key)!) if (!kept.has(img.key)) problems.push(`rare ${key}: ${img.key} not kept`)
for (const img of kept.values()) {
  if (!existsSync(resolve(IMAGES_DIR, img.game, `${img.capture}.png`))) problems.push(`missing copy ${img.path}`)
  if (!existsSync(resolve(GAMES_DIR, img.game))) problems.push(`game folder does not exist: ${img.game}`)
}

console.log(
  `images analysed ${images.length}, kept ${kept.size}, asset types ${assetKeys.length}, rare ${rareKeys.length}`
)
console.log(`copied ${(copiedBytes / 1024 / 1024).toFixed(1)} MiB into ${IMAGES_DIR}`)
console.log(
  `overlay-contaminated: ${contaminatedCaptures.length} total, ${contaminatedKept.length} kept for rare assets, ${contaminatedExcluded.length} excluded`
)
for (const name of CASES) {
  const buckets = cornerPicks.get(name)!
  const imgs = new Set<string>()
  for (const picked of buckets.values()) for (const i of picked) imgs.add(i.key)
  console.log(
    `corner case ${name}: ${[...buckets.values()].filter((v) => v.length).length} asset types, ${imgs.size} images`
  )
}
console.log(
  problems.length ? `PROBLEMS (${problems.length}):\n  ${problems.join('\n  ')}` : 'verification: all checks pass'
)
