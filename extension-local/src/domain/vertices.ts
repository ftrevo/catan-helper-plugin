import { type Board, type Resource, type TilePosition, assertTilePosition } from './board'
import { producingPipsOf } from './probability'

/** The six vertex ids (0..53) around each tile, in the same order as the UI renders them. */
export const TILE_VERTICES = [
  [0, 3, 4, 7, 8, 12],
  [1, 4, 5, 8, 9, 13],
  [2, 5, 6, 9, 10, 14],
  [7, 11, 12, 16, 17, 22],
  [8, 12, 13, 17, 18, 23],
  [9, 13, 14, 18, 19, 24],
  [10, 14, 15, 19, 20, 25],
  [16, 21, 22, 27, 28, 33],
  [17, 22, 23, 28, 29, 34],
  [18, 23, 24, 29, 30, 35],
  [19, 24, 25, 30, 31, 36],
  [20, 25, 26, 31, 32, 37],
  [28, 33, 34, 38, 39, 43],
  [29, 34, 35, 39, 40, 44],
  [30, 35, 36, 40, 41, 45],
  [31, 36, 37, 41, 42, 46],
  [39, 43, 44, 47, 48, 51],
  [40, 44, 45, 48, 49, 52],
  [41, 45, 46, 49, 50, 53],
] as const satisfies readonly (readonly number[])[]

/**
 * Tiles touching each vertex, indexed by vertex id. Vertex 8, for instance, sits between tiles 0, 1 and 4.
 * Derived from TILE_VERTICES so the two tables can never disagree.
 */
export const VERTEX_TILES: readonly (readonly TilePosition[])[] = (() => {
  const table: TilePosition[][] = Array.from({ length: 54 }, () => [])
  TILE_VERTICES.forEach((vertices, position) => {
    assertTilePosition(position)
    for (const vertex of vertices) table[vertex]?.push(position)
  })
  return table
})()

/**
 * Production value of every vertex (0..53): the sum of producing pips of each tile touching it,
 * optionally weighted by resource scarcity.
 */
export const vertexValues = (board: Board, scarcity?: ReadonlyMap<Resource, number>): number[] =>
  VERTEX_TILES.map((tiles) =>
    tiles.reduce<number>((sum, position) => {
      const tile = board.tiles[position]
      if (!tile) return sum

      const weight = scarcity?.get(tile.resource) ?? 1
      return sum + producingPipsOf(tile.number) * weight
    }, 0)
  )

/** The six vertex values around one tile, in `TILE_VERTICES` order. */
export const tileVertexValues = (
  board: Board,
  position: TilePosition,
  scarcity?: ReadonlyMap<Resource, number>
): number[] => {
  const all = vertexValues(board, scarcity)
  return TILE_VERTICES[position].map((vertex) => all[vertex] ?? 0)
}
