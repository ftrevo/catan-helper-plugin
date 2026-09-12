import { type Board, type Resource } from './board'
import { EDGES, VERTEX_EDGES } from './edges'
import { type Pieces, type PlayerColour } from './pieces'
import { producingPipsOf } from './probability'
import { VERTEX_TILES } from './vertices'

export type PlayerStatistics = {
  readonly colour: PlayerColour
  readonly settlements: number
  readonly cities: number
  readonly roads: number
  /** Expected resource cards per 36 rolls, per resource: settlements count once, cities twice. */
  readonly production: ReadonlyMap<Resource, number>
  readonly totalProduction: number
  readonly longestRoad: number
  /** Points visible on the board: settlements, cities and the longest road bonus. Cards are unknown. */
  readonly visiblePoints: number
}

/** Longest road bonus needs at least this many connected road segments. */
export const LONGEST_ROAD_MINIMUM = 5

/**
 * Longest trail of one colour's roads. A trail may not pass through a vertex holding another player's
 * building. Roads are few enough per player that a depth-first search over edge paths is instant.
 */
export const longestRoad = (pieces: Pieces, colour: PlayerColour): number => {
  const own = new Set(pieces.roads.filter((r) => r.colour === colour).map((r) => r.edge))
  if (own.size === 0) return 0
  const blocked = new Set(pieces.buildings.filter((b) => b.colour !== colour).map((b) => b.vertex))

  const walk = (vertex: number, used: Set<number>): number => {
    let best = 0
    for (const edge of VERTEX_EDGES[vertex] ?? []) {
      if (!own.has(edge) || used.has(edge)) continue
      const [a, b] = EDGES[edge] as readonly [number, number]
      const next = a === vertex ? b : a
      used.add(edge)
      const length = 1 + (blocked.has(next) ? 0 : walk(next, used))
      used.delete(edge)
      if (length > best) best = length
    }
    return best
  }

  let longest = 0
  for (const edge of own) {
    for (const start of EDGES[edge] as readonly [number, number]) {
      longest = Math.max(longest, walk(start, new Set()))
    }
  }
  return longest
}

export const playerStatistics = (board: Board, pieces: Pieces): PlayerStatistics[] => {
  const colours = new Set<PlayerColour>([
    ...pieces.buildings.map((b) => b.colour),
    ...pieces.roads.map((r) => r.colour),
  ])
  const roadLengths = new Map([...colours].map((c) => [c, longestRoad(pieces, c)]))
  const longest = Math.max(0, ...roadLengths.values())
  const holders = [...roadLengths].filter(([, l]) => l === longest && l >= LONGEST_ROAD_MINIMUM)

  return [...colours]
    .map((colour) => {
      const buildings = pieces.buildings.filter((b) => b.colour === colour)
      const production = new Map<Resource, number>()
      for (const building of buildings) {
        const weight = building.kind === 'city' ? 2 : 1
        for (const position of VERTEX_TILES[building.vertex] ?? []) {
          const tile = board.tiles[position]
          if (!tile || tile.resource === 'desert') continue
          production.set(tile.resource, (production.get(tile.resource) ?? 0) + producingPipsOf(tile.number) * weight)
        }
      }
      const settlements = buildings.filter((b) => b.kind === 'settlement').length
      const cities = buildings.filter((b) => b.kind === 'city').length
      const road = roadLengths.get(colour) ?? 0
      const hasLongest = holders.length === 1 && holders[0]?.[0] === colour
      return {
        colour,
        settlements,
        cities,
        roads: pieces.roads.filter((r) => r.colour === colour).length,
        production,
        totalProduction: [...production.values()].reduce((s, p) => s + p, 0),
        longestRoad: road,
        visiblePoints: settlements + 2 * cities + (hasLongest ? 2 : 0),
      }
    })
    .sort((a, b) => b.visiblePoints - a.visiblePoints || b.totalProduction - a.totalProduction)
}
