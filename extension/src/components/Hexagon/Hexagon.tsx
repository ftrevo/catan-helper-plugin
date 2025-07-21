import { Vertex } from '../Vertex/Vertex'
import { DiceNumber } from '../DiceNumber/DiceNumber'

import { getVerticesValues, type Hexagons } from '../../utils'

import './Hexagon.css'

const startPositions = [0, 3, 7, 12, 16]

const getHexNumber = (lineNumber: number, hexLinePosition: number) => startPositions[lineNumber] + hexLinePosition

const leftBorderAfterNeeded = [7, 12, 16, 17, 18]
const leftBorderNeeded = [0, 3, 7, 12, 16]
const rightBorderBeforeNeeded = [11, 15, 16, 17, 18]

type HexagonProps = {
  hexagonLinePosition: number
  hexagons: Hexagons
  lineNumber: number
  scarcityFactors?: Map<string, number>
}

export const Hexagon = ({ hexagonLinePosition, hexagons, lineNumber, scarcityFactors }: HexagonProps) => {
  const hexagon = hexagons[getHexNumber(lineNumber, hexagonLinePosition)]
  const verticesValues = getVerticesValues(hexagon.position, hexagons, scarcityFactors)

  const leftBorder = leftBorderNeeded.includes(hexagon.position) ? 'border-left' : ''
  const leftBorderAfter = leftBorderAfterNeeded.includes(hexagon.position) ? 'border-left-after' : ''
  const rightBorderBefore = rightBorderBeforeNeeded.includes(hexagon.position) ? 'border-right-before' : ''

  return (
    <div
      id={`div-hexagon-${hexagonLinePosition}`}
      className={`hexagon ${hexagon.resource} ${leftBorder} ${leftBorderAfter} ${rightBorderBefore}`}
    >
      <DiceNumber key={'dice-number'} displayNumber={hexagon.num} probability={hexagon.probability} />

      {verticesValues.map((vertex, vertexNumber) => (
        <Vertex key={vertexNumber} number={vertexNumber} value={vertex} />
      ))}
    </div>
  )
}
