import { getPipForStatistics } from './calculations'
import { type Hexagons, assertValidHexPosition, hexagonVertices } from './hexagons'
import { getScarcityFactors } from './statistics'

/**
 * Maps vertex indices to their neighboring hexagon tiles.
 * Each array represents a vertex and contains indices of hexagons that touch this vertex.
 * For example: vertexNeighborTiles[8] = [0, 1, 4] means vertex 8 is connected to hexagons 0, 1, and 4.
 */
const vertexNeighboardTiles = [
  [0], // V 0 (FIRST VERTEX OF THE FIRST ROW)
  [1],
  [2],
  [0], // V 3 (FIRST VERTEX OF THE SECOND ROW)
  [0, 1],
  [1, 2],
  [2],
  [0, 3], // V 7 (FIRST VERTEX OF THE THIRD ROW)
  [0, 1, 4],
  [1, 2, 5],
  [2, 6],
  [3], // V 11 (FIRST VERTEX OF THE FOURTH ROW)
  [0, 3, 4],
  [1, 4, 5],
  [2, 5, 6],
  [6],
  [3, 7], // V 16 (FIRST VERTEX OF THE FIFTH ROW)
  [3, 4, 8],
  [4, 5, 9],
  [5, 6, 10],
  [6, 11],
  [7], // V 21 (FIRST VERTEX OF THE SIXTH ROW)
  [3, 7, 8],
  [4, 8, 9],
  [5, 9, 10],
  [6, 10, 11],
  [11],
  [7], // V 27 (FIRST VERTEX OF THE SEVENTH ROW)
  [7, 8, 12],
  [8, 9, 13],
  [9, 10, 14],
  [10, 11, 15],
  [11],
  [7, 12], // V 33 (FIRST VERTEX OF THE EIGHTH ROW)
  [8, 12, 13],
  [9, 13, 14],
  [10, 14, 15],
  [11, 15],
  [12], // V 38 (FIRST VERTEX OF THE NINTH ROW)
  [12, 13, 16],
  [13, 14, 17],
  [14, 15, 18],
  [15],
  [12, 16], // V 43 (FIRST VERTEX OF THE TENTH ROW)
  [13, 16, 17],
  [14, 17, 18],
  [15, 18],
  [16], // V 47 (FIRST VERTEX OF THE ELEVENTH ROW)
  [16, 17],
  [17, 18],
  [18],
  [16], // V 51 (FIRST VERTEX OF THE TWELFTH ROW)
  [17],
  [18],
]

export const getVerticesValues = (
  position: number,
  allHexagons: Hexagons,
  scarcityFactors?: ReturnType<typeof getScarcityFactors>
) => {
  assertValidHexPosition(position)

  const vertices = hexagonVertices[position]

  const values = vertices.map((vertex) => {
    const tiles = vertexNeighboardTiles[vertex]

    return tiles.reduce((acc: number, hexNumber: number) => {
      const hexagon = allHexagons[hexNumber]

      if (hexagon) {
        const pipValue = getPipForStatistics(hexagon.num)
        if (scarcityFactors) {
          const resourceScarcity = scarcityFactors.get(hexagon.resource)

          return acc + pipValue * (resourceScarcity ?? 1)
        }
        return acc + pipValue
      }

      return acc
    }, 0)
  })

  return values
}
