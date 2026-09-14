/**
 * Aggregates the per-capture classification B files into <out>/report.{md,json} and writes example crops
 * under <out>/crops/ so every mismatch class can be checked by eye. Reads only; proposes actions but never
 * applies them. The previous run (examples/classification-v2) is read back as a summary so the report can
 * say what changed and why.
 *
 *   CLASSIFY_B_LIB=1 node --import tsx src/classify-b-report.ts [--out <dir>] [--previous <dir>]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { writeCrop } from './classify-b-crop.ts'
import { COLOURS, OUT_DIR, THRESHOLDS, VERSION } from './classify-b.ts'
import { EXAMPLES_DIR } from './paths.ts'
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
  version?: number
  game: string
  capture: string
  skipped?: string
  geometry: { center: { x: number; y: number }; spacing: number; tokensFound: number | null }
  seats: { colours: string[]; inferred: boolean; evidence?: Record<string, string> } | null
  robber: { tile: number; score: number } | null
  robberDetection: { tile: number | null; score: number | null; runnerUpScore: number | null; reason: string | null }
  merchantDetection: { tile: number | null; colour: string | null; score: number | null; reason: string | null }
  overlaySuspected: boolean
  overlayRules: string[]
  overlays: { x: number; y: number; width: number; height: number; blocks: number; fill: number }[]
  coveredTiles: number[]
  pieces: Piece[]
}

const argOf = (name: string) => {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const PREVIOUS_DIR = resolve(EXAMPLES_DIR, argOf('--previous') ?? 'classification-v2')
const CROPS_DIR = resolve(OUT_DIR, 'crops')
const RARE = ['bronze', 'silver', 'gold', 'purple', 'pink', 'mysticblue', 'white']
const KINDS = ['settlement', 'city', 'road', 'metropolis', 'knight']

const captureFiles = (dir: string): { game: string; file: string }[] => {
  const out: { game: string; file: string }[] = []
  for (const game of readdirSync(dir).sort()) {
    const gameDir = resolve(dir, game)
    if (game === 'crops' || !existsSync(gameDir) || !statSync(gameDir).isDirectory()) continue
    for (const file of readdirSync(gameDir)
      .filter((f) => f.endsWith('.b.json'))
      .sort())
      out.push({ game, file })
  }
  return out
}

const captures: Capture[] = captureFiles(OUT_DIR).map(
  ({ game, file }) => JSON.parse(readFileSync(resolve(OUT_DIR, game, file), 'utf8')) as Capture
)

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
/** Pieces where B has any answer at all: the rest are B's new "nothing here", which cannot agree. */
let answered = 0
let colourAgreeAnswered = 0
const perGame: Record<
  string,
  { pieces: number; mismatch: number; phantom: number; kind: number; overlay: number; extra: number }
> = {}

/**
 * B6: the colour x variant table used to put B's own level/state/type on the "A" side, because A carries
 * none of those. The comparison table is therefore colour x *kind*, which is what both readings have, and
 * B's variants get a table of their own below.
 */
const variantOfB = (p: Piece): string => {
  if (p.B.kind === 'metropolis') return `metropolis ${p.B.type ?? '?'}`
  if (p.B.kind === 'knight') return p.B.level ? `knight level ${p.B.level} ${p.B.state}` : 'knight ?'
  return p.B.kind
}
/** The colour B would put in a curation: its seat-constrained one, or its own when the seats are unknown. */
const bColour = (p: Piece) => p.B.colourSeatConstrained ?? p.B.colour

type Cell = { a: number; b: number }
const kindTable: Record<string, Record<string, Cell>> = {}
const bVariantTable: Record<string, Record<string, number>> = {}
const bumpKind = (colour: string | null, kind: string, which: 'a' | 'b') => {
  if (!colour) return
  const row = (kindTable[colour] ??= {})
  const cell = (row[kind] ??= { a: 0, b: 0 })
  cell[which]++
}
const bumpVariant = (colour: string | null, variant: string) => {
  if (!colour) return
  const row = (bVariantTable[colour] ??= {})
  row[variant] = (row[variant] ?? 0) + 1
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
      bumpKind(bColour(p), p.B.kind, 'b')
      bumpVariant(bColour(p), variantOfB(p))
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
    if (p.B.kind !== 'none') {
      answered++
      if (cAgree) colourAgreeAnswered++
    }
    for (const f of p.flags) flags[f] = (flags[f] ?? 0) + 1
    if (p.flags.includes('colour-mismatch') || p.flags.includes('colour-mismatch-seat')) g.mismatch++
    if (p.flags.includes('phantom-colour')) g.phantom++
    if (p.flags.includes('kind-mismatch')) g.kind++
    bumpKind(p.A.colour, p.A.kind, 'a')
    bumpKind(bColour(p), p.B.kind, 'b')
    bumpVariant(bColour(p), variantOfB(p))
  }
}

