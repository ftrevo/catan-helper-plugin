import { Vertex } from '../Vertex/Vertex'
import { DiceNumber } from '../DiceNumber/DiceNumber'

import { Hexagon } from '../../infra/board'

import './Hexagon.css'

export const Hexagona = ({ hexagon, hexagonNumber }: { hexagon: Hexagon; hexagonNumber: number }) => {
  console.log(hexagonNumber, hexagon.position, hexagon.resource, hexagon.num)
  return (
    <div
      id={`div-hexagon-${hexagonNumber}`}
      className={`hexagon ${hexagon.resource} ${[0, 3, 7, 12, 16].includes(hexagon.position) ? 'borderLeft' : ''} ${
        [7, 12, 16, 17, 18].includes(hexagon.position) ? 'borderLeftAfter' : ''
      }}`}
    >
      <DiceNumber key={'dice-number'} displayNumber={hexagon.num} />

      {hexagon.vertices.map((vertex, vertexNumber) => (
        <Vertex key={vertexNumber} number={vertexNumber} value={vertex} />
      ))}
    </div>
  )
}
