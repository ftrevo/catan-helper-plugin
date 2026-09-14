/**
 * Classification B: an independent second reading of every stored capture, by template-matching the real
 * atlas artwork (the same sprites the game draws) at the board geometry the capture was read with, instead
 * of running the CNN piece classifier. Used to audit classification A (the stored *.reading.json).
 *
 *   node --import tsx src/classify-b.ts [--shard i/n] [--list <file>] [--debug <game>/<file>] [--limit n]
 *                                        [--out <dir>]
 *
 * Writes <out>/<game>/<capture>.b.json (default examples/classification-v3), one per capture. Read-only
 * with respect to examples/games. Captures are processed a whole game at a time, because the seat list a
 * capture is judged against is inferred from the whole game (see seatsForGame).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { TILE_VERTICES, VERTEX_TILES } from '../../extension-local/src/domain/vertices.ts'
import { EDGES } from '../../extension-local/src/domain/edges.ts'
import { edgeCenters, tileCenters, vertexCenters } from '../../extension-local/src/vision/layout.ts'
import { Atlas, drawSprite } from '../../training/src/atlas.ts'
import { EXAMPLES_DIR, TRAINING_DIR } from './paths.ts'
import { GAMES_DIR, readRegistry } from './registry.ts'

const { createCanvas, loadImage } = createRequire(resolve(TRAINING_DIR, 'src/atlas.ts'))(
  '@napi-rs/canvas'
) as typeof import('@napi-rs/canvas')

/** Output root: `--out <dir>` or $CLASSIFY_B_OUT, taken relative to examples/ unless it is absolute. */
const outFlag = (() => {
  const i = process.argv.indexOf('--out')
  return i >= 0 ? process.argv[i + 1] : undefined
})()
export const OUT_DIR = resolve(EXAMPLES_DIR, process.env.CLASSIFY_B_OUT ?? outFlag ?? 'classification-v3')
/** Bumped when the decisions change; written into every .b.json. 3 = the audit fixes B1-B7. */
export const VERSION = 3

/* ------------------------------------------------------------------ geometry constants (see renderer.ts) */
const TILE_SOURCE_WIDTH = 416
const PIECE_SCALE = 1.2
const PIECE_ANCHOR_DY = -0.065
const METROPOLIS_DX = 0.28
const KNIGHT_DIAMETER = 0.35
const WALL_DY = 0.04
/**
 * Robber and merchant, measured against the atlas sprites on real captures (calibrate-b robberscan): the
 * robber stands left of the tile centre, the Cities & Knights merchant right of it, and both are drawn
 * well above the number token. Sizes are the sprite frame height in spacings.
 */
const ROBBER_HEIGHT = 0.43
const ROBBER_OFFSET = { x: -0.3, y: -0.26 }
const MERCHANT_HEIGHT = 0.24
const MERCHANT_OFFSET = { x: 0.25, y: -0.28 }

export const COLOURS = [
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
] as const
export type Colour = (typeof COLOURS)[number]
const TOWER_TYPES = ['science', 'politics', 'trade'] as const
const KNIGHT_LEVELS = [1, 2, 3] as const
const KNIGHT_STATES = ['active', 'inactive'] as const

/** Decision thresholds, calibrated in calibrate-b.ts against captures whose A reading is uncontested. */
export const THRESHOLDS = {
  /** Above this the best building/knight template is not a recognisable piece at all. */
  none: 78,
  /** A metropolis tower is present when the best tower template scores below this. */
  tower: 35,
  /**
   * Edges get a "nothing here" hypothesis of their own (B4). An edge carries no road when the best road
   * template is worse than `roadNone` *and* the colour it picked wins by less than `roadNoneMargin` (a real
   * road is either a sharp match or at least an unambiguous colour), or when even the best template is
   * hopeless (`roadNoneAbsolute`). Calibrated on 120 overlay-free captures - 1,664 edges A reports a road
   * on, 6,976 it leaves empty: the rule calls 1.5% of A's roads nothing, 76% of the empty edges nothing,
   * and fires on 95% of the edge-5 "roads" that sit under the trade-offer panel.
   */
  roadNone: 40,
  roadNoneMargin: 12,
  roadNoneAbsolute: 80,
  /** A knight only beats a building when it is this much better (guards the cross-shape comparison). */
  knightMargin: 6,
  /** Robber accepted when its best tile beats the runner-up by this much and scores below robberMax. */
  robberMargin: 6,
  robberMax: 25,
  /** The Cities & Knights merchant, same rule. It is optional, so a miss just means "no merchant seen". */
  merchantMargin: 6,
  merchantMax: 25,
  /**
   * A number token that matches worse than this is hidden, which means something is drawn over the tile.
   * Recalibrated (B5) against the score distributions: tokens in captures with no panel at all score p50
   * 6.4, p99 13.7, p99.9 16.4 (n = 32,617), but a piece, a card or a tree clipping the corner of a plainly
   * visible token reaches 47, while tokens genuinely covered by a "+1 point" banner, a card or a panel run
   * 28-54 in the 35 tiles I labelled by eye. The two populations overlap between 30 and 50, so there is no
   * clean cut; 40 keeps the false "hidden" rate low (the 25 of v2 fired on plainly visible tokens) at the
   * cost of missing the lightest covers, which the panel rectangles catch anyway.
   */
  token: 40,
  /**
   * Above these, the artwork B matched is not really there. The 99th percentile of scores where A and B
   * agree is 13-17 for buildings and 57 for roads, which are thin and sit on varied tile artwork.
   */
  weak: { settlement: 25, city: 25, knight: 25, metropolis: 30, road: 60 } as Record<string, number>,
  /**
   * A vertex A reports nothing on only counts as a missed piece when B matches it about as well as it
   * matches the pieces A and B agree on (p99 is 13-17) and clearly prefers one colour.
   */
  extra: 20,
  extraMargin: 8,
}

/* ------------------------------------------------------------------------------------ template matching */
type Template = {
  readonly key: string
  /** Sample coordinates relative to the template centre, and their colours. */
  readonly dx: Int16Array
  readonly dy: Int16Array
  readonly r: Uint8Array
  readonly g: Uint8Array
  readonly b: Uint8Array
  readonly n: number
  readonly half: number
}

type Part = { sprite: string; dx: number; dy: number; scale: number; rotation?: number }

const atlas = await Atlas.load()

