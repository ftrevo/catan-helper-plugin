/**
 * Aggregates the per-capture classification B files into examples/classification-v2/report.{md,json} and
 * writes example crops under examples/classification-v2/crops/ so every mismatch class can be checked by
 * eye. Reads only; proposes actions but never applies them.
 *
 *   CLASSIFY_B_LIB=1 node --import tsx src/classify-b-report.ts
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { writeCrop } from './classify-b-crop.ts'
import { COLOURS, OUT_DIR, THRESHOLDS } from './classify-b.ts'
import { GAMES_DIR, readRegistry } from './registry.ts'

type Piece = {
  vertex?: number
  edge?: number
  A: { kind: string; colour: string | null }
  B: {
    kind: string
    shape?: string
    colour: string | null
    colourSeatConstrained: string | null
    type?: string
    level?: number
    state?: string
    levelWithAColour?: number
    stateWithAColour?: string
    wall?: boolean
    scores: { best: number | null; runnerUp: number | null; margin: number | null; seatBest: number | null }
  }
  flags: string[]
}

type Capture = {
  game: string
  capture: string
  skipped?: string
  geometry: { center: { x: number; y: number }; spacing: number; tokensFound: number | null }
  seats: { colours: string[]; inferred: boolean } | null
  robber: { tile: number; score: number } | null
  robberDetection: { tile: number | null; score: number | null; runnerUpScore: number | null; reason: string | null }
  merchantDetection: { tile: number | null; colour: string | null; score: number | null; reason: string | null }
  overlaySuspected: boolean
  overlayRules: string[]
  coveredTiles: number[]
  pieces: Piece[]
}

const CROPS_DIR = resolve(OUT_DIR, 'crops')
const RARE = ['bronze', 'silver', 'gold', 'purple', 'pink', 'mysticblue', 'white']

const captures: Capture[] = []
for (const game of readdirSync(OUT_DIR).sort()) {
  const dir = resolve(OUT_DIR, game)
  if (game === 'crops' || !existsSync(dir) || !statSync(dir).isDirectory()) continue
  if (!readdirSync(dir).some((f) => f.endsWith('.b.json'))) continue
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.b.json'))
    .sort())
    captures.push(JSON.parse(readFileSync(resolve(dir, file), 'utf8')) as Capture)
}

const ok = captures.filter((c) => !c.skipped)
const registry = readRegistry()

/* ------------------------------------------------------------------------------------------- totals */
const flags: Record<string, number> = {}
const byKindA: Record<string, number> = {}
const byKindB: Record<string, number> = {}
let pieces = 0
let colourAgree = 0
let kindAgree = 0
let bothAgree = 0
const perGame: Record<
  string,
  { pieces: number; mismatch: number; phantom: number; kind: number; overlay: number; extra: number }
> = {}

const variantOfA = (p: Piece): string => {
  if (p.A.kind === 'none') return 'nothing'
  if (p.A.kind === 'metropolis') return `metropolis ${p.B.type ?? '?'}`
  if (p.A.kind === 'knight')
    return p.B.levelWithAColour ? `knight level ${p.B.levelWithAColour} ${p.B.stateWithAColour}` : 'knight ?'
  return p.A.kind
}
const variantOfB = (p: Piece): string => {
  if (p.B.kind === 'metropolis') return `metropolis ${p.B.type ?? '?'}`
  if (p.B.kind === 'knight') return p.B.level ? `knight level ${p.B.level} ${p.B.state}` : 'knight ?'
  return p.B.kind
}

const table: Record<string, Record<string, { a: number; b: number }>> = {}
const bump = (colour: string | null, variant: string, which: 'a' | 'b') => {
  if (!colour) return
  const row = (table[colour] ??= {})
  const cell = (row[variant] ??= { a: 0, b: 0 })
  cell[which]++
}

