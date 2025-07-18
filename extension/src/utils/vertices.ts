import { getPipForStatistics } from './calculations'
import { type Hexagons, assertValidHexPosition, hexagonVertices } from './hexagons'
import { getScarcityFactors } from './statistics'

const vertexNeighboardTiles = [
  [0], // V 0 (PRIMEIRO VÉRTICE DA PRIMEIRA LINHA)
  [1],
  [2],
  [0], // V 3 (PRIMEIRO VÉRTICE DA SEGUNDA LINHA)
  [0, 1],
  [1, 2],
  [2],
  [0, 3], // V 7 (PRIMEIRO VÉRTICE DA TERCEIRA LINHA)
  [0, 1, 4],
  [1, 2, 5],
  [2, 6],
  [3], // V 11 (PRIMEIRO VÉRTICE DA QUARTA LINHA)
  [0, 3, 4],
  [1, 4, 5],
  [2, 5, 6],
  [6],
  [3, 7], // V 16 (PRIMEIRO VÉRTICE DA QUITA LINHA)
  [3, 4, 8],
  [4, 5, 9],
  [5, 6, 10],
  [6, 11],
  [7], // V 21 (PRIMEIRO VÉRTICE DA SEXTA LINHA)
  [3, 7, 8],
  [4, 8, 9],
  [5, 9, 10],
  [6, 10, 11],
  [11],
  [7], // V 27 (PRIMEIRO VÉRTICE DA SÉTIMA LINHA)
  [7, 8, 12],
  [8, 9, 13],
  [9, 10, 14],
  [10, 11, 15],
  [11],
  [7, 12], // V 33 (PRIMEIRO VÉRTICE DA OITAVA LINHA)
  [8, 12, 13],
  [9, 13, 14],
  [10, 14, 15],
  [11, 15],
  [12], // V 38 (PRIMEIRO VÉRTICE DA NONA LINHA)
  [12, 13, 16],
  [13, 14, 17],
  [14, 15, 18],
  [15],
  [12, 16], // V 43 (PRIMEIRO VÉRTICE DA DÉCIMA LINHA)
  [13, 16, 17],
  [14, 17, 18],
  [15, 18],
  [16], // V 47 (PRIMEIRO VÉRTICE DA DÉCIMA PRIMEIRA LINHA)
  [16, 17],
  [17, 18],
  [18],
  [16], // V 51 (PRIMEIRO VÉRTICE DA DÉCIMA SEGUNDA LINHA)
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
