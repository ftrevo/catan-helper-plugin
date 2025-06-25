import type { Hexagon as HexagonBoard } from '../../infra/board'
import { Hexagon } from '../Hexagon/Hexagon'

export const Line = ({ lineNumber, hexagons }: { lineNumber: string; hexagons: Array<HexagonBoard> }) => {
  return (
    <div id={`div-line-${lineNumber}`} className="tile-row">
      {hexagons.map((hex, tileIndex) => (
        <Hexagon key={`hexagon-${tileIndex}`} hexagonNumber={tileIndex} hexagon={hex} />
      ))}
    </div>
  )
}
