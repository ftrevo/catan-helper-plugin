/**
 * Core Catan board model. Pure data and guards, no browser or ML dependencies.
 *
 * Tiles are numbered 0..18 reading the board row by row (3, 4, 5, 4, 3 tiles), left to right.
 */

export const RESOURCES = ['brick', 'desert', 'grain', 'lumber', 'stone', 'wool'] as const
export type Resource = (typeof RESOURCES)[number]

export const PRODUCING_RESOURCES = RESOURCES.filter((r) => r !== 'desert') as Exclude<Resource, 'desert'>[]

/** "7" is what the desert tile carries: it never produces. */
export const HEX_NUMBERS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const
export type HexNumber = (typeof HEX_NUMBERS)[number]

export const TILES_PER_ROW = [3, 4, 5, 4, 3] as const
export const TILE_COUNT = 19

export type TilePosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18

export type Tile = {
  readonly position: TilePosition
  readonly resource: Resource
  readonly number: HexNumber
}

export type Board = {
  readonly tiles: readonly Tile[]
}

export const isResource = (value: string): value is Resource => (RESOURCES as readonly string[]).includes(value)

export const isHexNumber = (value: string): value is HexNumber => (HEX_NUMBERS as readonly string[]).includes(value)

export const isTilePosition = (value: number): value is TilePosition =>
  Number.isInteger(value) && value >= 0 && value < TILE_COUNT

export function assertTilePosition(value: number): asserts value is TilePosition {
  if (!isTilePosition(value)) throw new Error(`Invalid tile position ${value}`)
}

/**
 * Builds a Board from parallel lists of labels, validating every value.
 * Throws when the input cannot describe a standard 19-tile board.
 */
export const createBoard = (resources: readonly string[], numbers: readonly string[]): Board => {
  if (resources.length !== TILE_COUNT || numbers.length !== TILE_COUNT) {
    throw new Error(
      `A board needs ${TILE_COUNT} tiles, got ${resources.length} resources and ${numbers.length} numbers`
    )
  }

  const tiles = resources.map((resource, index) => {
    const number = numbers[index] ?? ''
    assertTilePosition(index)
    if (!isResource(resource)) throw new Error(`Invalid resource "${resource}" at tile ${index}`)
    if (!isHexNumber(number)) throw new Error(`Invalid number "${number}" at tile ${index}`)

    return { position: index, resource, number } satisfies Tile
  })

  return { tiles }
}

/**
 * Human-readable hints that a reading is probably wrong. A standard board has exactly one desert,
 * and only the desert carries the "7".
 */
export const boardWarnings = (board: Board): string[] => {
  const warnings: string[] = []
  const deserts = board.tiles.filter((t) => t.resource === 'desert')

  if (deserts.length !== 1) warnings.push(`Expected one desert, found ${deserts.length}.`)

  const mismatched = board.tiles.filter((t) => (t.resource === 'desert') !== (t.number === '7'))
  if (mismatched.length > 0) {
    warnings.push(
      `Tile${mismatched.length > 1 ? 's' : ''} ${mismatched.map((t) => t.position + 1).join(', ')} mix desert and number readings.`
    )
  }

  return warnings
}