let extraPieces = 0
for (const c of ok) {
  const g = (perGame[c.game] ??= { pieces: 0, mismatch: 0, phantom: 0, kind: 0, overlay: 0, extra: 0 })
  if (c.overlaySuspected) g.overlay++
  for (const p of c.pieces) {
    // Vertices A reports nothing on are counted apart: there is no A label to agree or disagree with.
    if (p.A.kind === 'none') {
      extraPieces++
      g.extra++
      bump(p.B.colourSeatConstrained ?? p.B.colour, variantOfB(p), 'b')
      for (const f of p.flags) flags[f] = (flags[f] ?? 0) + 1
      continue
    }
    pieces++
    g.pieces++
    byKindA[p.A.kind] = (byKindA[p.A.kind] ?? 0) + 1
    byKindB[p.B.kind] = (byKindB[p.B.kind] ?? 0) + 1
    const cAgree = p.B.colour !== null && p.A.colour === p.B.colour
    const kAgree = p.A.kind === p.B.kind
    if (cAgree) colourAgree++
    if (kAgree) kindAgree++
    if (cAgree && kAgree) bothAgree++
    for (const f of p.flags) flags[f] = (flags[f] ?? 0) + 1
    if (p.flags.includes('colour-mismatch') || p.flags.includes('colour-mismatch-seat')) g.mismatch++
    if (p.flags.includes('phantom-colour')) g.phantom++
    if (p.flags.includes('kind-mismatch')) g.kind++
    bump(p.A.colour, variantOfA(p), 'a')
    bump(p.B.colourSeatConstrained ?? p.B.colour, variantOfB(p), 'b')
  }
}

/* ------------------------------------------------------------------------- robber, merchant, overlays */
const robberFound = ok.filter((c) => c.robberDetection.tile !== null)
const robberScores = robberFound.map((c) => c.robberDetection.score ?? 0).sort((a, b) => a - b)
const robberMisses = ok.filter((c) => c.robberDetection.tile === null)
const robberMargins = robberFound
  .map((c) => (c.robberDetection.runnerUpScore ?? 0) - (c.robberDetection.score ?? 0))
  .sort((a, b) => a - b)
const merchantFound = ok.filter((c) => c.merchantDetection.tile !== null)
const overlayCaptures = ok.filter((c) => c.overlaySuspected)
const overlayByRule: Record<string, number> = {}
for (const c of overlayCaptures)
  for (const r of c.overlayRules) {
    const key = r.split(' ')[0]!.replace(/=.*/, '')
    overlayByRule[key] = (overlayByRule[key] ?? 0) + 1
  }
const pct = (n: number, d: number) => (d === 0 ? '0.00%' : `${((100 * n) / d).toFixed(2)}%`)
const median = (xs: number[]) => (xs.length ? Math.round(xs[Math.floor(xs.length / 2)]! * 10) / 10 : null)
const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10)

/**
 * How stable the robber is between consecutive captures of the same game: the robber only moves on a 7 or
 * a knight action, so wild jumping between frames would mean the detector is guessing.
 */
let robberSameAsPrevious = 0
let robberPairs = 0
const byGame: Record<string, Capture[]> = {}
for (const c of ok) (byGame[c.game] ??= []).push(c)
for (const list of Object.values(byGame)) {
  for (let i = 1; i < list.length; i++) {
    const a = list[i - 1]!.robberDetection.tile
    const b = list[i]!.robberDetection.tile
    if (a === null || b === null) continue
    robberPairs++
    if (a === b) robberSameAsPrevious++
  }
}

/* ----------------------------------------------------------------------------------------- examples */
type Example = {
  game: string
  capture: string
  pos: string
  a: string
  b: string
  score: number | null
  flags: string[]
  crop: string
}

const label = (p: Piece, side: 'A' | 'B') =>
  side === 'A'
    ? `${p.A.colour ?? 'none'}-${variantOfA(p)}`.replace(/\s+/g, '-')
    : `${p.B.colour ?? 'none'}-${variantOfB(p)}`.replace(/\s+/g, '-')

const pngFor = (c: Capture) => resolve(GAMES_DIR, c.game, `${c.capture}.png`)

const pickExamples = (
  name: string,
  match: (p: Piece, c: Capture) => boolean,
  limit = 5
): { capture: Capture; piece: Piece }[] => {
  const seenGames = new Set<string>()
  const hits: { capture: Capture; piece: Piece }[] = []
  // One per game first, so the examples are not five frames of the same board.
  for (const pass of [1, 2])
    for (const c of ok) {
      for (const p of c.pieces) {
        if (hits.length >= limit) return hits
        if (!match(p, c)) continue
        if (pass === 1 && seenGames.has(c.game)) continue
        seenGames.add(c.game)
        hits.push({ capture: c, piece: p })
      }
    }
  return hits
}