/** Renders a composite of atlas sprites around a common anchor and keeps up to ~700 opaque samples. */
const makeTemplate = (key: string, parts: readonly Part[]): Template => {
  let reach = 8
  for (const p of parts) {
    const s = atlas.get(p.sprite)
    reach = Math.max(
      reach,
      Math.abs(p.dx) + (s.sourceSize.w * p.scale) / 2,
      Math.abs(p.dy) + (s.sourceSize.h * p.scale) / 2
    )
  }
  const size = Math.ceil(reach * 2) + 4
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  for (const p of parts)
    drawSprite(ctx, atlas.get(p.sprite), size / 2 + p.dx, size / 2 + p.dy, p.scale, p.rotation ?? 0)
  const data = ctx.getImageData(0, 0, size, size).data
  const opaque: number[] = []
  for (let i = 0; i < size * size; i++) if (data[i * 4 + 3]! >= 200) opaque.push(i)
  const step = Math.max(1, Math.ceil(opaque.length / 700))
  const kept = opaque.filter((_, i) => i % step === 0)
  const n = kept.length
  const dx = new Int16Array(n)
  const dy = new Int16Array(n)
  const r = new Uint8Array(n)
  const g = new Uint8Array(n)
  const b = new Uint8Array(n)
  const half = size / 2
  kept.forEach((p, i) => {
    dx[i] = (p % size) - Math.floor(half)
    dy[i] = Math.floor(p / size) - Math.floor(half)
    r[i] = data[p * 4]!
    g[i] = data[p * 4 + 1]!
    b[i] = data[p * 4 + 2]!
  })
  return { key, dx, dy, r, g, b, n, half }
}

const cache = new Map<string, Template>()
const template = (key: string, parts: () => readonly Part[]): Template => {
  let t = cache.get(key)
  if (!t) cache.set(key, (t = makeTemplate(key, parts())))
  return t
}

type Img = { width: number; height: number; data: Uint8ClampedArray }

/** Mean absolute channel error over the template samples; Infinity when the template leaves the image. */
const score = (img: Img, t: Template, cx: number, cy: number): number => {
  const ox = Math.round(cx)
  const oy = Math.round(cy)
  const { dx, dy, r, g, b, n } = t
  const { width, height, data } = img
  let err = 0
  for (let i = 0; i < n; i++) {
    const ix = ox + dx[i]!
    const iy = oy + dy[i]!
    if (ix < 0 || iy < 0 || ix >= width || iy >= height) return Infinity
    const o = (iy * width + ix) * 4
    err += Math.abs(data[o]! - r[i]!) + Math.abs(data[o + 1]! - g[i]!) + Math.abs(data[o + 2]! - b[i]!)
  }
  return err / (n * 3)
}

/** Best score over a square search window, returning the offset that produced it. */
const scoreSearch = (img: Img, t: Template, cx: number, cy: number, radius: number) => {
  let best = Infinity
  let bx = 0
  let by = 0
  for (let oy = -radius; oy <= radius; oy++)
    for (let ox = -radius; ox <= radius; ox++) {
      const s = score(img, t, cx + ox, cy + oy)
      if (s < best) {
        best = s
        bx = ox
        by = oy
      }
    }
  return { score: best, dx: bx, dy: by }
}

/* ------------------------------------------------------------------------------------ hypothesis sets */
export type VertexScores = {
  settlement: Record<string, number>
  city: Record<string, number>
  cityWall: Record<string, number>
  tower: Record<string, number>
  /** City-plus-tower composites, only when a tower was found: the tower hides part of the city. */
  metropolis?: Record<string, number>
  metropolisType?: string
  knight: Record<string, number>
  offset: { dx: number; dy: number }
}

const round1 = (n: number) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : null)

export const scoreVertex = (img: Img, vx: number, vy: number, spacing: number): VertexScores => {
  const pieceScale = (spacing / TILE_SOURCE_WIDTH) * PIECE_SCALE
  const knightScale = (KNIGHT_DIAMETER * spacing) / atlas.get('knight_level1_active_red').sourceSize.w
  const anchorY = vy + PIECE_ANCHOR_DY * spacing
  const cityW = atlas.get('city_red').sourceSize.w
  const towerDx = METROPOLIS_DX * cityW * pieceScale
  const sk = (s: number) => s.toFixed(4)

  const buildingTemplates: { key: string; shape: 'settlement' | 'city' | 'cityWall'; colour: string; t: Template }[] =
    []
  for (const c of COLOURS) {
    buildingTemplates.push({
      key: `settlement|${c}`,
      shape: 'settlement',
      colour: c,
      t: template(`settlement_${c}@${sk(pieceScale)}`, () => [
        { sprite: `settlement_${c}`, dx: 0, dy: 0, scale: pieceScale },
      ]),
    })
    buildingTemplates.push({
      key: `city|${c}`,
      shape: 'city',
      colour: c,
      t: template(`city_${c}@${sk(pieceScale)}`, () => [{ sprite: `city_${c}`, dx: 0, dy: 0, scale: pieceScale }]),
    })
    buildingTemplates.push({
      key: `cityWall|${c}`,
      shape: 'cityWall',
      colour: c,
      t: template(`citywall_${c}@${sk(pieceScale)}@${spacing.toFixed(1)}`, () => [
        { sprite: `city_wall_${c}`, dx: 0, dy: WALL_DY * spacing, scale: pieceScale },
        { sprite: `city_${c}`, dx: 0, dy: 0, scale: pieceScale },
      ]),
    })
  }
  const knightTemplates: { key: string; t: Template }[] = []
  for (const c of COLOURS)
    for (const l of KNIGHT_LEVELS)
      for (const s of KNIGHT_STATES) {
        const name = `knight_level${l}_${s}_${c}`
        if (!atlas.has(name)) continue
        knightTemplates.push({
          key: `${c}|${l}|${s}`,
          t: template(`${name}@${sk(knightScale)}`, () => [{ sprite: name, dx: 0, dy: 0, scale: knightScale }]),
        })
      }

  // Pass 1: every hypothesis at the nominal position picks the shape to align with (all colours of a shape
  // share one silhouette, so one alignment serves them all). Pass 2 rescores everything there.
  let bestB = { score: Infinity, i: 0 }
  buildingTemplates.forEach((b, i) => {
    const s = score(img, b.t, vx, anchorY)
    if (s < bestB.score) bestB = { score: s, i }
  })
  let bestK = { score: Infinity, i: 0 }
  knightTemplates.forEach((k, i) => {
    const s = score(img, k.t, vx, vy)
    if (s < bestK.score) bestK = { score: s, i }
  })
  const alignB = scoreSearch(img, buildingTemplates[bestB.i]!.t, vx, anchorY, 3)
  const alignK = scoreSearch(img, knightTemplates[bestK.i]!.t, vx, vy, 3)
  const ax = vx + alignB.dx
  const ay = anchorY + alignB.dy
  const kx = vx + alignK.dx
  const ky = vy + alignK.dy

  const settlement: Record<string, number> = {}
  const city: Record<string, number> = {}
  const cityWall: Record<string, number> = {}
  for (const b of buildingTemplates) {
    const s = score(img, b.t, ax, ay)
    ;(b.shape === 'settlement' ? settlement : b.shape === 'city' ? city : cityWall)[b.colour] = s
  }
  const knight: Record<string, number> = {}
  for (const k of knightTemplates) knight[k.key] = score(img, k.t, kx, ky)

  // The tower stands beside the city; allow it a little slack of its own.
  const tower: Record<string, number> = {}
  for (const t of TOWER_TYPES)
    tower[t] = scoreSearch(
      img,
      template(`tower_${t}@${sk(pieceScale)}`, () => [{ sprite: `metropolis_${t}`, dx: 0, dy: 0, scale: pieceScale }]),
      ax + towerDx,
      ay,
      2
    ).score

  // A metropolis tower covers the right half of its city, so the plain city template scores badly there.
  // When a tower is found, score the composite the game actually draws instead.
  let metropolis: Record<string, number> | undefined
  let metropolisType: string | undefined
  const bestTower = TOWER_TYPES.reduce((a, t) => (tower[t]! < tower[a]! ? t : a), TOWER_TYPES[0])
  if (tower[bestTower]! < THRESHOLDS.tower) {
    metropolisType = bestTower
    metropolis = {}
    for (const c of COLOURS)
      metropolis[c] = score(
        img,
        template(`metro_${c}_${bestTower}@${sk(pieceScale)}`, () => [
          { sprite: `city_${c}`, dx: 0, dy: 0, scale: pieceScale },
          { sprite: `metropolis_${bestTower}`, dx: towerDx, dy: 0, scale: pieceScale },
        ]),
        ax,
        ay
      )
  }

  return {
    settlement,
    city,
    cityWall,
    tower,
    metropolis,
    metropolisType,
    knight,
    offset: { dx: alignB.dx, dy: alignB.dy },
  }
}

