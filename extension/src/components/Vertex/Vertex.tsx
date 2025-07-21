import './Vertex.css'

/**
 * Classification thresholds for vertex values based on pip probability.
 * - 13+ pips: Best settlement locations
 * - 10-12 pips: Good locations
 * - 7-9 pips: Medium value locations
 * - <7 pips: Low value locations
 */
const VERTEX_VALUE_THRESHOLDS = {
  BEST: 13,
  GOOD: 10,
  MEDIUM: 7,
}

const getVertexCssColor = (value: number) => {
  if (value >= VERTEX_VALUE_THRESHOLDS.BEST) return 'best'
  if (value >= VERTEX_VALUE_THRESHOLDS.GOOD) return 'good'
  if (value >= VERTEX_VALUE_THRESHOLDS.MEDIUM) return 'medium'
  return 'bad'
}

type VertexProps = {
  number: number
  value: number
}

export const Vertex = ({ number, value }: VertexProps) => {
  return (
    <span id={`span-vertex-${number}`} className={`vertex position-${number} quality-${getVertexCssColor(value)}`}>
      {value | 0}
    </span>
  )
}
