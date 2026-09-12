/**
 * Renders synthetic colonist.io boards from the game's own sprites. The output mimics what a
 * screenshot contains around each tile: neighbouring tiles, sea, number tokens and, randomly,
 * the pieces and highlights that appear during a game.
 */
import { type Image, type SKRSContext2D, createCanvas, loadImage } from '@napi-rs/canvas'
import {
  HEX_NUMBERS,
  type HexNumber,
  RESOURCES,
  type Resource,
  TILE_COUNT,
} from '../../extension-local/src/domain/board.ts'
import { EDGES } from '../../extension-local/src/domain/edges.ts'
import { PLAYER_COLOURS, type Pieces } from '../../extension-local/src/domain/pieces.ts'
import { ROW_HEIGHT_FACTOR, TILE_OFFSETS, edgeCenters, vertexCenters } from '../../extension-local/src/vision/layout.ts'
import { type Point, type RgbaImage } from '../../extension-local/src/vision/pixels.ts'
import { type Atlas, drawSprite } from './atlas.ts'
import { RENDERED_DIR } from './paths.ts'
import { FACE_OFFSET_Y, TILE_SPRITE_SIZE } from './tile-geometry.ts'
import { type Random } from './random.ts'

/** Width of a tile sprite in source pixels; equals the flat-to-flat hex width, i.e. one spacing. */
const TILE_SOURCE_WIDTH = 416

/** Colours measured on real captures. */
const SEA = 'rgb(7, 103, 166)'
const SHALLOWS = 'rgb(131, 206, 239)'
const SAND = 'rgb(236, 218, 170)'

/** UI-layer sprites are not drawn at tile scale by the game; these are their sizes in spacings. */
const HIGHLIGHT_DIAMETER = 0.3
const ROBBER_HEIGHT = 0.45
/** Cities & Knights knight badges, measured on a spectated game: about a third of a spacing across. */
const KNIGHT_DIAMETER = 0.35

/**
 * Mix of vertex pieces in a mid-game board; knights only exist in Cities & Knights. Metropolises are not
 * rendered yet: the game's exact drawing is unknown and a guessed tower made real settlements look like
 * metropolises to the model. The class stays in the labels so it can be trained once a reference exists.
 */
const VERTEX_PIECE_KINDS = [
  ['settlement', 0.55],
  ['city', 0.3],
  ['metropolis', 0],
  ['knight', 0.15],
] as const

/**
 * Full tile renders (background, border and artwork) cut from a large capture of the game with
 * `extract-tiles.ts`. The atlas only ships flat `tile_*_empty` hexes; the artwork is drawn by the game.
 * Each sprite is a square whose hexagon spans `TILE_SPRITE_HEX_WIDTH` of its width.
 */
export type TileSprites = Record<Resource, Image> & { desertClean: Image }

export const loadTileSprites = async (dir = RENDERED_DIR): Promise<TileSprites> => {
  const load = (name: string) => loadImage(`${dir}/${name}.png`)
  const [brick, desert, grain, lumber, stone, wool, desertClean] = await Promise.all(
    ['tile_brick', 'tile_desert', 'tile_grain', 'tile_lumber', 'tile_stone', 'tile_wool', 'tile_desert_clean'].map(load)
  )
  return { brick, desert, grain, lumber, stone, wool, desertClean } as TileSprites
}

/** Draws a tile sprite for the token centred at `c`; the sprite itself is centred on the face. */
const drawTile = (ctx: SKRSContext2D, image: Image, c: Point, spacing: number): void => {
  const size = spacing * TILE_SPRITE_SIZE
  ctx.drawImage(image, c.x - size / 2, c.y + FACE_OFFSET_Y * spacing - size / 2, size, size)
}

const PIECE_COLOURS = [
  'red',
  'blue',
  'orange',
  'green',
  'white',
  'black',
  'pink',
  'purple',
  'bronze',
  'silver',
  'gold',
  'mysticblue',
]

/** Vertex directions of a pointy-top hex, radians from the x axis (used to fill hexagons). */
const VERTEX_ANGLES = [30, 90, 150, 210, 270, 330].map((deg) => (deg * Math.PI) / 180)