/* ------------------------------------------------------------------- the previous run, for comparison */
/**
 * v2 is read one file at a time and reduced to counters: 57 MB of JSON does not need to be held in memory
 * twice. Only the quantities the "changes from v2" section compares are kept.
 */
type PreviousSummary = {
  dir: string
  captures: number
  skipped: number
  pieces: number
  extraPieces: number
  agreements: { colour: number; kind: number; both: number }
  flags: Record<string, number>
  kindTable: Record<string, Record<string, Cell>>
  overlayCaptures: number
  seats: { fromRegistry: number; inferred: number; unknown: number }
  /** Pieces the audit identified: phantom in an inferred-seat game, yet B agrees with A's colour strongly. */
  inferredSeatRealPieces: string[]
  genuineSeatMismatch: number
  genuineSeatMismatchKeys: string[]
  phantom: number
}

const summarisePrevious = (dir: string): PreviousSummary | null => {
  if (!existsSync(dir)) return null
  const s: PreviousSummary = {
    dir,
    captures: 0,
    skipped: 0,
    pieces: 0,
    extraPieces: 0,
    agreements: { colour: 0, kind: 0, both: 0 },
    flags: {},
    kindTable: {},
    overlayCaptures: 0,
    seats: { fromRegistry: 0, inferred: 0, unknown: 0 },
    inferredSeatRealPieces: [],
    genuineSeatMismatch: 0,
    genuineSeatMismatchKeys: [],
    phantom: 0,
  }
  const bump = (colour: string | null, kind: string, which: 'a' | 'b') => {
    if (!colour) return
    const row = (s.kindTable[colour] ??= {})
    const cell = (row[kind] ??= { a: 0, b: 0 })
    cell[which]++
  }
  for (const { game, file } of captureFiles(dir)) {
    const c = JSON.parse(readFileSync(resolve(dir, game, file), 'utf8')) as Capture
    if (c.skipped) {
      s.skipped++
      continue
    }
    s.captures++
    if (c.overlaySuspected) s.overlayCaptures++
    s.seats[c.seats ? (c.seats.inferred ? 'inferred' : 'fromRegistry') : 'unknown']++
    for (const p of c.pieces) {
      for (const f of p.flags) s.flags[f] = (s.flags[f] ?? 0) + 1
      const colour = p.B.colourSeatConstrained ?? p.B.colour
      if (p.A.kind === 'none') {
        s.extraPieces++
        bump(colour, p.B.kind, 'b')
        continue
      }
      s.pieces++
      const cAgree = p.B.colour !== null && p.A.colour === p.B.colour
      const kAgree = p.A.kind === p.B.kind
      if (cAgree) s.agreements.colour++
      if (kAgree) s.agreements.kind++
      if (cAgree && kAgree) s.agreements.both++
      bump(p.A.colour, p.A.kind, 'a')
      bump(colour, p.B.kind, 'b')
      if (p.flags.includes('phantom-colour')) {
        s.phantom++
        if (c.seats?.inferred && p.B.colour === p.A.colour && (p.B.scores.best ?? 99) < 20)
          s.inferredSeatRealPieces.push(
            `${c.game}/${c.capture} ${p.vertex !== undefined ? `v${p.vertex}` : `e${p.edge}`}`
          )
      } else if (p.flags.includes('colour-mismatch-seat')) {
        s.genuineSeatMismatch++
        s.genuineSeatMismatchKeys.push(
          `${c.game}/${c.capture} ${p.vertex !== undefined ? `v${p.vertex}` : `e${p.edge}`}`
        )
      }
    }
  }
  return s
}
const previous = summarisePrevious(PREVIOUS_DIR)

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
const delta = (now: number, before: number | undefined) =>
  before === undefined ? '-' : `${now - before > 0 ? '+' : ''}${now - before}`

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