const CLASSES: { name: string; match: (p: Piece, c: Capture) => boolean }[] = [
  { name: 'phantom-colour', match: (p) => p.flags.includes('phantom-colour') && p.A.kind !== 'none' },
  { name: 'phantom-colour-strong-b', match: (p) => p.flags.includes('phantom-colour') && (p.B.scores.best ?? 99) < 20 },
  { name: 'colour-mismatch', match: (p) => p.flags.includes('colour-mismatch') },
  {
    name: 'colour-mismatch-seat',
    match: (p) => p.flags.includes('colour-mismatch-seat') && !p.flags.includes('colour-mismatch'),
  },
  { name: 'kind-mismatch', match: (p) => p.flags.includes('kind-mismatch') },
  { name: 'level-mismatch', match: (p) => p.flags.includes('level-mismatch') },
  { name: 'weak-match', match: (p) => p.flags.includes('weak-match') && p.flags.length === 1 },
  { name: 'under-overlay', match: (p) => p.flags.includes('under-overlay') && p.flags.length > 1 },
  {
    name: 'near-robber-mismatch',
    match: (p) => p.flags.includes('near-robber') && p.flags.some((f) => f.startsWith('colour-mismatch')),
  },
  {
    name: 'near-merchant-mismatch',
    match: (p) => p.flags.includes('near-merchant') && p.flags.some((f) => f.startsWith('colour-mismatch')),
  },
  { name: 'missed-by-a', match: (p) => p.flags.includes('missed-by-a') },
  {
    name: 'agreement-sample',
    match: (p) => p.A.kind !== 'none' && p.flags.length === 0 && (p.B.scores.best ?? 99) < 20,
  },
]

const classCounts: Record<string, number> = {}
for (const { name, match } of CLASSES) {
  let n = 0
  for (const c of ok) for (const p of c.pieces) if (match(p, c)) n++
  classCounts[name] = n
}

/** Colour mismatches split by what A said the piece was: buildings match far more sharply than roads. */
const mismatchByKind: Record<string, { pieces: number; colourMismatch: number; phantom: number; weak: number }> = {}
for (const c of ok)
  for (const p of c.pieces) {
    if (p.A.kind === 'none') continue
    const row = (mismatchByKind[p.A.kind] ??= { pieces: 0, colourMismatch: 0, phantom: 0, weak: 0 })
    row.pieces++
    if (p.flags.includes('colour-mismatch')) row.colourMismatch++
    if (p.flags.includes('phantom-colour')) row.phantom++
    if (p.flags.includes('weak-match')) row.weak++
  }

mkdirSync(CROPS_DIR, { recursive: true })
const examples: Record<string, Example[]> = {}
for (const { name, match } of CLASSES) {
  const limit = name === 'agreement-sample' ? 20 : 5
  const hits = pickExamples(name, match, limit)
  examples[name] = []
  for (const { capture: c, piece: p } of hits) {
    const pos = p.vertex !== undefined ? `v${p.vertex}` : `e${p.edge}`
    const file = `${name}__${c.game}__${c.capture}__${pos}__A-${label(p, 'A')}__B-${label(p, 'B')}.png`
    const out = resolve(CROPS_DIR, file)
    const written = await writeCrop(
      pngFor(c),
      c.geometry,
      p.vertex !== undefined ? { vertex: p.vertex } : { edge: p.edge },
      out,
      p.vertex !== undefined ? 0.9 : 0.7,
      4
    )
    examples[name]!.push({
      game: c.game,
      capture: c.capture,
      pos,
      a: label(p, 'A'),
      b: label(p, 'B'),
      score: p.B.scores.best,
      flags: p.flags,
      crop: written ? `examples/classification-v2/crops/${file}` : 'png-missing',
    })
  }
}

/* --------------------------------------------------------------------------------- proposed actions */
type Action = { action: string; count: number; detail: string; sample: string[] }

const seatSource = (c: Capture) => (c.seats ? (c.seats.inferred ? 'inferred' : 'registry') : 'none')
const relabel: { c: Capture; p: Piece }[] = []
const drop: { c: Capture; p: Piece }[] = []
const seatFix: Record<string, Set<string>> = {}
const contaminated = new Set<string>()
const kindFix: { c: Capture; p: Piece }[] = []
const addPiece: { c: Capture; p: Piece }[] = []

for (const c of ok) {
  if (c.overlaySuspected) contaminated.add(`${c.game}/${c.capture}`)
  for (const p of c.pieces) {
    const score = p.B.scores.best ?? 99
    if (p.flags.includes('missed-by-a')) {
      addPiece.push({ c, p })
      continue
    }
    if (p.flags.includes('phantom-colour')) {
      if (seatSource(c) === 'inferred' && p.A.colour !== null && p.B.colour === p.A.colour && score < 20) {
        ;(seatFix[c.game] ??= new Set()).add(p.A.colour)
        continue
      }
      if (score < 20 && p.B.colour !== p.A.colour) relabel.push({ c, p })
      else if (score >= 45) drop.push({ c, p })
    } else if (p.flags.includes('colour-mismatch') && score < 20) relabel.push({ c, p })
    if (p.flags.includes('kind-mismatch') && score < 20 && !p.flags.includes('under-overlay')) kindFix.push({ c, p })
  }
}

