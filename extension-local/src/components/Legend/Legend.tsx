import { VERTEX_BANDS } from '../Board/vertexDisplay'
import { Segmented } from '../Segmented/Segmented'
import './Legend.css'

export type Weighting = 'sum' | 'rarity' | 'strategy'

type LegendProps = {
  weighting: Weighting
  onWeightingChange: (weighting: Weighting) => void
}

const OPTIONS = [
  { value: 'sum', label: 'Sum', title: 'Plain pip sums' },
  { value: 'rarity', label: 'Rarity', title: 'Pips weighted by how scarce each resource is on this board' },
  {
    value: 'strategy',
    label: 'Strategy',
    title:
      'Rarity combined with how much a typical game needs each resource (ore and grain for cities and development cards). Ports are not considered.',
  },
] as const

/** Weighting control for the vertex badges plus the colour bands they use. */
export const Legend = ({ weighting, onWeightingChange }: LegendProps) => (
  <div className="legend">
    <Segmented
      ariaLabel="Vertex weighting"
      size="sm"
      value={weighting}
      onChange={onWeightingChange}
      options={OPTIONS}
    />
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
