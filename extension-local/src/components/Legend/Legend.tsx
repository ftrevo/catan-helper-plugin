import { VERTEX_BANDS } from '../Board/vertexDisplay'
import './Legend.css'

type LegendProps = { weighting: 'sum' | 'rarity' | 'strategy' }

const TITLES: Record<LegendProps['weighting'], string> = {
  sum: 'Vertex value in pips',
  rarity: 'Vertex value, weighted by rarity',
  strategy: 'Vertex value, rarity × demand',
}

/** Explains the vertex badges: pips per roll around each corner, best spots darkest. */
export const Legend = ({ weighting }: LegendProps) => (
  <div className="legend">
    <span
      className="legend-title"
      title={
        weighting === 'strategy'
          ? 'Demand follows the building costs of a typical game. Ports are not considered.'
          : undefined
      }
    >
      {TITLES[weighting]}
    </span>
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