export type VertexDecision = {
  kind: 'settlement' | 'city' | 'metropolis' | 'knight' | 'none'
  shape?: string
  colour: string | null
  /** Always null here; applySeats fills it in once the game's seat list is known. */
  colourSeatConstrained: string | null
  /** Unrounded scores per colour for the hypothesis family B settled on, so seats can be applied later. */
  family: Record<string, number>
  wall?: boolean
  type?: string
  level?: number
  state?: string
  /** Knight variant re-derived with A's colour forced, to expose variant labels that hinge on the colour. */
  levelWithAColour?: number
  stateWithAColour?: string
  scores: {
    best: number | null
    runnerUp: number | null
    margin: number | null
    bestBuilding: number | null
    bestKnight: number | null
    bestTower: number | null
    perColour: Record<string, number | null>
    seatBest: number | null
  }
}

const argmin = <T extends string>(entries: [T, number][]): [T, number] =>
  entries.reduce((a, e) => (e[1] < a[1] ? e : a), ['' as T, Infinity])

export const decideVertex = (s: VertexScores, aColour?: string): VertexDecision => {
  const buildingBest: [string, number][] = []
  for (const c of COLOURS)
    buildingBest.push(
      [`settlement|${c}`, s.settlement[c]!],
      [`city|${c}`, s.city[c]!],
      [`cityWall|${c}`, s.cityWall[c]!]
    )
  const [bKey, bScore] = argmin(buildingBest)
  const [kKey, kScore] = argmin(Object.entries(s.knight) as [string, number][])
  const [tType, tScore] = argmin(Object.entries(s.tower) as [string, number][])

  const isKnight = kScore + THRESHOLDS.knightMargin < bScore
  const none = Math.min(bScore, kScore) > THRESHOLDS.none

  if (none) {
    return {
      kind: 'none',
      colour: null,
      colourSeatConstrained: null,
      family: {},
      scores: {
        best: round1(Math.min(bScore, kScore)),
        runnerUp: null,
        margin: null,
        bestBuilding: round1(bScore),
        bestKnight: round1(kScore),
        bestTower: round1(tScore),
        perColour: {},
        seatBest: null,
      },
    }
  }

  if (isKnight) {
    const perColour: Record<string, number | null> = {}
    const family: Record<string, number> = {}
    for (const c of COLOURS) {
      const best = argmin(
        Object.entries(s.knight)
          .filter(([k]) => k.startsWith(`${c}|`))
          .map(([k, v]) => [k, v] as [string, number])
      )
      perColour[c] = round1(best[1])
      family[c] = best[1]
    }
    const [colour, level, state] = kKey.split('|')
    const runnerUpColour = argmin(
      Object.entries(perColour)
        .filter(([c]) => c !== colour)
        .map(([c, v]) => [c, v ?? Infinity] as [string, number])
    )
    const aBest = aColour
      ? argmin(
          Object.entries(s.knight)
            .filter(([k]) => k.startsWith(`${aColour}|`))
            .map(([k, v]) => [k, v] as [string, number])
        )
      : null
    return {
      kind: 'knight',
      colour: colour!,
      colourSeatConstrained: null,
      family,
      level: Number(level),
      state,
      levelWithAColour: aBest && aBest[0] ? Number(aBest[0].split('|')[1]) : undefined,
      stateWithAColour: aBest && aBest[0] ? aBest[0].split('|')[2] : undefined,
      scores: {
        best: round1(kScore),
        runnerUp: round1(runnerUpColour[1]),
        margin: round1(runnerUpColour[1] - kScore),
        bestBuilding: round1(bScore),
        bestKnight: round1(kScore),
        bestTower: round1(tScore),
        perColour,
        seatBest: null,
      },
    }
  }

  const hasTower = tScore < THRESHOLDS.tower
  const [shape] = bKey.split('|') as ['settlement' | 'city' | 'cityWall', string]
  const family =
    hasTower && s.metropolis
      ? s.metropolis
      : shape === 'settlement'
        ? s.settlement
        : shape === 'city'
          ? s.city
          : s.cityWall
  const perColour: Record<string, number | null> = {}
  for (const c of COLOURS) perColour[c] = round1(family[c]!)
  const [colour, colourScore] = argmin(COLOURS.map((c) => [c, family[c]!] as [string, number]))
  const runnerUp = argmin(COLOURS.filter((c) => c !== colour).map((c) => [c, family[c]!] as [string, number]))
  return {
    kind: hasTower ? 'metropolis' : shape === 'settlement' ? 'settlement' : 'city',
    shape,
    colour,
    colourSeatConstrained: null,
    family,
    wall: shape === 'cityWall' ? true : undefined,
    type: hasTower ? tType : undefined,
    scores: {
      best: round1(colourScore),
      runnerUp: round1(runnerUp[1]),
      margin: round1(runnerUp[1] - colourScore),
      bestBuilding: round1(bScore),
      bestKnight: round1(kScore),
      bestTower: round1(tScore),
      perColour,
      seatBest: null,
    },
  }
}