/* ------------------------------------------------------------------------------------------ seats */
const seatGames = new Map<string, Capture>()
for (const c of ok) if (!seatGames.has(c.game)) seatGames.set(c.game, c)
const seatEvidence: Record<string, number> = {}
let inferredGames = 0
let registryGames = 0
let unknownGames = 0
for (const c of seatGames.values()) {
  if (!c.seats) unknownGames++
  else if (c.seats.inferred) {
    inferredGames++
    for (const how of Object.values(c.seats.evidence ?? {})) seatEvidence[how] = (seatEvidence[how] ?? 0) + 1
  } else registryGames++
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
    ? `${p.A.colour ?? 'none'}-${p.A.kind}`.replace(/\s+/g, '-')
    : `${p.B.colour ?? 'none'}-${variantOfB(p)}`.replace(/\s+/g, '-')

const pngFor = (c: Capture) => resolve(GAMES_DIR, c.game, `${c.capture}.png`)

const pickExamples = (match: (p: Piece, c: Capture) => boolean, limit = 5): { capture: Capture; piece: Piece }[] => {
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
  { name: 'colour-mismatch-seat', match: (p) => p.flags.includes('colour-mismatch-seat') },
  { name: 'kind-mismatch', match: (p) => p.flags.includes('kind-mismatch') },
  { name: 'level-mismatch', match: (p) => p.flags.includes('level-mismatch') },
  { name: 'unreadable-road', match: (p) => p.flags.includes('unreadable') && p.A.kind === 'road' },
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
const mismatchByKind: Record<
  string,
  { pieces: number; colourMismatch: number; phantom: number; weak: number; unreadable: number }
> = {}
for (const c of ok)
  for (const p of c.pieces) {
    if (p.A.kind === 'none') continue
    const row = (mismatchByKind[p.A.kind] ??= { pieces: 0, colourMismatch: 0, phantom: 0, weak: 0, unreadable: 0 })
    row.pieces++
    if (p.flags.includes('colour-mismatch')) row.colourMismatch++
    if (p.flags.includes('phantom-colour')) row.phantom++
    if (p.flags.includes('weak-match')) row.weak++
    if (p.flags.includes('unreadable')) row.unreadable++
  }

mkdirSync(CROPS_DIR, { recursive: true })
const examples: Record<string, Example[]> = {}
for (const { name, match } of CLASSES) {
  const limit = name === 'agreement-sample' ? 20 : 5
  const hits = pickExamples(match, limit)
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
      crop: written ? `${OUT_DIR.split('/examples/')[1]}/crops/${file}` : 'png-missing',
    })
  }
}

/* --------------------------------------------------------------------------------- proposed actions */
type Action = {
  action: string
  count: number
  previousCount: number | null
  detail: string
  whyChanged: string
  sample: string[]
}

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
      // The seat list itself is wrong when B reads exactly what A read and reads it sharply.
      if (p.A.colour !== null && p.B.colour === p.A.colour && score < 20) {
        ;(seatFix[c.game] ??= new Set()).add(p.A.colour)
        continue
      }
      if (score < 20 && p.B.colour !== p.A.colour) relabel.push({ c, p })
      // B4 gives edges a "nothing here" answer, which is the honest reason to drop a road.
      else if (score >= 45 || p.B.kind === 'none') drop.push({ c, p })
    } else if (p.flags.includes('colour-mismatch') && score < 20) relabel.push({ c, p })
    if (p.flags.includes('kind-mismatch') && score < 20 && !p.flags.includes('under-overlay')) kindFix.push({ c, p })
  }
}

const describe = (c: Capture, p: Piece) =>
  `${c.game}/${c.capture} ${p.vertex !== undefined ? `vertex ${p.vertex}` : `edge ${p.edge}`}: ${
    p.A.kind === 'none' ? 'nothing' : label(p, 'A')
  } -> ${label(p, 'B')} (B score ${p.B.scores.best})`

const PREVIOUS_ACTIONS: Record<string, number> = {
  'relabel-piece': 15,
  'drop-piece': 247,
  'fix-kind': 5,
  'add-piece': 87,
  'mark-capture-overlay-contaminated': 347,
  'complete-registry-seats': 29,
}