export type SyntheticTile = { readonly resource: Resource; readonly number: HexNumber }

export type SyntheticBoard = {
  readonly image: RgbaImage
  readonly center: Point
  readonly spacing: number
  readonly tiles: readonly SyntheticTile[]
  /** Buildings and roads that were drawn, by vertex and edge id. */
  readonly pieces: Pieces
}

export type RenderOptions = {
  spacing: number
  /** Probability that any given vertex gets a settlement or city. */
  pieceDensity?: number
  /** Probability that any given edge gets a road. */
  roadDensity?: number
  /** Colours in play; pieces are drawn from these. Defaults to a random 2-6 of the twelve. */
  colours?: readonly (typeof PLAYER_COLOURS)[number][]
  /** Probability that vertex highlight rings (placement phase) are drawn. */
  highlightProbability?: number
  /** Probability that the robber stands on the desert instead of a random tile. */
  robberOnDesert?: number
}

const NUMBERS_WITH_TOKEN = HEX_NUMBERS.filter((n) => n !== '7')

/** A standard board: one desert without a token, every other tile with a random token. */
export const randomTiles = (random: Random): SyntheticTile[] => {
  const desert = random.int(TILE_COUNT)
  return Array.from({ length: TILE_COUNT }, (_, i) =>
    i === desert
      ? { resource: 'desert', number: '7' }
      : { resource: random.pick(RESOURCES.filter((r) => r !== 'desert')), number: random.pick(NUMBERS_WITH_TOKEN) }
  )
}