/* ---------------------------------------------------------------------------------------------- roads */
export const scoreEdge = (img: Img, ex: number, ey: number, angle: number, spacing: number) => {
  const scale = spacing / TILE_SOURCE_WIDTH
  const key = (c: string) => `road_${c}@${scale.toFixed(4)}@${angle.toFixed(3)}`
  const templates = COLOURS.map((c) => ({
    c,
    t: template(key(c), () => [{ sprite: `road_${c}`, dx: 0, dy: 0, scale, rotation: angle }]),
  }))
  let best = { score: Infinity, i: 0 }
  templates.forEach((e, i) => {
    const s = score(img, e.t, ex, ey)
    if (s < best.score) best = { score: s, i }
  })
  const align = scoreSearch(img, templates[best.i]!.t, ex, ey, 3)
  const cx = ex + align.dx
  const cy = ey + align.dy
  const scores: Record<string, number> = {}
  for (const e of templates) scores[e.c] = score(img, e.t, cx, cy)
  return scores
}

/**
 * An edge is a road of some colour, or nothing at all. Without the second hypothesis (B4) every UI element
 * that happens to lie on an edge became "a road of some colour", because the argmin over twelve templates
 * always returns one.
 */
export const decideEdge = (scores: Record<string, number>) => {
  const [colour, best] = argmin(COLOURS.map((c) => [c, scores[c]!] as [string, number]))
  const runnerUp = argmin(COLOURS.filter((c) => c !== colour).map((c) => [c, scores[c]!] as [string, number]))
  const margin = runnerUp[1] - best
  const none = best > THRESHOLDS.roadNoneAbsolute || (best > THRESHOLDS.roadNone && margin < THRESHOLDS.roadNoneMargin)
  const perColour: Record<string, number | null> = {}
  for (const c of COLOURS) perColour[c] = round1(scores[c]!)
  return {
    kind: none ? ('none' as const) : ('road' as const),
    colour: none ? null : colour,
    colourSeatConstrained: null,
    scores: {
      best: round1(best),
      runnerUp: round1(runnerUp[1]),
      margin: round1(margin),
      perColour,
      seatBest: null,
    },
  }
}

/* ---------------------------------------------------------------------------- robber and merchant */
const ROBBER_SPRITES = ['icon_robber', 'icon_robber_cupid', 'icon_robber_lunar', 'icon_robber_santa', 'icon_robber_tie']

/**
 * The robber and the merchant each stand on exactly one tile, at a fixed offset from the tile centre.
 * Both are searched at all 19 tiles; a hit is only accepted when it clearly beats every other tile.
 */
const findFigure = (
  img: Img,
  geometry: { center: { x: number; y: number }; spacing: number },
  sprites: readonly string[],
  height: number,
  offset: { x: number; y: number },
  maxScore: number,
  margin: number
) => {
  const { spacing } = geometry
  const centers = tileCenters(geometry)
  const results = centers.map((c, tile) => {
    let best = Infinity
    let sprite = ''
    for (const name of sprites) {
      const s = atlas.get(name)
      const scale = (height * spacing) / s.sourceSize.h
      const t = template(`${name}@${scale.toFixed(4)}`, () => [{ sprite: name, dx: 0, dy: 0, scale }])
      const found = scoreSearch(img, t, c.x + offset.x * spacing, c.y + offset.y * spacing, 6).score
      if (found < best) {
        best = found
        sprite = name
      }
    }
    return { tile, score: best, sprite }
  })
  const sorted = [...results].sort((a, b) => a.score - b.score)
  const top = sorted[0]!
  const second = sorted[1]!
  const accepted = top.score < maxScore && second.score - top.score >= margin
  return {
    tile: accepted ? top.tile : null,
    sprite: accepted ? top.sprite : null,
    score: round1(top.score),
    runnerUpScore: round1(second.score),
    reason: accepted ? null : top.score >= maxScore ? 'no-close-match' : 'ambiguous',
    all: results.map((r) => ({ tile: r.tile, score: round1(r.score), sprite: r.sprite })),
  }
}

export const findRobber = (img: Img, geometry: { center: { x: number; y: number }; spacing: number }) =>
  findFigure(img, geometry, ROBBER_SPRITES, ROBBER_HEIGHT, ROBBER_OFFSET, THRESHOLDS.robberMax, THRESHOLDS.robberMargin)

export const findMerchant = (img: Img, geometry: { center: { x: number; y: number }; spacing: number }) => {
  const found = findFigure(
    img,
    geometry,
    COLOURS.map((c) => `icon_merchant_${c}`),
    MERCHANT_HEIGHT,
    MERCHANT_OFFSET,
    THRESHOLDS.merchantMax,
    THRESHOLDS.merchantMargin
  )
  return { ...found, colour: found.sprite ? found.sprite.replace('icon_merchant_', '') : null }
}

/* -------------------------------------------------------------------------------------------- overlay */
/**
 * UI panels (trade offers, dice, banners, the "answering trade" strip) drawn over the board are large
 * areas of flat, light, unsaturated pixels. The board artwork is not - with one exception that broke v2
 * (B1): the white pasture sheep also read as flat, light and unsaturated, and the two-block closing below
 * welds a sheep to the neighbouring number token into a 0.6-0.8 spacing blob that used to clear the size
 * filter. Those blobs are sparse (fill 0.27-0.51 in every labelled case) where a real panel is a solid
 * rectangle (fill 0.55-1.0), so a blob is only kept as a panel when it is solid or big, and never when it
 * is a small blob sitting on a tile whose number token is still plainly visible.
 * Blocks are 8 px.
 */
/** A panel is a solid rectangle... */
const PANEL_FILL = 0.55
/** ...or longer than anything the board artwork draws (spacings, longest side)... */
const PANEL_LONG_SIDE = 1.3
/**
 * ...and then not too sparse either: the five long-rather-than-solid panels the audit labelled have fill
 * 0.42-0.48, while a chain of number tokens and sheep that happens to stretch over a spacing and a half has
 * 0.28-0.33. A long hollow blob is still a panel when it covers a tile whose number token B cannot read -
 * something is demonstrably drawn over the board there.
 */