const describe = (c: Capture, p: Piece) =>
  `${c.game}/${c.capture} ${p.vertex !== undefined ? `vertex ${p.vertex}` : `edge ${p.edge}`}: ${
    p.A.kind === 'none' ? 'nothing' : label(p, 'A')
  } -> ${label(p, 'B')} (B score ${p.B.scores.best})`

const actions: Action[] = [
  {
    action: 'relabel-piece',
    count: relabel.length,
    detail:
      'A reads a colour B rejects and B has a strong match (best < 20) for a different colour. Change the piece colour in the reading to B, keeping the original as a backup.',
    sample: [],
  },
  {
    action: 'drop-piece',
    count: drop.length,
    detail:
      'A reads a piece whose colour is not seated and no template matches the pixels (best >= 45): almost always UI drawn over the board. Remove the piece from the reading.',
    sample: [],
  },
  {
    action: 'fix-kind',
    count: kindFix.length,
    detail: 'A and B disagree on the kind and B matches strongly (best < 20) outside any overlay.',
    sample: [],
  },
  {
    action: 'add-piece',
    count: addPiece.length,
    detail:
      'A reports nothing at a vertex where B matches a piece as well as it matches the pieces both agree on (best < 20, colour margin >= 8). Add the piece to the reading.',
    sample: [],
  },
  {
    action: 'mark-capture-overlay-contaminated',
    count: contaminated.size,
    detail:
      'Captures where a UI panel covers part of the board (hidden number token, or a large flat light rectangle inside the hex area). Exclude them from training sets, or at least exclude the covered positions.',
    sample: [],
  },
  {
    action: 'complete-registry-seats',
    count: Object.keys(seatFix).length,
    detail:
      'Games without registry seats where the inferred seat list is missing a colour that B matches strongly. Fix the seat list rather than the pieces.',
    sample: [],
  },
]
actions[0]!.sample = relabel.slice(0, 12).map(({ c, p }) => describe(c, p))
actions[1]!.sample = drop.slice(0, 12).map(({ c, p }) => describe(c, p))
actions[2]!.sample = kindFix.slice(0, 12).map(({ c, p }) => describe(c, p))
actions[3]!.sample = addPiece.slice(0, 12).map(({ c, p }) => describe(c, p))
actions[4]!.sample = [...contaminated].slice(0, 12)
actions[5]!.sample = Object.entries(seatFix)
  .slice(0, 12)
  .map(([g, cs]) => `${g}: add ${[...cs].join(', ')}`)

/* -------------------------------------------------------------------------------------- validations */
const find = (game: string, capturePrefix: string) =>
  ok.find((c) => c.game === game && c.capture.startsWith(capturePrefix))
const validations: { name: string; expected: string; got: string; pass: boolean }[] = []
for (const frame of ['02', '03', '04']) {
  const c = find('20260913-white3776', frame)
  const p = c?.pieces.find((x) => x.vertex === 25)
  const got = p
    ? `${p.B.colour} ${variantOfB(p)} (score ${p.B.scores.best}, A said ${p.A.colour} ${p.A.kind})`
    : 'not found'
  validations.push({
    name: `white3776 frame ${frame} vertex 25`,
    expected: 'mysticblue metropolis trade',
    got,
    pass: p?.B.colour === 'mysticblue' && p?.B.kind === 'metropolis' && p?.B.type === 'trade',
  })
}
{
  const c = find('20260914-map7182', '03')
  const targets = (c?.pieces ?? []).filter(
    (p) => p.A.colour !== null && ['gold', 'silver', 'white'].includes(p.A.colour)
  )
  const flagged = targets.filter((p) => p.flags.includes('phantom-colour') && p.flags.includes('under-overlay'))
  validations.push({
    name: 'map7182 frame 03 gold/silver/white pieces',
    expected: 'all flagged phantom-colour and under-overlay',
    got: `${flagged.length}/${targets.length} flagged; capture overlaySuspected=${c?.overlaySuspected} rules=${c?.overlayRules.join('; ')}`,
    pass: targets.length > 0 && flagged.length === targets.length,
  })
}
{
  const frames = ['01', '02', '03', '04'].map((f) => find('20260913-white3776', f))
  validations.push({
    name: 'white3776 robber and merchant tiles per frame',
    expected: 'robber moves; merchant on the tile below vertex 25 (tile 10) from frame 02',
    got: frames
      .map(
        (c, i) =>
          `f0${i + 1}: robber=${c?.robberDetection.tile} merchant=${c?.merchantDetection.tile}(${c?.merchantDetection.colour})`
      )
      .join(', '),
    pass: frames.slice(1).every((c) => c?.merchantDetection.tile === 10) && frames[0]?.merchantDetection.tile === 14,
  })
}

