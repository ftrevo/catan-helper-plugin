import { TILES_PER_ROW, TILE_COUNT } from '../domain/board'
import { type Point, type Rect, type Size } from './pixels'

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

/** Vertical distance between rows of a pointy-top hex grid, as a fraction of the spacing. */
export const ROW_HEIGHT_FACTOR = Math.sqrt(3) / 2

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

/**
 * Offsets of the 19 tile centres from the centre tile, in units of spacing and in position order
 * (row by row, left to right). Rows are `TILES_PER_ROW` wide and centred on the middle column.
 */
export const TILE_OFFSETS: readonly Point[] = TILES_PER_ROW.flatMap((count, row) =>
  Array.from({ length: count }, (_, column) => ({
    x: column - (count - 1) / 2,
    y: (row - (TILES_PER_ROW.length - 1) / 2) * ROW_HEIGHT_FACTOR,
  }))
)

if (TILE_OFFSETS.length !== TILE_COUNT) throw new Error(`Expected ${TILE_COUNT} tile offsets`)

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