const PANEL_LONG_MIN_FILL = 0.38
/** A long but sparse blob centred this close to a tile whose token is readable is sheep, not a panel. */
const SHEEP_BLOB_TILE_DISTANCE = 0.35
const closeMask = (mask: Uint8Array, cols: number, rows: number, radius: number): Uint8Array => {
  const grow = (src: Uint8Array, want: number) => {
    const out = new Uint8Array(cols * rows)
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        let hit = 0
        for (let dy = -radius; dy <= radius && !hit; dy++)
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx
            const ny = y + dy
            const v = nx < 0 || ny < 0 || nx >= cols || ny >= rows ? 0 : src[ny * cols + nx]!
            if (v === want) {
              hit = 1
              break
            }
          }
        out[y * cols + x] = want === 1 ? hit : hit ? 0 : 1
      }
    return out
  }
  return grow(grow(mask, 1), 0)
}

export const findOverlays = (
  img: Img,
  geometry: { center: { x: number; y: number }; spacing: number },
  /** Which tiles B can still read the number token of, and which it cannot (see findCoveredTiles). */
  tokens: { visible: readonly number[]; covered: readonly number[] } = { visible: [], covered: [] }
) => {
  const { spacing } = geometry
  const centers = tileCenters(geometry)
  const faces = centers.map((c) => ({ x: c.x, y: c.y - 0.18 * spacing }))
  const reach = spacing * 0.62
  const minX = Math.max(0, Math.floor(Math.min(...faces.map((c) => c.x)) - reach))
  const maxX = Math.min(img.width, Math.ceil(Math.max(...faces.map((c) => c.x)) + reach))
  const minY = Math.max(0, Math.floor(Math.min(...faces.map((c) => c.y)) - reach))
  const maxY = Math.min(img.height, Math.ceil(Math.max(...faces.map((c) => c.y)) + reach))
  const B = 8
  const cols = Math.max(0, Math.floor((maxX - minX) / B))
  const rows = Math.max(0, Math.floor((maxY - minY) / B))
  if (cols === 0 || rows === 0)
    return { overlays: [], rejected: [], uiFraction: 0, boardBox: { minX, minY, maxX, maxY } }
  const ui = new Uint8Array(cols * rows)
  let uiCount = 0
  for (let by = 0; by < rows; by++)
    for (let bx = 0; bx < cols; bx++) {
      const x0 = minX + bx * B
      const y0 = minY + by * B
      let rs = 0,
        gs = 0,
        bs = 0,
        rMin = 255,
        rMax = 0,
        gMin = 255,
        gMax = 0,
        bMin = 255,
        bMax = 0
      for (let y = y0; y < y0 + B; y++)
        for (let x = x0; x < x0 + B; x++) {
          const o = (y * img.width + x) * 4
          const r = img.data[o]!,
            g = img.data[o + 1]!,
            b = img.data[o + 2]!
          rs += r
          gs += g
          bs += b
          if (r < rMin) rMin = r
          if (r > rMax) rMax = r
          if (g < gMin) gMin = g
          if (g > gMax) gMax = g
          if (b < bMin) bMin = b
          if (b > bMax) bMax = b
        }
      const n = B * B
      const mr = rs / n,
        mg = gs / n,
        mb = bs / n
      const mean = (mr + mg + mb) / 3
      const range = Math.max(rMax - rMin, gMax - gMin, bMax - bMin)
      const grey = Math.max(mr, mg, mb) - Math.min(mr, mg, mb)
      if (mean > 190 && range <= 14 && grey <= 32) {
        ui[by * cols + bx] = 1
        uiCount++
      }
    }
  // Icons, avatars and text inside a panel break the flat background into islands; a morphological
  // closing of two blocks (16 px) welds them back into one rectangle without bridging number tokens,
  // which stand a whole spacing apart.
  const closed = closeMask(ui, cols, rows, 2)
  const seen = new Uint8Array(cols * rows)
  type Blob = { x: number; y: number; width: number; height: number; blocks: number; fill: number }
  const overlays: Blob[] = []
  const rejected: (Blob & { reason: string })[] = []
  const stack: number[] = []
  for (let i = 0; i < cols * rows; i++) {
    if (!closed[i] || seen[i]) continue
    stack.length = 0
    stack.push(i)
    seen[i] = 1
    let n = 0,
      x0 = cols,
      x1 = 0,
      y0 = rows,
      y1 = 0
    while (stack.length) {
      const j = stack.pop()!
      const jx = j % cols
      const jy = (j / cols) | 0
      n++
      if (jx < x0) x0 = jx
      if (jx > x1) x1 = jx
      if (jy < y0) y0 = jy
      if (jy > y1) y1 = jy
      for (let d = 0; d < 4; d++) {
        const nx = jx + (d === 0 ? 1 : d === 1 ? -1 : 0)
        const ny = jy + (d === 2 ? 1 : d === 3 ? -1 : 0)
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
        const k = ny * cols + nx
        if (closed[k] && !seen[k]) {
          seen[k] = 1
          stack.push(k)
        }
      }
    }
    const w = (x1 - x0 + 1) * B
    const h = (y1 - y0 + 1) * B
    // A number token is about 0.23 spacings across, so anything half a spacing wide and tall could be a
    // panel; the shape tests below decide whether it really is one.
    if (w < spacing * 0.45 || h < spacing * 0.45 || n < 25) continue
    const blob: Blob = {
      x: minX + x0 * B,
      y: minY + y0 * B,
      width: w,
      height: h,
      blocks: n,
      fill: Math.round((n / ((x1 - x0 + 1) * (y1 - y0 + 1))) * 100) / 100,
    }
    const long = Math.max(w, h) / spacing
    const bcx = blob.x + w / 2
    const bcy = blob.y + h / 2
    const solid = blob.fill >= PANEL_FILL
    const onVisibleToken = tokens.visible.some((t) => {
      const c = centers[t]
      return c ? Math.hypot(c.x - bcx, c.y - bcy) < SHEEP_BLOB_TILE_DISTANCE * spacing : false
    })
    const overCoveredToken = tokens.covered.some((t) => {
      const c = centers[t]
      return c ? c.x >= blob.x && c.x <= blob.x + w && c.y >= blob.y && c.y <= blob.y + h : false
    })
    if (!solid && long < PANEL_LONG_SIDE) rejected.push({ ...blob, reason: 'sparse-and-small' })
    else if (!solid && blob.fill < PANEL_LONG_MIN_FILL && !overCoveredToken)
      rejected.push({ ...blob, reason: 'long-but-hollow' })
    else if (!solid && onVisibleToken && !overCoveredToken)
      rejected.push({ ...blob, reason: 'sparse-on-visible-token' })
    else overlays.push(blob)
  }
  return {
    overlays: overlays.sort((a, b) => b.blocks - a.blocks),
    rejected: rejected.sort((a, b) => b.blocks - a.blocks),
    uiFraction: cols * rows ? Math.round((uiCount / (cols * rows)) * 1000) / 1000 : 0,
    boardBox: { minX, minY, maxX, maxY },
  }
}

