import type { Hexagons } from '../../utils/hexagons'
import { Hexagon } from '../Hexagon/Hexagon'

const hexagonsPerLine = [3, 4, 5, 4, 3]

export const Line = ({
  hexagons,
  lineNumber,
  scarcityFactors,
}: {
  hexagons: Hexagons
  lineNumber: number
  scarcityFactors?: Map<string, number>
}) => {
  const length = hexagonsPerLine[lineNumber]

  return (
    <div id={`div-line-${lineNumber}`} className="tile-row">
      {Array.from({ length }).map((_, hexagonLinePosition) => (
        <Hexagon
          key={`hexagon-${hexagonLinePosition}`}
          hexagonLinePosition={hexagonLinePosition}
          hexagons={hexagons}
          lineNumber={lineNumber}
          scarcityFactors={scarcityFactors}
        />
      ))}
    </div>
  )
}
