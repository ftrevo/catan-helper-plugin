import { Vertex } from '../Vertex/Vertex'
import { DiceNumber } from '../DiceNumber/DiceNumber'

import { Hexagon as HexagonBoard } from '../../infra/board'

import './Hexagon.css'

const leftBorderNeeded = [0, 3, 7, 12, 16]
const leftBorderAfterNeeded = [7, 12, 16, 17, 18]
const rightBorderBeforeNeeded = [11, 15, 16, 17, 18]

export const Hexagon = ({ hexagon, hexagonNumber }: { hexagon: HexagonBoard; hexagonNumber: number }) => {
  console.log(hexagonNumber, hexagon.position, hexagon.resource, hexagon.num)

  const leftBorder = leftBorderNeeded.includes(hexagon.position) ? 'borderLeft' : ''
  const leftBorderAfter = leftBorderAfterNeeded.includes(hexagon.position) ? 'borderLeftAfter' : ''
  const rightBorderBefore = rightBorderBeforeNeeded.includes(hexagon.position) ? 'borderRightBefore' : ''

  return (
    <div
      id={`div-hexagon-${hexagonNumber}`}
      className={`hexagon ${hexagon.resource} ${leftBorder} ${leftBorderAfter} ${rightBorderBefore}`}
    >
      <DiceNumber key={'dice-number'} displayNumber={hexagon.num} />

      {hexagon.vertices.map((vertex, vertexNumber) => (
        <Vertex key={vertexNumber} number={vertexNumber} value={vertex} />
      ))}
    </div>
  )
}
