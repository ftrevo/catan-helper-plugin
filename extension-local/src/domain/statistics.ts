import { type Board, type HexNumber, type Resource } from './board'
import { AVERAGE_PIPS_PER_RESOURCE, producingPipsOf } from './probability'

export type ResourceStatistics = {
  readonly pipSum: number
  readonly tileCount: number
  readonly numbers: ReadonlySet<HexNumber>
}

/** Per-resource production summary. The desert is excluded since it never produces. */
export const resourceStatistics = (board: Board): Map<Resource, ResourceStatistics> => {
  const stats = new Map<Resource, { pipSum: number; tileCount: number; numbers: Set<HexNumber> }>()

  for (const tile of board.tiles) {
    if (tile.resource === 'desert') continue

    const current = stats.get(tile.resource) ?? { pipSum: 0, tileCount: 0, numbers: new Set<HexNumber>() }
    current.pipSum += producingPipsOf(tile.number)
    current.tileCount += 1
    current.numbers.add(tile.number)
    stats.set(tile.resource, current)
  }

  return stats
}

/** Producing pips actually present on the board; 58 on a correctly read standard board. */
export const totalProducingPips = (board: Board): number =>
  board.tiles.reduce((sum, tile) => sum + (tile.resource === 'desert' ? 0 : producingPipsOf(tile.number)), 0)

/**
 * How much rarer than average each resource is on this board. A factor above 1 means the resource
 * has fewer pips than an average resource, so each of its pips is worth more.
 */
export const scarcityFactors = (board: Board): Map<Resource, number> => {
  const factors = new Map<Resource, number>()

  for (const [resource, { pipSum }] of resourceStatistics(board)) {
    factors.set(resource, pipSum === 0 ? Infinity : AVERAGE_PIPS_PER_RESOURCE / pipSum)
  }

  return factors
}
