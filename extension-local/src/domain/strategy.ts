import { type Board, type Resource } from './board'
import { producingPipsOf } from './probability'
import { scarcityFactors, totalProducingPips } from './statistics'

type ProducingResource = Exclude<Resource, 'desert'>
type Cost = Partial<Record<ProducingResource, number>>

/** Building costs from the rules. */
export const BUILD_COSTS = {
  road: { brick: 1, lumber: 1 },
  settlement: { brick: 1, lumber: 1, wool: 1, grain: 1 },
  city: { grain: 2, stone: 3 },
  developmentCard: { stone: 1, grain: 1, wool: 1 },
} as const satisfies Record<string, Cost>

/**
 * What a player typically builds on the way to 10 points, beyond the two free starting settlements:
 * three more settlements, upgrading four of them to cities, four development cards and the roads to
 * reach the sites. Change these numbers to model a different play style.
 */
export const TYPICAL_GAME: Record<keyof typeof BUILD_COSTS, number> = {
  road: 8,
  settlement: 3,
  city: 4,
  developmentCard: 4,
}

const PRODUCING: readonly ProducingResource[] = ['brick', 'grain', 'lumber', 'stone', 'wool']

/** Cards of each resource the typical game consumes. */
export const resourceDemand = (
  game: Record<keyof typeof BUILD_COSTS, number> = TYPICAL_GAME
): Map<ProducingResource, number> => {
  const demand = new Map<ProducingResource, number>(PRODUCING.map((r) => [r, 0]))
  for (const [building, count] of Object.entries(game) as [keyof typeof BUILD_COSTS, number][]) {
    for (const [resource, cards] of Object.entries(BUILD_COSTS[building]) as [ProducingResource, number][]) {
      demand.set(resource, (demand.get(resource) ?? 0) + cards * count)
    }
  }
  return demand
}

/** Demand relative to the average resource, so weights average 1 and ore and grain land above it. */
export const strategicWeights = (
  game: Record<keyof typeof BUILD_COSTS, number> = TYPICAL_GAME
): Map<Resource, number> => {
  const demand = resourceDemand(game)
  const mean = [...demand.values()].reduce((sum, d) => sum + d, 0) / demand.size
  return new Map([...demand].map(([resource, d]) => [resource, d / mean]))
}

/**
 * Rarity and demand combined: a pip is worth more when its resource is scarce on this board and when the
 * game needs a lot of it. Factors are rescaled so the board's weighted total equals its pip total, which
 * keeps vertex values comparable with the other modes. Ports are not taken into account.
 */
export const strategyFactors = (
  board: Board,
  game: Record<keyof typeof BUILD_COSTS, number> = TYPICAL_GAME
): Map<Resource, number> => {
  const scarcity = scarcityFactors(board)
  const weights = strategicWeights(game)
  const raw = new Map<Resource, number>()
  for (const [resource, factor] of scarcity) raw.set(resource, factor * (weights.get(resource) ?? 1))

  const weightedTotal = board.tiles.reduce((sum, t) => sum + producingPipsOf(t.number) * (raw.get(t.resource) ?? 0), 0)
  const scale = weightedTotal === 0 ? 1 : totalProducingPips(board) / weightedTotal
  return new Map([...raw].map(([resource, factor]) => [resource, factor * scale]))
}