/**
 * Which tiles have their number token visible. A panel over the board hides tokens, so a tile whose token
 * does not match is treated as covered; the desert carries no token and is never covered by this test.
 */
export const findCoveredTiles = (
  img: Img,
  geometry: { center: { x: number; y: number }; spacing: number },
  numbers: readonly (string | null)[]
) => {
  const scale = geometry.spacing / TILE_SOURCE_WIDTH
  const centers = tileCenters(geometry)
  const covered: number[] = []
  const scores: (number | null)[] = []
  centers.forEach((c, tile) => {
    const number = numbers[tile]
    if (!number || number === '7' || !atlas.has(`prob_${number}`)) {
      scores.push(null)
      return
    }
    const t = template(`prob_${number}@${scale.toFixed(4)}`, () => [{ sprite: `prob_${number}`, dx: 0, dy: 0, scale }])
    const s = scoreSearch(img, t, c.x, c.y, 3).score
    scores.push(round1(s))
    if (s > THRESHOLDS.token) covered.push(tile)
  })
  return { covered, scores }
}

/* ----------------------------------------------------------------------------------------- capture run */
type Reading = {
  ok: boolean
  location?: { center: { x: number; y: number }; spacing: number; tokensFound?: number; extraTokens?: number }
  board?: { position: number; number: string }[]
  pieces?: {
    buildings: { vertex: number; kind: string; colour: string }[]
    roads?: { edge: number; colour: string }[]
  }
}

export const loadImg = async (png: string): Promise<Img> => {
  const image = await loadImage(png)
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  const d = ctx.getImageData(0, 0, image.width, image.height)
  return { width: image.width, height: image.height, data: d.data }
}

const TILES_OF_VERTEX = VERTEX_TILES as readonly (readonly number[])[]
const EDGE_TILES: number[][] = EDGES.map(([a, b]) => {
  const ta = new Set(TILES_OF_VERTEX[a] ?? [])
  return (TILES_OF_VERTEX[b] ?? []).filter((t) => ta.has(t))
})

export type BPiece = {
  vertex?: number
  edge?: number
  A: { kind: string; colour: string | null }
  B: {
    kind: string
    shape?: string
    colour: string | null
    colourSeatConstrained: string | null
    wall?: boolean
    type?: string
    level?: number
    state?: string
    levelWithAColour?: number
    stateWithAColour?: string
    scores: {
      best: number | null
      runnerUp: number | null
      margin: number | null
      bestBuilding?: number | null
      bestKnight?: number | null
      bestTower?: number | null
      perColour: Record<string, number | null>
      seatBest: number | null
    }
    offset?: { dx: number; dy: number }
  }
  flags: string[]
}

/**
 * A piece before the game's seat list is known. Seats change nothing about what B sees; they only add the
 * seat-constrained colour and the two seat flags. Keeping the unrounded per-colour scores of the family B
 * settled on lets the seat constraint be applied afterwards, which is what makes the game-wide seat
 * inference of B3 possible.
 */
type RawPiece = { piece: BPiece; family: Record<string, number>; underOverlay: boolean }