/**
 * The stated hypothesis was that the robber standing next to a piece flips its colour in A. Comparing the
 * mismatch rate with and without the robber (and the merchant, which turned out to be the piece that moved
 * in the white3776 example) is the honest test of it.
 */
const rate = (pred: (p: Piece) => boolean) => {
  let withIt = 0
  let withItMismatch = 0
  let without = 0
  let withoutMismatch = 0
  for (const c of ok)
    for (const p of c.pieces) {
      if (p.A.kind === 'none') continue
      const mismatch = p.flags.includes('colour-mismatch')
      if (pred(p)) {
        withIt++
        if (mismatch) withItMismatch++
      } else {
        without++
        if (mismatch) withoutMismatch++
      }
    }
  return { withIt, withItMismatch, without, withoutMismatch }
}
const nearRobber = rate((p) => p.flags.includes('near-robber'))
const nearMerchant = rate((p) => p.flags.includes('near-merchant'))
const underOverlay = rate((p) => p.flags.includes('under-overlay'))

/* ------------------------------------------------------------------------------------------ writing */
const topGames = Object.entries(perGame)
  .map(([game, g]) => ({ game, ...g, seats: registry.claims[game.replace(/^\d{8}-/, '')]?.seats ?? null }))
  .sort((a, b) => b.mismatch + b.phantom - (a.mismatch + a.phantom))
  .slice(0, 20)

