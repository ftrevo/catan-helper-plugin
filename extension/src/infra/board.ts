type HexResource = 'brick' | 'desert' | 'grain' | 'lumber' | 'stone' | 'wool'
const isHexResource = (resource: string): resource is HexResource => {
  return ['brick', 'desert', 'grain', 'lumber', 'stone', 'wool'].includes(resource)
}

type HexNumber = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'
const isHexNumber = (num: string): num is HexNumber => {
  return ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].includes(num)
}

type HexPosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18
const isHexPosition = (position: number): position is HexPosition => {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].includes(position)
}

export class Hexagon {
  position: HexPosition
  resource: HexResource
  num: HexNumber
  vertices: Array<number> = []

  constructor(position: number, resource: string, num: string) {
    if (!isHexPosition(position)) {
      throw new Error('Invalid position ' + position)
    }

    if (!isHexNumber(num)) {
      throw new Error('Invalid number ' + num)
    }

    if (!isHexResource(resource)) {
      throw new Error('Invalid resource ' + resource)
    }

    this.resource = resource as HexResource
    this.num = num as HexNumber
    this.position = position as HexPosition
  }

  setVertices = (vertices: Array<number>) => {
    if (vertices.length !== 6) {
      throw new Error('Invalid vertices length ' + vertices.length)
    }

    this.vertices = vertices
  }

  getValue = () => {
    if (this.num === '6' || this.num === '8') {
      return 5
    }

    if (this.num === '5' || this.num === '9') {
      return 4
    }

    if (this.num === '4' || this.num === '10') {
      return 3
    }

    if (this.num === '3' || this.num === '11') {
      return 2
    }

    return 0
  }

  getLine = () => {
    if (this.position <= 2) {
      return 1
    }

    if (this.position <= 6) {
      return 2
    }

    if (this.position <= 11) {
      return 3
    }

    if (this.position <= 15) {
      return 4
    }

    return 5
  }

  getColumn = () => {
    if (this.position <= 2) {
      return this.position + 1
    }

    if (this.position <= 6) {
      return this.position - 2
    }

    if (this.position <= 11) {
      return this.position - 6
    }

    if (this.position <= 15) {
      return this.position - 11
    }

    return this.position - 15
  }
}

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

const points = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 0,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
} as const

const vertexPerHexagon = [
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
] as const

const getVerticesValues = (position: number, allHexagons: Array<Hexagon>) => {
  if (!isHexPosition(position)) {
    throw new Error('Invalid position ' + position)
  }

  const vertices = vertexPerHexagon[position]

  const values = vertices.map((vertex) => {
    const tiles = vertexNeighboardTiles[vertex]

    return tiles.reduce((acc: number, hexNumber: number) => {
      const hexagon = allHexagons[hexNumber]

      if (hexagon) {
        return acc + points[hexagon.num]
      }

      return acc
    }, 0)
  })

  return values
}

export class Board {
  hexagons: Hexagon[]

  constructor(resources: Array<string>, numbers: Array<string>) {
    this.hexagons = resources.map((resource, index) => {
      return new Hexagon(index, resource, numbers[index])
    })

    this.hexagons.forEach((hexagon, index) => {
      const vertices = getVerticesValues(index, this.hexagons)
      hexagon.setVertices(vertices)
    })
  }

  getHexagon(position: number) {
    return this.hexagons[position]
  }

  getVertexValue(vertex: number) {
    const tiles = vertexNeighboardTiles[vertex]

    return tiles.reduce((acc, hexNumber) => {
      const hexagon = this.getHexagon(hexNumber)

      if (hexagon) {
        return acc + points[hexagon.num]
      }

      return acc
    }, 0)
  }
}
