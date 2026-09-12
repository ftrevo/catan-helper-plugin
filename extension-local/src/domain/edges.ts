import { TILE_VERTICES } from './vertices'

/**
 * Corners of a tile in polygon order (clockwise from the top). `TILE_VERTICES` lists them as
 * top, upper-left, upper-right, lower-left, lower-right, bottom; walking the hexagon is 0 → 2 → 4 → 5 → 3 → 1.
 */
export const CORNER_WALK = [0, 2, 4, 5, 3, 1] as const

export type Edge = readonly [number, number]

/** The 72 edges of the board as ordered vertex pairs (smaller id first), deduplicated across tiles. */
export const EDGES: readonly Edge[] = (() => {
  const seen = new Map<string, Edge>()
  for (const corners of TILE_VERTICES) {
    for (let i = 0; i < CORNER_WALK.length; i++) {
      const a = corners[CORNER_WALK[i] as number] as number
      const b = corners[CORNER_WALK[(i + 1) % CORNER_WALK.length] as number] as number
      const edge: Edge = a < b ? [a, b] : [b, a]
      seen.set(`${edge[0]}-${edge[1]}`, edge)
    }
  }
  return [...seen.values()].sort((x, y) => x[0] - y[0] || x[1] - y[1])
})()

export const EDGE_COUNT = EDGES.length

/** Edge ids touching each vertex. */
export const VERTEX_EDGES: readonly (readonly number[])[] = (() => {
  const table: number[][] = Array.from({ length: 54 }, () => [])
  EDGES.forEach(([a, b], id) => {
    table[a]?.push(id)
    table[b]?.push(id)
  })
  return table
})()

/** Edge ids around each tile, in polygon order. */
export const TILE_EDGES: readonly (readonly number[])[] = TILE_VERTICES.map((corners) =>
  CORNER_WALK.map((c, i) => {
    const a = corners[c] as number
    const b = corners[CORNER_WALK[(i + 1) % CORNER_WALK.length] as number] as number
    return EDGES.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a))
  })
)

export const edgeIdOf = (a: number, b: number): number =>
  EDGES.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a))
