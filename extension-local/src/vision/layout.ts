import { ROW_HEIGHT_FACTOR, TILE_OFFSETS } from '../domain/board'
import { EDGES } from '../domain/edges'
import { TILE_VERTICES, VERTEX_TILES } from '../domain/vertices'
import { type Point, type Rect, type Size } from './pixels'

export { ROW_HEIGHT_FACTOR, TILE_OFFSETS }

/**
 * Geometry of the board inside a screenshot: where the centre tile (position 9) sits and how far apart
 * neighbouring tile centres are, in pixels. Everything else about the layout follows from these two values
 * because colonist.io draws a regular hexagonal grid and scales the whole board uniformly.
 */
export type BoardGeometry = {
  readonly center: Point
  readonly spacing: number
}

/**
 * Spacing of the board the models were trained on. Crop offsets and sizes below were measured on that board
 * and are scaled by `spacing / REFERENCE_SPACING` for any other capture.
 */
export const REFERENCE_SPACING = 216

export type CropSpec = {
  /** Centre of the crop relative to the tile centre, in fractions of the spacing. */
  readonly offset: Point
  /** Size the crop had at the reference spacing, which is also the model input size. */
  readonly size: Size
}

/** The resource artwork sits above the number token. */
export const RESOURCE_CROP: CropSpec = {
  offset: { x: 5 / REFERENCE_SPACING, y: -89 / REFERENCE_SPACING },
  size: { width: 80, height: 64 },
}

/** The number token, centred on the tile. */
export const NUMBER_CROP: CropSpec = {
  offset: { x: 2 / REFERENCE_SPACING, y: 1 / REFERENCE_SPACING },
  size: { width: 64, height: 70 },
}

export const tileCenters = ({ center, spacing }: BoardGeometry): Point[] =>
  TILE_OFFSETS.map((offset) => ({ x: center.x + offset.x * spacing, y: center.y + offset.y * spacing }))

/** Rectangle to sample for `spec` around a tile centre, scaled to the board's actual spacing. */
export const cropRect = (tileCenter: Point, spec: CropSpec, spacing: number): Rect => {
  const scale = spacing / REFERENCE_SPACING
  const width = spec.size.width * scale
  const height = spec.size.height * scale

  return {
    x: tileCenter.x + spec.offset.x * spacing - width / 2,
    y: tileCenter.y + spec.offset.y * spacing - height / 2,
    width,
    height,
  }
}

/**
 * Pieces sit on the corners of the hex faces, which colonist.io draws this fraction of a spacing above
 * the number tokens (measured on a large render; see training/README.md).
 */
export const FACE_OFFSET_Y = -0.18

/** Directions of a tile's six corners in `TILE_VERTICES` order: top, upper-left, upper-right, lower-left, lower-right, bottom. */
export const CORNER_ANGLES = [-90, -150, -30, 150, 30, 90].map((deg) => (deg * Math.PI) / 180)

/** Square patch around a piece: side as a fraction of the spacing, resampled to `size` pixels for the model. */
export type PatchSpec = {
  readonly region: number
  readonly size: number
}

export const BUILDING_PATCH: PatchSpec = { region: 0.42, size: 40 }
export const ROAD_PATCH: PatchSpec = { region: 0.5, size: 40 }

/** Screen position of every vertex (face corner), derived from the first tile that touches it. */
export const vertexCenters = ({ center, spacing }: BoardGeometry): Point[] => {
  const radius = spacing / Math.sqrt(3)
  return VERTEX_TILES.map((tiles, vertex) => {
    const tile = tiles[0]
    if (tile === undefined) return center
    const corner = TILE_VERTICES[tile].indexOf(vertex as never)
    const offset = TILE_OFFSETS[tile] ?? { x: 0, y: 0 }
    const angle = CORNER_ANGLES[corner] ?? 0
    return {
      x: center.x + offset.x * spacing + Math.cos(angle) * radius,
      y: center.y + (offset.y + FACE_OFFSET_Y) * spacing + Math.sin(angle) * radius,
    }
  })
}

/** Screen position of every edge midpoint. */
export const edgeCenters = (geometry: BoardGeometry): Point[] => {
  const vertices = vertexCenters(geometry)
  return EDGES.map(([a, b]) => {
    const p = vertices[a] ?? geometry.center
    const q = vertices[b] ?? geometry.center
    return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
  })
}

export const patchRect = (center: Point, spec: PatchSpec, spacing: number): Rect => {
  const side = spec.region * spacing
  return { x: center.x - side / 2, y: center.y - side / 2, width: side, height: side }
}