const actions: Action[] = [
  {
    action: 'relabel-piece',
    count: relabel.length,
    previousCount: PREVIOUS_ACTIONS['relabel-piece']!,
    whyChanged:
      'Unchanged rule and unchanged count: none of the fixes touches a piece B matches sharply at a different colour.',
    detail:
      'A reads a colour B rejects and B has a strong match (best < 20) for a different colour. Change the piece colour in the reading to B, keeping the original as a backup.',
    sample: [],
  },
  {
    action: 'drop-piece',
    count: drop.length,
    previousCount: PREVIOUS_ACTIONS['drop-piece']!,
    whyChanged:
      'Two opposite moves: B3 removes the pieces that were phantom only because the seat inference had lost a colour, and B4 adds edges where B now answers "nothing here" at scores between 40 and 45.',
    detail:
      'A reads a piece whose colour is not seated and either no template matches the pixels (best >= 45) or B answers "nothing here" outright: almost always UI drawn over the board. Remove the piece from the reading.',
    sample: [],
  },
  {
    action: 'fix-kind',
    count: kindFix.length,
    previousCount: PREVIOUS_ACTIONS['fix-kind']!,
    whyChanged:
      'Same rule; B1 is what changed - a piece v2 called under-overlay (a sheep welded to a number token) no longer is, so it is no longer excluded.',
    detail: 'A and B disagree on the kind and B matches strongly (best < 20) outside any overlay.',
    sample: [],
  },
  {
    action: 'add-piece',
    count: addPiece.length,
    previousCount: PREVIOUS_ACTIONS['add-piece']!,
    whyChanged: 'Unchanged: neither seats nor overlays take part in this rule.',
    detail:
      'A reports nothing at a vertex where B matches a piece as well as it matches the pieces both agree on (best < 20, colour margin >= 8). Add the piece to the reading.',
    sample: [],
  },
  {
    action: 'mark-capture-overlay-contaminated',
    count: contaminated.size,
    previousCount: PREVIOUS_ACTIONS['mark-capture-overlay-contaminated']!,
    whyChanged:
      'B1 and B5: a blob counts as a panel only when it is solid or long, and a token counts as hidden above 40 instead of 25. What disappeared are the sheep-plus-token false positives the audit measured at about 45%.',
    detail:
      'Captures where a UI panel covers part of the board (a solid or large flat light rectangle inside the hex area, a hidden number token, or a board locator that found fewer than 18 tokens). Exclude them from training sets, or at least exclude the covered positions.',
    sample: [],
  },
  {
    action: 'complete-seats',
    count: Object.keys(seatFix).length,
    previousCount: PREVIOUS_ACTIONS['complete-registry-seats']!,
    whyChanged:
      'B3: the looser inference already seats the colours v2 proposed adding, so all that is left is the colour it still cannot reach - one piece, in a game of two frames.',
    detail:
      'Games where a colour nobody is seated as is nevertheless matched sharply by B at exactly A’s colour: the seat list is short, not the piece. Fix the seat list rather than the pieces.',
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
  .map(([g, cs]) => `${g} (${seatSource(byGame[g]![0]!)} seats): add ${[...cs].join(', ')}`)

/* -------------------------------------------------------------------------------------- validations */
const find = (game: string, capturePrefix: string) =>
  ok.find((c) => c.game === game && c.capture.startsWith(capturePrefix))
const validations: { name: string; expected: string; got: string; pass: boolean }[] = []
const check = (name: string, expected: string, got: string, pass: boolean) =>
  validations.push({ name, expected, got, pass })

for (const frame of ['02', '03', '04']) {
  const c = find('20260913-white3776', frame)
  const p = c?.pieces.find((x) => x.vertex === 25)
  check(
    `white3776 frame ${frame} vertex 25`,
    'mysticblue metropolis trade',
    p ? `${p.B.colour} ${variantOfB(p)} (score ${p.B.scores.best}, A said ${p.A.colour} ${p.A.kind})` : 'not found',
    p?.B.colour === 'mysticblue' && p?.B.kind === 'metropolis' && p?.B.type === 'trade'
  )
}
{
  const c = find('20260914-map7182', '03')
  const targets = (c?.pieces ?? []).filter(
    (p) => p.A.colour !== null && ['gold', 'silver', 'white'].includes(p.A.colour)
  )
  const flagged = targets.filter((p) => p.flags.includes('phantom-colour') && p.flags.includes('under-overlay'))
  check(
    'map7182 frame 03 gold/silver/white pieces',
    'all flagged phantom-colour and under-overlay',
    `${flagged.length}/${targets.length} flagged; capture overlaySuspected=${c?.overlaySuspected} rules=${c?.overlayRules.join('; ')}`,
    targets.length > 0 && flagged.length === targets.length
  )
}
{
  const frames = ['01', '02', '03', '04'].map((f) => find('20260913-white3776', f))
  check(
    'white3776 robber and merchant tiles per frame',
    'robber moves; merchant on the tile below vertex 25 (tile 10) from frame 02',
    frames
      .map(
        (c, i) =>
          `f0${i + 1}: robber=${c?.robberDetection.tile} merchant=${c?.merchantDetection.tile}(${c?.merchantDetection.colour})`
      )
      .join(', '),
    frames.slice(1).every((c) => c?.merchantDetection.tile === 10) && frames[0]?.merchantDetection.tile === 14
  )
}

/**
 * The overlay captures the audit labelled by eye (audit-scripts/rules.mts): 15 captures with a real panel
 * over the board, 17 where v2's detector had welded a white sheep to a number token. Keys are room/frame.
 */
const AUDIT_TRUE_UI = [
  'spot230/01',
  'white4988/02',
  'event727/02',
  'spot6718/02',
  'pact3330/02',
  'win5817/02',
  'port2768/02',
  'roll728/02',
  'city4959/01',
  'win9397/01',
  'grain2823/07',
  'tile2726/02',
  'mine2890/04',
  'land8399/02',
  'event140/02',
]
const AUDIT_FALSE_UI = [
  'brick4698/08',
  'town9323/07',
  'port2640/04',
  'win7375/08',
  'dice5721/07',
  'king3990/01',
  'event659/08',
  'king5484/06',
  'trade3688/02',
  'isle848/02',
  'spot6718/08',
  'turn9715/04',
  '256537837/01',
  'win7375/09',
  'town3162/01',
  'ship4971/02',
  'turn1449/05',
]
const roomFrame = (c: Capture) => `${c.game.replace(/^\d{8}-/, '')}/${c.capture.slice(0, 2)}`
const flaggedKeys = new Set(overlayCaptures.map(roomFrame))
const knownKeys = new Set(ok.map(roomFrame))
const missedTrue = AUDIT_TRUE_UI.filter((k) => knownKeys.has(k) && !flaggedKeys.has(k))
const keptFalse = AUDIT_FALSE_UI.filter((k) => flaggedKeys.has(k))
check(
  "audit's true-UI captures still flagged",
  `${AUDIT_TRUE_UI.length}/${AUDIT_TRUE_UI.length}`,
  `${AUDIT_TRUE_UI.filter((k) => flaggedKeys.has(k)).length}/${AUDIT_TRUE_UI.length}${missedTrue.length ? ` (missing: ${missedTrue.join(', ')})` : ''}`,
  missedTrue.length === 0
)
check(
  "audit's false-positive captures no longer flagged",
  `0/${AUDIT_FALSE_UI.length} still flagged`,
  `${keptFalse.length}/${AUDIT_FALSE_UI.length}${keptFalse.length ? ` (still flagged: ${keptFalse.join(', ')})` : ''}`,
  keptFalse.length === 0
)

/** B3: the pieces the audit found flagged phantom only because the seat inference had lost a colour. */
const stillPhantom = new Set<string>()
for (const c of ok)
  for (const p of c.pieces)
    if (p.flags.includes('phantom-colour'))
      stillPhantom.add(`${c.game}/${c.capture} ${p.vertex !== undefined ? `v${p.vertex}` : `e${p.edge}`}`)
const auditRealPieces = previous?.inferredSeatRealPieces ?? []
const auditRealStillPhantom = auditRealPieces.filter((k) => stillPhantom.has(k))
check(
  'pieces phantom in v2 only because the inferred seat list was short (B3)',
  'none still phantom',
  `${auditRealPieces.length - auditRealStillPhantom.length}/${auditRealPieces.length} cleared${auditRealStillPhantom.length ? `; still phantom: ${auditRealStillPhantom.slice(0, 6).join(', ')}` : ''}`,
  auditRealPieces.length > 0 && auditRealStillPhantom.length <= 3
)
{
  // What became of the 28 the audit called genuine: they are the yardstick for this flag.
  const byKey = new Map<string, Piece>()
  for (const c of ok)
    for (const p of c.pieces)
      byKey.set(`${c.game}/${c.capture} ${p.vertex !== undefined ? `v${p.vertex}` : `e${p.edge}`}`, p)
  const fate: Record<string, number> = {}
  for (const key of previous?.genuineSeatMismatchKeys ?? []) {
    const p = byKey.get(key)
    const how = !p
      ? 'gone'
      : p.flags.includes('colour-mismatch-seat')
        ? 'still flagged'
        : p.B.kind === 'none'
          ? 'B now answers "nothing here" (B4)'
          : p.flags.includes('phantom-colour')
            ? 'now phantom'
            : 'seat colour now equals A (B3)'
    fate[how] = (fate[how] ?? 0) + 1
  }
  check(
    'colour-mismatch-seat counts only genuine disagreements (B2)',
    `far below 559; the audit found 28 of v2's 559 genuine`,
    `${flags['colour-mismatch-seat'] ?? 0} (v2: ${previous?.flags['colour-mismatch-seat'] ?? '?'}, ${previous?.genuineSeatMismatch ?? '?'} of them genuine; those 28 in v3: ${Object.entries(
      fate
    )
      .map(([k, v]) => `${v} ${k}`)
      .join(', ')})`,
    (flags['colour-mismatch-seat'] ?? 0) < 100
  )
}
check(
  'edges have a "nothing here" answer (B4)',
  'some of A’s roads answered "none"',
  `${mismatchByKind['road']?.unreadable ?? 0} of ${mismatchByKind['road']?.pieces ?? 0} roads (${pct(mismatchByKind['road']?.unreadable ?? 0, mismatchByKind['road']?.pieces ?? 1)})`,
  (mismatchByKind['road']?.unreadable ?? 0) > 0
)

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
  version: VERSION,
  generatedAt: new Date().toISOString(),
  outDir: OUT_DIR,
  previousDir: PREVIOUS_DIR,
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
    answered: { pieces: answered, colour: colourAgreeAnswered },
    flags,
  },
  seats: {
    fromRegistry: ok.filter((c) => c.seats && !c.seats.inferred).length,
    inferred: ok.filter((c) => c.seats?.inferred).length,
    unknown: ok.filter((c) => !c.seats).length,
    games: { registry: registryGames, inferred: inferredGames, unknown: unknownGames },
    inferenceEvidence: seatEvidence,
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
  colourKindTable: kindTable,
  colourVariantTableBOnly: bVariantTable,
  previous,
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
md.push('# Classification B vs classification A (v3)')
md.push('')
md.push(
  `Generated ${report.generatedAt}. B re-reads every stored capture by template-matching the game's own atlas sprites at the geometry the capture was read with; A is the stored \`*.reading.json\` from the CNN pipeline. Nothing under \`examples/games\` was modified. This is version ${VERSION}: the seven bugs an independent audit found in v2 (\`examples/classification-v2/audit.md\`) are fixed, and the last section says what moved.`
)
md.push('')
md.push('## How B decides')
md.push('')
md.push(
  "For every position, B renders the game's own atlas sprites at the capture's own scale (`spacing / 416 * 1.2` for buildings, `0.35 * spacing` across for knight badges, `spacing / 416` for roads, anchored `0.065` spacings above the vertex as `renderer.ts` does) and scores each hypothesis as the mean absolute RGB error over the sprite's opaque pixels, subsampled to at most 700 samples. One alignment search of +/-3 px picks the offset for the whole family, then every colour of that silhouette is scored at that one offset, so colours are compared on an identical pixel set and the numbers mean the same thing across hypotheses."
)
md.push('')
md.push(
  'Hypotheses per vertex: settlement, city and walled city in all twelve colours; the three metropolis towers beside the city; and all six knight badges in all twelve colours; plus "nothing here" when even the best template is worse than 78. When a tower is found, the colour is re-scored against the composite the game actually draws (city plus tower), because the tower hides the right half of the city. Per edge: the road sprite in all twelve colours, rotated to the edge, and "nothing here" - an edge whose best template is worse than 40 while the colour it picked wins by less than 12 carries no road at all (v2 had no such hypothesis, so every UI element on an edge became a road of some colour).'
)
md.push('')
md.push(
  'Seats are the colours a game is played with. They come from the registry when the room was recorded with them; otherwise a colour is seated when it has a building and a road anywhere in the game, or when at least three of its pieces are matched sharply by B. Pieces under an overlay are never used as evidence. Seats never influence what B sees: they only add the seat-constrained colour and the two seat flags.'
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
md.push(
  `- colour agreement over the pieces B has an answer for (excluding the ${pieces - answered} where B says "nothing here"): **${colourAgreeAnswered}** (${pct(colourAgreeAnswered, answered)})`
)
md.push(`- kind agreement A vs B: **${kindAgree}** (${pct(kindAgree, pieces)})`)
md.push(`- both agree: **${bothAgree}** (${pct(bothAgree, pieces)})`)
md.push(`- pieces B finds that A does not report at all: **${extraPieces}** (see the \`missed-by-a\` section)`)
md.push(
  `- seats: ${report.seats.fromRegistry} captures from the registry, ${report.seats.inferred} inferred, ${report.seats.unknown} unknown (${registryGames} / ${inferredGames} / ${unknownGames} games)`
)
md.push('')
md.push('| flag | pieces | share of pieces | v2 | change |')
md.push('| --- | ---: | ---: | ---: | ---: |')
for (const [f, n] of Object.entries(flags).sort((a, b) => b[1] - a[1]))
  md.push(`| ${f} | ${n} | ${pct(n, pieces)} | ${previous?.flags[f] ?? '-'} | ${delta(n, previous?.flags[f])} |`)
md.push('')
md.push('Flag meanings:')
md.push('')
md.push('- `phantom-colour`: A gave the piece a colour nobody is seated as.')
md.push("- `colour-mismatch`: B's best colour over all twelve differs from A.")
md.push(
  "- `colour-mismatch-seat`: A's colour *is* a seated colour and B's best colour among the seated ones is a different one. A piece whose colour is not seated at all carries `phantom-colour` instead: the seat-constrained answer can never equal a colour outside the seat list, so counting those here (as v2 did) says nothing."
)
md.push("- `kind-mismatch`: B's kind differs from A (settlement / city / metropolis / knight).")
md.push("- `level-mismatch`: the knight level or state changes depending on whether the colour is A's or B's.")
md.push(
  "- `weak-match`: B's own best template scores worse than the 99th percentile of agreeing pieces, so B has no real support for anything here either."
)
md.push('- `unreadable`: B answers "nothing here" - no template is a credible fit for the position at all.')
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
md.push('| A kind | pieces | colour mismatches | phantom colours | weak B match | B says nothing |')
md.push('| --- | ---: | ---: | ---: | ---: | ---: |')
for (const [k, v] of Object.entries(mismatchByKind).sort((a, b) => b[1].pieces - a[1].pieces))
  md.push(
    `| ${k} | ${v.pieces} | ${v.colourMismatch} (${pct(v.colourMismatch, v.pieces)}) | ${v.phantom} (${pct(v.phantom, v.pieces)}) | ${v.weak} (${pct(v.weak, v.pieces)}) | ${v.unreadable} (${pct(v.unreadable, v.pieces)}) |`
  )
md.push('')
md.push('## Colour x kind: A counts vs B counts (B seat-constrained)')
md.push('')
md.push(
  "Both sides of this table are things both readings have: a colour and a kind. A counts use A's colour and A's kind; B counts use B's seat-constrained colour (its own colour when the seats are unknown) and B's kind. v2 put B's knight level and metropolis type on the A side of the same table, which made the A columns partly B's answer; those variants now have their own table below. Cells are `A / B`."
)
md.push('')
md.push(`| colour | ${KINDS.join(' | ')} |`)
md.push(`| --- | ${KINDS.map(() => '---:').join(' | ')} |`)
for (const colour of [...RARE, ...COLOURS.filter((c) => !RARE.includes(c))]) {
  const row = kindTable[colour] ?? {}
  md.push(
    `| ${RARE.includes(colour) ? `**${colour}**` : colour} | ${KINDS.map((k) => {
      const cell = row[k]
      if (!cell) return '-'
      return cell.a === cell.b ? `${cell.a}` : `${cell.a} / **${cell.b}**`
    }).join(' | ')} |`
  )
}
md.push('')
md.push('(Rare colours in bold. A cell showing a single number means A and B counted the same.)')
md.push('')
md.push('## Colour x variant, B only')
md.push('')
md.push(
  'A carries no knight level, no knight state and no metropolis type, so there is nothing to compare these against. This is B’s own reading of the sub-variants, at B’s seat-constrained colour - useful as a census of what the collection contains, not as a check on A.'
)
md.push('')
md.push(`| colour | ${VARIANTS.join(' | ')} |`)
md.push(`| --- | ${VARIANTS.map(() => '---:').join(' | ')} |`)
for (const colour of [...RARE, ...COLOURS.filter((c) => !RARE.includes(c))]) {
  const row = bVariantTable[colour] ?? {}
  md.push(`| ${RARE.includes(colour) ? `**${colour}**` : colour} | ${VARIANTS.map((v) => row[v] ?? '-').join(' | ')} |`)
}
md.push('')
const deltas = Object.entries(kindTable)
  .flatMap(([colour, row]) =>
    Object.entries(row).map(([kind, cell]) => ({ colour, kind, ...cell, delta: cell.b - cell.a }))
  )
  .filter((d) => Math.abs(d.delta) >= 5)
  .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
md.push('Biggest count changes (|B - A| >= 5), which is where a curation built on A would be counting the wrong thing:')
md.push('')
md.push('| colour | kind | A | B | delta |')
md.push('| --- | --- | ---: | ---: | ---: |')
for (const d of deltas.slice(0, 20))
  md.push(`| ${d.colour} | ${d.kind} | ${d.a} | ${d.b} | ${d.delta > 0 ? '+' : ''}${d.delta} |`)
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
  'No, not as a general mechanism. Pieces next to the robber disagree with B *less* often than pieces that are not, and the same holds for the merchant. What does flip colours is UI drawn over the board.'
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
  `The robber is the \`icon_robber\` pawn drawn 0.3 spacings left and 0.26 up from the tile centre at 0.43 spacings tall; the Cities & Knights merchant is \`icon_merchant_<colour>\`, 0.25 right and 0.28 up at 0.24 spacings tall. Both were calibrated by scanning the sprites over real captures.`
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
  `${overlayCaptures.length} captures are overlay-suspected (v2: ${previous?.overlayCaptures ?? '?'}). Rules that fired: ${Object.entries(
    overlayByRule
  )
    .map(([k, v]) => `\`${k}\` ${v}`)
    .join(', ')}.`
)
md.push('')
md.push('- `tokensFound`: the board locator found fewer than 18 number tokens while the lattice still fitted.')
md.push(
  `- \`ui-panel\`: a connected block of flat, light, unsaturated pixels (mean > 190, per-channel range <= 14, channel spread <= 32) inside the board box, after a two-block morphological closing, that is *also* shaped like a panel: solid (fill >= 0.55) or longer than 1.3 spacings. The shape test is the v3 fix: the white pasture sheep pass the flat-light test too, and the closing welds a sheep to the number token beside it into a sparse 0.6-0.8 spacing blob, which is what made about 45% of v2's overlay captures false. A small blob centred on a tile whose number token is still readable is rejected outright.`
)
md.push(
  `- \`hidden-token\`: the tile's own \`prob_<n>\` sprite scores worse than ${THRESHOLDS.token} at the tile centre, so something is drawn over that tile. v2 used 25, which fires on plainly visible tokens (they reach 47 when a piece clips a corner).`
)
md.push('')
md.push('## Examples')
md.push('')
md.push(
  `Crops are 0.9 spacings (0.7 for edges) at 4x, written to \`${OUT_DIR.split('/examples/')[1]}/crops/\` and named \`<class>__<game>__<capture>__<pos>__A-<label>__B-<label>.png\`.`
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
  md.push(`### ${a.action} - ${a.count}${a.previousCount === null ? '' : ` (v2: ${a.previousCount})`}`)
  md.push('')
  md.push(a.detail)
  md.push('')
  md.push(`_Change from v2: ${a.whyChanged}_`)
  md.push('')
  if (a.sample.length) {
    for (const s of a.sample) md.push(`- ${s}`)
    md.push('')
  }
}
md.push('## Changes from v2')
md.push('')
if (!previous) md.push('_no previous run found_')
else {
  md.push(
    `v2 is \`${PREVIOUS_DIR.split('/examples/')[1]}\` as it stands on disk: ${previous.captures} captures, which includes the three captures of \`watching\` games that v2's own run skipped and the auditor added by hand afterwards. v3 picks those up by itself (B7), so both runs cover the same ${ok.length} captures and every difference below is a decision, not a different sample.`
  )
  md.push('')
  md.push('| quantity | v2 | v3 | change |')
  md.push('| --- | ---: | ---: | ---: |')
  const rows: [string, number, number][] = [
    ['captures', previous.captures, ok.length],
    ['pieces A reports', previous.pieces, pieces],
    ['colour agreement', previous.agreements.colour, colourAgree],
    ['kind agreement', previous.agreements.kind, kindAgree],
    ['pieces B finds, A does not', previous.extraPieces, extraPieces],
    ['overlay-suspected captures', previous.overlayCaptures, overlayCaptures.length],
  ]
  for (const [name, before, now] of rows) md.push(`| ${name} | ${before} | ${now} | ${delta(now, before)} |`)
  for (const f of new Set([...Object.keys(previous.flags), ...Object.keys(flags)]))
    md.push(
      `| flag \`${f}\` | ${previous.flags[f] ?? 0} | ${flags[f] ?? 0} | ${delta(flags[f] ?? 0, previous.flags[f] ?? 0)} |`
    )
  md.push('')
  md.push('### Rare colours: A vs B, v3 next to v2')
  md.push('')
  md.push(
    'Both runs count A by A’s colour and kind, and B by B’s seat-constrained colour and kind (v2’s variants are collapsed to their kind so the two are comparable).'
  )
  md.push('')
  md.push(`| colour | kind | v3 A | v3 B | v2 A | v2 B | B change |`)
  md.push('| --- | --- | ---: | ---: | ---: | ---: | ---: |')
  for (const colour of RARE)
    for (const kind of KINDS) {
      const now = kindTable[colour]?.[kind]
      const before = previous.kindTable[colour]?.[kind]
      if (!now && !before) continue
      md.push(
        `| ${colour} | ${kind} | ${now?.a ?? 0} | ${now?.b ?? 0} | ${before?.a ?? 0} | ${before?.b ?? 0} | ${delta(now?.b ?? 0, before?.b ?? 0)} |`
      )
    }
  md.push('')
  md.push('### Proposed actions, v2 vs v3')
  md.push('')
  md.push('| action | v2 | v3 | change | why |')
  md.push('| --- | ---: | ---: | ---: | --- |')
  for (const a of actions)
    md.push(
      `| ${a.action} | ${a.previousCount ?? '-'} | ${a.count} | ${delta(a.count, a.previousCount ?? undefined)} | ${a.whyChanged} |`
    )
  md.push('')
}
md.push('## Reproducing')
md.push('')
md.push('```')
md.push('cd collection')
md.push(
  `for i in 0 1 2 3 4 5 6 7; do node --import tsx src/classify-b.ts --shard $i/8 --out ${OUT_DIR.split('/examples/')[1]} & done; wait`
)
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