/** Reads one capture without any seat knowledge. */
export const classifyCapture = async (dir: string, file: string) => {
  const readingPath = resolve(dir, file)
  const png = resolve(dir, file.replace(/\.reading\.json$/, '.png'))
  const reading = JSON.parse(readFileSync(readingPath, 'utf8')) as Reading
  if (!reading.ok || !reading.location || !reading.pieces) return null
  if (!existsSync(png)) return null
  const geometry = { center: reading.location.center, spacing: reading.location.spacing }
  const img = await loadImg(png)
  const vertices = vertexCenters(geometry)
  const edges = edgeCenters(geometry)

  const robber = findRobber(img, geometry)
  const merchant = findMerchant(img, geometry)
  const numbers: (string | null)[] = Array.from({ length: 19 }, () => null)
  for (const t of reading.board ?? []) numbers[t.position] = t.number
  // The tokens are read first: a blob of flat light pixels sitting on a tile whose number token is still
  // plainly readable cannot be a panel covering that tile (B1).
  const tokens = findCoveredTiles(img, geometry, numbers)
  const visibleTokenTiles: number[] = []
  tokens.scores.forEach((s, tile) => {
    if (s !== null && !tokens.covered.includes(tile)) visibleTokenTiles.push(tile)
  })
  const overlayInfo = findOverlays(img, geometry, { visible: visibleTokenTiles, covered: tokens.covered })
  const tokensFound = reading.location.tokensFound ?? null
  const overlayRules: string[] = []
  if (tokensFound !== null && tokensFound < 18) overlayRules.push(`tokensFound=${tokensFound}<18`)
  if (overlayInfo.overlays.length) overlayRules.push(`ui-panel x${overlayInfo.overlays.length}`)
  if (tokens.covered.length) overlayRules.push(`hidden-token tiles ${tokens.covered.join(',')}`)
  const overlaySuspected = overlayRules.length > 0

  // Pieces at the very edge of a panel are half covered, so the rectangles get a little slack.
  const pad = geometry.spacing * 0.18
  const inOverlay = (x: number, y: number) =>
    overlayInfo.overlays.some(
      (o) => x >= o.x - pad && x <= o.x + o.width + pad && y >= o.y - pad && y <= o.y + o.height + pad
    )
  const coveredTile = (tiles: readonly number[]) => tiles.some((t) => tokens.covered.includes(t))

  const robberTiles = robber.tile === null ? [] : [robber.tile]
  const merchantTiles = merchant.tile === null ? [] : [merchant.tile]
  const pieces: RawPiece[] = []

  for (const b of reading.pieces.buildings) {
    const v = vertices[b.vertex]
    if (!v) continue
    const s = scoreVertex(img, v.x, v.y, geometry.spacing)
    const d = decideVertex(s, b.colour)
    const flags: string[] = []
    if (d.colour && d.colour !== b.colour) flags.push('colour-mismatch')
    if (d.kind !== 'none' && d.kind !== b.kind) flags.push('kind-mismatch')
    if (d.kind === 'none') flags.push('unreadable')
    if (d.scores.best !== null && d.kind !== 'none' && d.scores.best > (THRESHOLDS.weak[d.kind] ?? 25))
      flags.push('weak-match')
    if (d.kind === 'knight' && b.kind === 'knight' && d.levelWithAColour !== undefined)
      if (d.levelWithAColour !== d.level || d.stateWithAColour !== d.state) flags.push('level-mismatch')
    if (robberTiles.length && (TILES_OF_VERTEX[b.vertex] ?? []).some((t) => robberTiles.includes(t)))
      flags.push('near-robber')
    if (merchantTiles.length && (TILES_OF_VERTEX[b.vertex] ?? []).some((t) => merchantTiles.includes(t)))
      flags.push('near-merchant')
    const underOverlay = inOverlay(v.x, v.y) || coveredTile(TILES_OF_VERTEX[b.vertex] ?? [])
    if (underOverlay) flags.push('under-overlay')
    pieces.push({
      piece: {
        vertex: b.vertex,
        A: { kind: b.kind, colour: b.colour },
        B: {
          kind: d.kind,
          shape: d.shape,
          colour: d.colour,
          colourSeatConstrained: null,
          wall: d.wall,
          type: d.type,
          level: d.level,
          state: d.state,
          levelWithAColour: d.levelWithAColour,
          stateWithAColour: d.stateWithAColour,
          scores: d.scores,
          offset: s.offset,
        },
        flags,
      },
      family: d.family,
      underOverlay,
    })
  }

  // Vertices A reports nothing on: B looks anyway, so pieces A dropped show up.
  const reported = new Set(reading.pieces.buildings.map((b) => b.vertex))
  vertices.forEach((v, vertex) => {
    if (reported.has(vertex)) return
    const s = scoreVertex(img, v.x, v.y, geometry.spacing)
    const d = decideVertex(s)
    if (d.kind === 'none' || d.colour === null) return
    if ((d.scores.best ?? 99) > THRESHOLDS.extra || (d.scores.margin ?? 0) < THRESHOLDS.extraMargin) return
    const flags = ['missed-by-a']
    if (robberTiles.length && (TILES_OF_VERTEX[vertex] ?? []).some((t) => robberTiles.includes(t)))
      flags.push('near-robber')
    if (merchantTiles.length && (TILES_OF_VERTEX[vertex] ?? []).some((t) => merchantTiles.includes(t)))
      flags.push('near-merchant')
    const underOverlay = inOverlay(v.x, v.y) || coveredTile(TILES_OF_VERTEX[vertex] ?? [])
    if (underOverlay) flags.push('under-overlay')
    pieces.push({
      piece: {
        vertex,
        A: { kind: 'none', colour: null },
        B: {
          kind: d.kind,
          shape: d.shape,
          colour: d.colour,
          colourSeatConstrained: null,
          wall: d.wall,
          type: d.type,
          level: d.level,
          state: d.state,
          scores: d.scores,
          offset: s.offset,
        },
        flags,
      },
      family: d.family,
      underOverlay,
    })
  })

  for (const r of reading.pieces.roads ?? []) {
    const m = edges[r.edge]
    const pair = EDGES[r.edge]
    if (!m || !pair) continue
    const p = vertices[pair[0]]!
    const q = vertices[pair[1]]!
    const angle = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2
    const s = scoreEdge(img, m.x, m.y, angle, geometry.spacing)
    const d = decideEdge(s)
    const flags: string[] = []
    if (d.colour && d.colour !== r.colour) flags.push('colour-mismatch')
    if (d.kind === 'none') flags.push('unreadable')
    if (d.scores.best !== null && d.kind !== 'none' && d.scores.best > THRESHOLDS.weak.road!) flags.push('weak-match')
    if (robberTiles.length && (EDGE_TILES[r.edge] ?? []).some((t) => robberTiles.includes(t))) flags.push('near-robber')
    if (merchantTiles.length && (EDGE_TILES[r.edge] ?? []).some((t) => merchantTiles.includes(t)))
      flags.push('near-merchant')
    const underOverlay = inOverlay(m.x, m.y) || coveredTile(EDGE_TILES[r.edge] ?? [])
    if (underOverlay) flags.push('under-overlay')
    pieces.push({
      piece: {
        edge: r.edge,
        A: { kind: 'road', colour: r.colour },
        B: { kind: d.kind, colour: d.colour, colourSeatConstrained: null, scores: d.scores },
        flags,
      },
      family: s,
      underOverlay,
    })
  }

  return {
    geometry: {
      center: geometry.center,
      spacing: geometry.spacing,
      tokensFound,
      extraTokens: reading.location.extraTokens ?? null,
    },
    robber:
      robber.tile === null
        ? null
        : { tile: robber.tile, score: robber.score, runnerUpScore: robber.runnerUpScore, sprite: robber.sprite },
    robberDetection: {
      tile: robber.tile,
      score: robber.score,
      runnerUpScore: robber.runnerUpScore,
      reason: robber.reason,
    },
    merchant:
      merchant.tile === null
        ? null
        : {
            tile: merchant.tile,
            colour: merchant.colour,
            score: merchant.score,
            runnerUpScore: merchant.runnerUpScore,
          },
    merchantDetection: {
      tile: merchant.tile,
      colour: merchant.colour,
      score: merchant.score,
      runnerUpScore: merchant.runnerUpScore,
      reason: merchant.reason,
    },
    overlaySuspected,
    overlayRules,
    overlays: overlayInfo.overlays,
    rejectedBlobs: overlayInfo.rejected,
    uiFraction: overlayInfo.uiFraction,
    coveredTiles: tokens.covered,
    tokenScores: tokens.scores,
    pieces,
  }
}

export type RawCapture = NonNullable<Awaited<ReturnType<typeof classifyCapture>>>
export type SeatInfo = { seats: string[] | null; inferred: boolean; evidence: Record<string, string> }

/**
 * Applies the game's seat list to one capture: the seat-constrained colour, and the two flags that depend
 * on seats. `colour-mismatch-seat` now means what it says (B2) - A's colour *is* one of the seated colours
 * and B's best seated colour is a different one. For a colour nobody is seated as, the seat-constrained
 * answer can never equal A, so those pieces carry `phantom-colour` alone.
 */
