import { VERTEX_BANDS } from '../Board/vertexDisplay'
import './Legend.css'

type LegendProps = { rarityMode: boolean }

/** Explains the vertex badges: pips per roll around each corner, best spots darkest. */
export const Legend = ({ rarityMode }: LegendProps) => (
  <div className="legend">
    <span className="legend-title">{rarityMode ? 'Vertex value, weighted by rarity' : 'Vertex value in pips'}</span>
    <span className="legend-scale">
      {[...VERTEX_BANDS].reverse().map((band) => (
        <span key={band.level} className="legend-item">
          <span className={`legend-swatch vertex-level-${band.level}`} />
          {band.label}
        </span>
      ))}
    </span>
  </div>
)
