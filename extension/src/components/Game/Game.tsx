import type { Hexagons } from '../../utils/hexagons'
import { Line } from '../Line/Line'

import './Game.css'

const lineNumbers = [0, 1, 2, 3, 4]

export const Game = ({ hexagons, scarcityFactors }: { hexagons?: Hexagons; scarcityFactors?: Map<string, number> }) => {
  if (!hexagons || hexagons.length === 0) return null
  return (
    <div key="game" id="game" className="game">
      {lineNumbers.map((lineNumber) => (
        <Line
          key={`line-${lineNumber}`}
          hexagons={hexagons}
          lineNumber={lineNumber}
          scarcityFactors={scarcityFactors}
        />
      ))}
    </div>
  )
}