export const applySeats = (raw: RawCapture, seatInfo: SeatInfo) => {
  const seats = seatInfo.seats
  const pieces = raw.pieces.map(({ piece, family }) => {
    let colourSeatConstrained: string | null = null
    let seatBest: number | null = null
    if (seats?.length && piece.B.kind !== 'none') {
      const available = seats.filter((c) => c in family)
      if (available.length) {
        const [colour, value] = argmin(available.map((c) => [c, family[c]!] as [string, number]))
        colourSeatConstrained = colour
        seatBest = round1(value)
      }
    }
    const seatFlags: string[] = []
    if (seats) {
      const aColour = piece.A.kind === 'none' ? piece.B.colour : piece.A.colour
      if (aColour && !seats.includes(aColour)) seatFlags.push('phantom-colour')
      else if (piece.A.colour && colourSeatConstrained && colourSeatConstrained !== piece.A.colour)
        seatFlags.push('colour-mismatch-seat')
    }
    return {
      ...piece,
      B: { ...piece.B, colourSeatConstrained, scores: { ...piece.B.scores, seatBest } },
      flags: [...seatFlags, ...piece.flags],
    }
  })
  return {
    ...raw,
    seats: seats ? { colours: seats, inferred: seatInfo.inferred, evidence: seatInfo.evidence } : null,
    pieces,
  }
}

/* ------------------------------------------------------------------------------------------------- cli */
const args = process.argv.slice(2)
const arg = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

/**
 * Which colours are playing, inferred from the whole game when the registry does not say (B3). v2 wanted a
 * colour to have a building *and* a road in at least two frames, so a two-frame game lost a seat whenever
 * one piece was dropped; that produced 186 "phantom colour" pieces that are real pieces B agrees with A on.
 * A colour is seated now when it has a building and a road anywhere in the game, or when at least three of
 * its pieces are matched strongly by B (B's own colour equals A's, score < 20). Pieces sitting under an
 * overlay never count as evidence: they are the ones most likely to be UI read as a piece.
 */
export const inferSeats = (raws: readonly RawCapture[]): SeatInfo => {
  const withBuilding = new Set<string>()
  const withRoad = new Set<string>()
  const strong: Record<string, number> = {}
  for (const raw of raws)
    for (const { piece, underOverlay } of raw.pieces) {
      const colour = piece.A.colour
      if (!colour || underOverlay) continue
      if (piece.A.kind === 'road') withRoad.add(colour)
      else withBuilding.add(colour)
      if (piece.B.colour === colour && (piece.B.scores.best ?? 99) < THRESHOLDS.extra)
        strong[colour] = (strong[colour] ?? 0) + 1
    }
  const evidence: Record<string, string> = {}
  for (const colour of new Set([...withBuilding, ...withRoad, ...Object.keys(strong)]).values()) {
    const byPieces = withBuilding.has(colour) && withRoad.has(colour)
    const byMatch = (strong[colour] ?? 0) >= 3
    if (byPieces || byMatch)
      evidence[colour] = byPieces && byMatch ? 'building+road,strong-b' : byPieces ? 'building+road' : 'strong-b'
  }
  const seats = Object.keys(evidence).sort()
  return seats.length ? { seats, inferred: true, evidence } : { seats: null, inferred: false, evidence: {} }
}

/** Seats from the registry when the room was recorded with them, else inferred from the game. */
export const seatsForGame = (
  game: string,
  registry: ReturnType<typeof readRegistry>,
  raws: readonly RawCapture[]
): SeatInfo => {
  const room = game.replace(/^\d{8}-/, '')
  const claim = registry.claims[room]
  if (claim?.seats?.length) return { seats: [...claim.seats], inferred: false, evidence: {} }
  return inferSeats(raws)
}

const main = async () => {
  const registry = readRegistry()
  const shardArg = arg('--shard')
  const [shardIndex = 0, shardCount = 1] = shardArg ? shardArg.split('/').map(Number) : [0, 1]
  const limit = arg('--limit') ? Number(arg('--limit')) : Infinity
  const debug = arg('--debug')
  const list = arg('--list')

  // Captures are grouped by game because the seat list is a property of the game, not of the capture.
  const byGame = new Map<string, string[]>()
  const add = (game: string, file: string) => {
    const files = byGame.get(game) ?? []
    files.push(file.endsWith('.reading.json') ? file : `${file}.reading.json`)
    byGame.set(game, files)
  }
  if (debug) {
    const [game, file] = debug.split('/')
    add(game!, file!)
  } else if (list) {
    for (const line of readFileSync(list, 'utf8').split('\n').filter(Boolean)) {
      const [game, file] = line.split('/')
      add(game!, file!)
    }
  } else {
    // B7: every game folder that has readings, whatever the registry says. v2 skipped the games left
    // `watching` when the worker stopped, which silently dropped three captures.
    for (const game of readdirSync(GAMES_DIR).sort()) {
      const dir = resolve(GAMES_DIR, game)
      if (!statSync(dir).isDirectory()) continue
      for (const file of readdirSync(dir)
        .filter((f) => f.endsWith('.reading.json'))
        .sort())
        add(game, file)
    }
  }

  let done = 0
  let games = 0
  const started = Date.now()
  for (const [i, game] of [...byGame.keys()].sort().entries()) {
    if (i % shardCount !== shardIndex) continue
    if (done >= limit) break
    const dir = resolve(GAMES_DIR, game)
    const raws: { file: string; raw: RawCapture | null }[] = []
    for (const file of byGame.get(game)!) {
      let raw: RawCapture | null = null
      try {
        raw = await classifyCapture(dir, file)
      } catch (error) {
        console.error(`${game}/${file}: ${(error as Error).message}`)
      }
      raws.push({ file, raw })
    }
    const seatInfo = seatsForGame(
      game,
      registry,
      raws.flatMap(({ raw }) => (raw ? [raw] : []))
    )
    const outDir = resolve(OUT_DIR, game)
    mkdirSync(outDir, { recursive: true })
    for (const { file, raw } of raws) {
      const capture = file.replace(/\.reading\.json$/, '')
      const out = resolve(outDir, `${capture}.b.json`)
      if (raw === null) {
        writeFileSync(
          out,
          JSON.stringify({ version: VERSION, game, capture, skipped: 'reading-not-ok-or-png-missing' }) + '\n'
        )
      } else {
        const result = applySeats(raw, seatInfo)
        writeFileSync(out, JSON.stringify({ version: VERSION, game, capture, ...result }, null, debug ? 2 : 0) + '\n')
        if (debug) console.log(JSON.stringify(result, null, 2))
      }
      done++
    }
    games++
    if (games % 25 === 0)
      console.error(
        `shard ${shardIndex}: ${games} games, ${done} captures in ${Math.round((Date.now() - started) / 1000)}s`
      )
  }
  console.error(
    `shard ${shardIndex}: wrote ${done} captures from ${games} games in ${Math.round((Date.now() - started) / 1000)}s`
  )
}

if (!process.env.CLASSIFY_B_LIB) await main()