export const renderBoard = (
  atlas: Atlas,
  tileSprites: TileSprites,
  random: Random,
  options: RenderOptions
): SyntheticBoard => {
  const { spacing } = options
  const pieceDensity = options.pieceDensity ?? 0.12
  const roadDensity = options.roadDensity ?? 0.1
  const highlightProbability = options.highlightProbability ?? 0.15
  const robberOnDesert = options.robberOnDesert ?? 0.6

  const scale = spacing / TILE_SOURCE_WIDTH
  // Enough room for the board, one ring of sea and the crops that peek above the top row.
  const width = Math.ceil(spacing * 7)
  const height = Math.ceil(spacing * ROW_HEIGHT_FACTOR * 7)
  const center = { x: width / 2 + random.range(-0.3, 0.3) * spacing, y: height / 2 + random.range(-0.3, 0.3) * spacing }
  const tiles = randomTiles(random)

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const centers = TILE_OFFSETS.map((o) => ({ x: center.x + o.x * spacing, y: center.y + o.y * spacing }))

  // Sea, then an island: shallow water rim and sand under the tiles, as the coast looks in captures.
  ctx.fillStyle = SEA
  ctx.fillRect(0, 0, width, height)
  const faceCenters = centers.map((c) => ({ x: c.x, y: c.y + FACE_OFFSET_Y * spacing }))
  ctx.fillStyle = SHALLOWS
  for (const c of faceCenters) fillHex(ctx, c, spacing * 1.32)
  ctx.fillStyle = SAND
  for (const c of faceCenters) fillHex(ctx, c, spacing * 1.18)

  // Robber: on the desert most of the time (drawn into that sprite), otherwise blocking a random tile.
  const desertIndex = tiles.findIndex((t) => t.resource === 'desert')
  const robberTile = random.chance(robberOnDesert) ? desertIndex : random.int(TILE_COUNT)

  tiles.forEach((tile, i) => {
    const c = centers[i] as Point
    const image = tile.resource === 'desert' && robberTile !== i ? tileSprites.desertClean : tileSprites[tile.resource]
    drawTile(ctx, image, c, spacing)
  })
  tiles.forEach((tile, i) => {
    if (tile.number === '7') return
    const c = centers[i] as Point
    const token = atlas.get(`prob_${tile.number}`)
    // The game drops a soft shadow under each token.
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.filter = 'brightness(0)'
    drawSprite(ctx, token, c.x + 0.012 * spacing, c.y + 0.022 * spacing, scale)
    ctx.restore()
    drawSprite(ctx, token, c.x, c.y, scale)
  })

  if (robberTile !== desertIndex) {
    const robberCenter = centers[robberTile] as Point
    const robber = atlas.get('icon_robber')
    drawSprite(
      ctx,
      robber,
      robberCenter.x - 0.2 * spacing,
      robberCenter.y - 0.05 * spacing,
      (ROBBER_HEIGHT * spacing) / robber.sourceSize.h
    )
  }

  // Pieces on the shared vertices and edges of the board, using the extension's geometry so training
  // patches line up exactly with what the popup crops. Roads first, buildings last, like the game.
  const geometry = { center, spacing }
  const vertices = vertexCenters(geometry)
  const edges = edgeCenters(geometry)
  const colours = options.colours ?? shuffle(random, PLAYER_COLOURS).slice(0, random.pick([2, 3, 4, 4, 4, 5, 6]))
  const buildings: Pieces['buildings'][number][] = []
  const roads: Pieces['roads'][number][] = []

  EDGES.forEach(([a, b], edge) => {
    if (colours.length === 0 || !random.chance(roadDensity)) return
    const colour = random.pick(colours)
    const p = vertices[a] as Point
    const q = vertices[b] as Point
    const m = edges[edge] as Point
    const angle = Math.atan2(q.y - p.y, q.x - p.x)
    drawSprite(ctx, atlas.get(`road_${colour}`), m.x, m.y, scale, angle + Math.PI / 2)
    roads.push({ edge, colour })
  })

  const drawHighlights = random.chance(highlightProbability)
  vertices.forEach((v, vertex) => {
    if (drawHighlights && random.chance(0.7)) {
      const ring = atlas.get('icon_highlight_circle')
      drawSprite(ctx, ring, v.x, v.y, (HIGHLIGHT_DIAMETER * spacing) / ring.sourceSize.w)
    }
    if (colours.length === 0 || !random.chance(pieceDensity)) return
    const colour = random.pick(colours)
    const kind = pickKind(random)
    if (kind === 'knight') {
      const level = random.pick([1, 2, 3])
      const state = random.chance(0.6) ? 'active' : 'inactive'
      const knight = atlas.get(`knight_level${level}_${state}_${colour}`)
      drawSprite(ctx, knight, v.x, v.y, (KNIGHT_DIAMETER * spacing) / knight.sourceSize.w)
    } else {
      // Cities may carry a wall (drawn underneath); a metropolis is a city with a tower on top.
      if (kind !== 'settlement' && random.chance(0.35) && atlas.has(`city_wall_${colour}`)) {
        drawSprite(ctx, atlas.get(`city_wall_${colour}`), v.x, v.y + 0.04 * spacing, scale)
      }
      drawSprite(ctx, atlas.get(`${kind === 'metropolis' ? 'city' : kind}_${colour}`), v.x, v.y, scale)
      if (kind === 'metropolis') {
        drawSprite(
          ctx,
          atlas.get(`metropolis_${random.pick(['politics', 'science', 'trade'])}`),
          v.x,
          v.y - 0.06 * spacing,
          scale
        )
      }
    }
    buildings.push({ vertex, kind, colour })
  })

  const { data } = ctx.getImageData(0, 0, width, height)
  return { image: { width, height, data }, center, spacing, tiles, pieces: { buildings, roads } }
}

/** Fills a pointy-top hexagon of the given flat-to-flat width centred on `c`. */
const fillHex = (ctx: SKRSContext2D, c: Point, width: number): void => {
  const radius = width / Math.sqrt(3)
  ctx.beginPath()
  VERTEX_ANGLES.forEach((angle, i) => {
    const x = c.x + Math.cos(angle) * radius
    const y = c.y + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fill()
}

const pickKind = (random: Random): (typeof VERTEX_PIECE_KINDS)[number][0] => {
  let roll = random.next()
  for (const [kind, weight] of VERTEX_PIECE_KINDS) {
    roll -= weight
    if (roll <= 0) return kind
  }
  return 'settlement'
}

const shuffle = <T>(random: Random, items: readonly T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = random.int(i + 1)
    ;[copy[i], copy[j]] = [copy[j] as T, copy[i] as T]
  }
  return copy
}