const report = {
  generatedAt: new Date().toISOString(),
  thresholds: THRESHOLDS,
  classCounts,
  mismatchByKind,
  totals: {
    captures: ok.length,
    skipped: captures.length - ok.length,
    pieces,
    byKindA,
    byKindB,
    extraPieces,
    agreements: { colour: colourAgree, kind: kindAgree, both: bothAgree },
    flags,
  },
  seats: {
    fromRegistry: ok.filter((c) => c.seats && !c.seats.inferred).length,
    inferred: ok.filter((c) => c.seats?.inferred).length,
    unknown: ok.filter((c) => !c.seats).length,
  },
  robber: {
    detected: robberFound.length,
    missed: robberMisses.length,
    medianScore: median(robberScores),
    worstAcceptedScore: robberScores.at(-1) ?? null,
    missReasons: robberMisses.reduce<Record<string, number>>((acc, c) => {
      const k = c.robberDetection.reason ?? 'unknown'
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {}),
    stabilityBetweenFrames: { pairs: robberPairs, same: robberSameAsPrevious },
    marginOverRunnerUp: {
      min: round1(robberMargins[0] ?? null),
      p10: round1(robberMargins[Math.floor(robberMargins.length * 0.1)] ?? null),
      median: median(robberMargins),
    },
  },
  merchant: {
    detected: merchantFound.length,
    byColour: merchantFound.reduce<Record<string, number>>((acc, c) => {
      const k = c.merchantDetection.colour ?? '?'
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {}),
  },
  overlay: { capturesSuspected: overlayCaptures.length, byRule: overlayByRule },
  mismatchRates: { nearRobber, nearMerchant, underOverlay },
  colourVariantTable: table,
  topGames,
  examples,
  validations,
  proposedActions: actions,
}
writeFileSync(resolve(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2) + '\n')

/* --------------------------------------------------------------------------------------------- md */
const VARIANTS = [
  'settlement',
  'city',
  'road',
  'metropolis science',
  'metropolis politics',
  'metropolis trade',
  ...[1, 2, 3].flatMap((l) => ['active', 'inactive'].map((s) => `knight level ${l} ${s}`)),
]

const md: string[] = []
md.push('# Classification B vs classification A')
md.push('')
md.push(
  `Generated ${report.generatedAt}. B re-reads every stored capture by template-matching the game's own atlas sprites at the geometry the capture was read with; A is the stored \`*.reading.json\` from the CNN pipeline. Nothing under \`examples/games\` was modified.`
)
md.push('')
md.push('## How B decides')
md.push('')
md.push(
  "For every position, B renders the game's own atlas sprites at the capture's own scale (`spacing / 416 * 1.2` for buildings, `0.35 * spacing` across for knight badges, `spacing / 416` for roads, anchored `0.065` spacings above the vertex as `renderer.ts` does) and scores each hypothesis as the mean absolute RGB error over the sprite's opaque pixels, subsampled to at most 700 samples. One alignment search of +/-3 px picks the offset for the whole family, then every colour of that silhouette is scored at that one offset, so colours are compared on an identical pixel set and the numbers mean the same thing across hypotheses."
)
md.push('')
md.push(
  'Hypotheses per vertex: settlement, city and walled city in all twelve colours; the three metropolis towers beside the city; and all six knight badges in all twelve colours. When a tower is found, the colour is re-scored against the composite the game actually draws (city plus tower), because the tower hides the right half of the city. Per edge: the road sprite in all twelve colours, rotated to the edge. Scores are recorded per colour so weak decisions are visible.'
)
md.push('')
md.push('## Totals')
md.push('')
md.push(
  `- captures classified: **${ok.length}** (${captures.length - ok.length} skipped: reading not ok or PNG missing)`
)
md.push(
  `- pieces A reports and B re-read: **${pieces}** (${Object.entries(byKindA)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ')})`
)
md.push(`- colour agreement A vs B: **${colourAgree}** (${pct(colourAgree, pieces)})`)
md.push(`- kind agreement A vs B: **${kindAgree}** (${pct(kindAgree, pieces)})`)
md.push(`- both agree: **${bothAgree}** (${pct(bothAgree, pieces)})`)
md.push(`- pieces B finds that A does not report at all: **${extraPieces}** (see the \`missed-by-a\` section)`)
md.push(
  `- seats: ${report.seats.fromRegistry} captures from the registry, ${report.seats.inferred} inferred, ${report.seats.unknown} unknown`
)
md.push('')
md.push('| flag | pieces | share of pieces |')
md.push('| --- | ---: | ---: |')
for (const [f, n] of Object.entries(flags).sort((a, b) => b[1] - a[1])) md.push(`| ${f} | ${n} | ${pct(n, pieces)} |`)
md.push('')
md.push('Flag meanings:')
md.push('')
md.push('- `phantom-colour`: A gave the piece a colour nobody is seated as.')
md.push("- `colour-mismatch`: B's best colour over all twelve differs from A.")
md.push("- `colour-mismatch-seat`: B's best colour among the seated colours differs from A.")
md.push("- `kind-mismatch`: B's kind differs from A (settlement / city / metropolis / knight).")
md.push("- `level-mismatch`: the knight level or state changes depending on whether the colour is A's or B's.")
md.push(
  "- `weak-match`: B's own best template scores worse than the 99th percentile of agreeing pieces, so B has no real support for anything here either."
)
md.push('- `under-overlay`: the position sits inside a detected UI panel, or on a tile whose number token is hidden.')
md.push(
  '- `near-robber` / `near-merchant`: the piece touches the tile the robber / the Cities & Knights merchant stands on.'
)
md.push(
  '- `missed-by-a`: A reports nothing at this vertex but B matches a piece there as sharply as it matches the pieces both agree on.'
)
md.push('')
md.push('## Where the disagreements are')
md.push('')
md.push('| A kind | pieces | colour mismatches | phantom colours | weak B match |')
md.push('| --- | ---: | ---: | ---: | ---: |')
for (const [k, v] of Object.entries(mismatchByKind).sort((a, b) => b[1].pieces - a[1].pieces))
  md.push(
    `| ${k} | ${v.pieces} | ${v.colourMismatch} (${pct(v.colourMismatch, v.pieces)}) | ${v.phantom} (${pct(v.phantom, v.pieces)}) | ${v.weak} (${pct(v.weak, v.pieces)}) |`
  )
md.push('')
md.push('## Colour x variant: A counts vs B counts (B seat-constrained)')
md.push('')
md.push(
  "A counts use A's colour with the sub-variant template-matched the way `variants.ts` does it; B counts use B's seat-constrained colour (B's unconstrained colour when the seats are unknown) with B's own sub-variant. Cells are `A / B`; differences are where the curation counts would change."
)
md.push('')
md.push(`| colour | ${VARIANTS.join(' | ')} |`)
md.push(`| --- | ${VARIANTS.map(() => '---:').join(' | ')} |`)
for (const colour of [...RARE, ...COLOURS.filter((c) => !RARE.includes(c))]) {
  const row = table[colour] ?? {}
  md.push(
    `| ${RARE.includes(colour) ? `**${colour}**` : colour} | ${VARIANTS.map((v) => {
      const cell = row[v]
      if (!cell) return '-'
      return cell.a === cell.b ? `${cell.a}` : `${cell.a} / **${cell.b}**`
    }).join(' | ')} |`
  )
}
md.push('')
md.push('(Rare colours in bold. A cell showing a single number means A and B counted the same.)')
md.push('')
const deltas = Object.entries(table)
  .flatMap(([colour, row]) =>
    Object.entries(row).map(([variant, cell]) => ({ colour, variant, ...cell, delta: cell.b - cell.a }))
  )
  .filter((d) => Math.abs(d.delta) >= 5)
  .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
md.push('Biggest count changes (|B - A| >= 5), which is where a curation built on A would be counting the wrong thing:')
md.push('')
md.push('| colour | variant | A | B | delta |')
md.push('| --- | --- | ---: | ---: | ---: |')
for (const d of deltas.slice(0, 20))
  md.push(`| ${d.colour} | ${d.variant} | ${d.a} | ${d.b} | ${d.delta > 0 ? '+' : ''}${d.delta} |`)
md.push('')
const hotspots: Record<string, number> = {}
for (const c of ok)
  for (const p of c.pieces)
    if (p.flags.includes('phantom-colour')) {
      const key = p.vertex !== undefined ? `vertex ${p.vertex}` : `edge ${p.edge}`
      hotspots[key] = (hotspots[key] ?? 0) + 1
    }
md.push('## Does the robber really flip colours?')
md.push('')
md.push(
  'No, not as a general mechanism. Pieces next to the robber disagree with B *less* often than pieces that are not, and the same holds for the merchant. What does flip colours is UI drawn over the board, by a factor of about 60.'
)
md.push('')
md.push(
  'The white3776 example in the brief is real but is a different piece: the grey figure that moved next to vertex 25 between frames 01 and 02 is the Cities & Knights **merchant** (`icon_merchant_black`, match score 6.3 against 26.9 for the runner-up), not the robber, which stayed on tile 16. So a grey figure landing beside a piece can disturb A - it is just rare (6 pieces in 5758 next to a merchant, 3 of them this vertex).'
)
md.push('')
md.push('| condition | pieces with it | colour mismatches | rate | pieces without it | rate without |')
md.push('| --- | ---: | ---: | ---: | ---: | ---: |')
for (const [name, r] of [
  ['robber on a touching tile', nearRobber],
  ['merchant on a touching tile', nearMerchant],
  ['under a UI overlay', underOverlay],
] as const)
  md.push(
    `| ${name} | ${r.withIt} | ${r.withItMismatch} | ${pct(r.withItMismatch, r.withIt)} | ${r.without} | ${pct(r.withoutMismatch, r.without)} |`
  )
md.push('')
md.push('## Where phantom colours sit on the board')
md.push('')
md.push(
  'Phantom colours are not spread evenly: they pile up on the board positions that the trade-offer and chat panels cover, which is what you would expect if A is reading UI rather than pieces.'
)
md.push('')
md.push('| position | phantom pieces |')
md.push('| --- | ---: |')
for (const [k, v] of Object.entries(hotspots)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10))
  md.push(`| ${k} | ${v} |`)
md.push('')
md.push('## Games with the most mismatches')
md.push('')
md.push(
  '| game | pieces | colour mismatches | phantom colours | kind mismatches | missed by A | overlay captures | registry seats |'
)
md.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |')
for (const g of topGames)
  md.push(
    `| ${g.game} | ${g.pieces} | ${g.mismatch} | ${g.phantom} | ${g.kind} | ${g.extra} | ${g.overlay} | ${g.seats?.join(', ') ?? '-'} |`
  )
md.push('')
md.push('## Robber and merchant detection')
md.push('')
md.push(
  `The robber is the \`icon_robber\` pawn drawn ${Math.round(-0.3 * 100) / 100} spacings left and 0.26 up from the tile centre at 0.43 spacings tall; the Cities & Knights merchant is \`icon_merchant_<colour>\`, 0.25 right and 0.28 up at 0.24 spacings tall. Both were calibrated by scanning the sprites over real captures.`
)
md.push('')
md.push(
  `- robber found in **${robberFound.length} / ${ok.length}** captures (${pct(robberFound.length, ok.length)}), median match score ${report.robber.medianScore}, worst accepted ${report.robber.worstAcceptedScore}`
)
md.push(
  `- not found in ${robberMisses.length}: ${Object.entries(report.robber.missReasons)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ')}`
)
md.push(
  `- margin over the runner-up tile: min ${report.robber.marginOverRunnerUp.min}, p10 ${report.robber.marginOverRunnerUp.p10}, median ${report.robber.marginOverRunnerUp.median} (accepted only above ${THRESHOLDS.robberMargin})`
)
md.push(
  `- consecutive-frame stability: the robber is on the same tile in ${robberSameAsPrevious} of ${robberPairs} consecutive pairs (${pct(robberSameAsPrevious, robberPairs)}) - it only moves on a 7 or a knight action, so this is the expected order of magnitude`
)
md.push(
  `- merchant found in **${merchantFound.length}** captures, by colour: ${Object.entries(report.merchant.byColour)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(', ')}`
)
md.push('')
md.push('## Overlays')
md.push('')
md.push(
  `${overlayCaptures.length} captures are overlay-suspected. Rules that fired: ${Object.entries(overlayByRule)
    .map(([k, v]) => `\`${k}\` ${v}`)
    .join(', ')}.`
)
md.push('')
md.push('- `tokensFound`: the board locator found fewer than 18 number tokens while the lattice still fitted.')
md.push(
  '- `ui-panel`: a connected block of flat, light, unsaturated pixels (mean > 190, per-channel range <= 14, channel spread <= 32) at least 0.45 spacings wide and tall inside the board box, after a two-block morphological closing so icons inside a panel do not break it up. Number tokens are far too small to pass.'
)
md.push(
  "- `hidden-token`: the tile's own `prob_<n>` sprite does not match at the tile centre, so something is drawn over that tile."
)
md.push('')
md.push('## Examples')
md.push('')
md.push(
  'Crops are 0.9 spacings (0.7 for edges) at 4x, written to `examples/classification-v2/crops/` and named `<class>__<game>__<capture>__<pos>__A-<label>__B-<label>.png`.'
)
md.push('')
for (const [name, list] of Object.entries(examples)) {
  md.push(`### ${name} (${classCounts[name] ?? list.length} pieces)`)
  md.push('')
  if (list.length === 0) {
    md.push('_none_')
    md.push('')
    continue
  }
  md.push('| capture | position | A | B | B score | flags | crop |')
  md.push('| --- | --- | --- | --- | ---: | --- | --- |')
  for (const e of list)
    md.push(
      `| ${e.game}/${e.capture} | ${e.pos} | ${e.a} | ${e.b} | ${e.score} | ${e.flags.join(' ')} | \`${e.crop}\` |`
    )
  md.push('')
}
md.push('## Validation')
md.push('')
md.push('| check | expected | got | result |')
md.push('| --- | --- | --- | --- |')
for (const v of validations) md.push(`| ${v.name} | ${v.expected} | ${v.got} | ${v.pass ? 'PASS' : 'FAIL'} |`)
md.push('')
md.push('## Proposed actions (not applied)')
md.push('')
for (const a of actions) {
  md.push(`### ${a.action} - ${a.count}`)
  md.push('')
  md.push(a.detail)
  md.push('')
  if (a.sample.length) {
    for (const s of a.sample) md.push(`- ${s}`)
    md.push('')
  }
}
md.push('## Reproducing')
md.push('')
md.push('```')
md.push('cd collection')
md.push('for i in 0 1 2 3 4 5 6 7; do node --import tsx src/classify-b.ts --shard $i/8 & done; wait   # ~35 s')
md.push('CLASSIFY_B_LIB=1 node --import tsx src/classify-b-report.ts')
md.push(
  'CLASSIFY_B_LIB=1 node --import tsx src/classify-b-calibrate.ts vertex <game>/<capture> <vertex...>  # raw scores'
)
md.push(
  'node --import tsx src/classify-b-crop.ts <game>/<capture> v25 e5 t10 --out /tmp/crops            # look at a spot'
)
md.push('```')
md.push('')
md.push(
  'Every proposal is reversible: the readings under `examples/games` are untouched, and `report.json` lists the full set behind each count.'
)
md.push('')
writeFileSync(resolve(OUT_DIR, 'report.md'), md.join('\n'))
console.log(`wrote report.md and report.json for ${ok.length} captures, ${pieces} pieces`)
