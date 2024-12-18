import { Hexagon } from '../../infra/board'
import { Hexagona } from '../Hexagon/Hexagon'

export const Line = ({ lineNumber, hexagons }: { lineNumber: string; hexagons: Array<Hexagon> }) => {
  return (
    <div id={`div-line-${lineNumber}`} className="tile-row">
      {hexagons.map((hex, tileIndex) => (
        <Hexagona key={`hexagon-${tileIndex}`} hexagonNumber={tileIndex} hexagon={hex} />
      ))}
    </div>
  )
}
