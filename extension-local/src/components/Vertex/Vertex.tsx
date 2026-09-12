import './Vertex.css'

/**
 * Vertex value bands, in producing pips.
 * 13+: best settlement spots, 10-12: good, 7-9: medium, below 7: poor.
 */
const VERTEX_QUALITY = [
  { minimum: 13, className: 'quality-best' },
  { minimum: 10, className: 'quality-good' },
  { minimum: 7, className: 'quality-medium' },
  { minimum: -Infinity, className: 'quality-poor' },
] as const

const qualityClass = (value: number): string =>
  VERTEX_QUALITY.find((band) => value >= band.minimum)?.className ?? 'quality-poor'

type VertexProps = {
  /** 0..5, clockwise from the top; drives the CSS position around the hexagon. */
  index: number
  value: number
}

export const Vertex = ({ index, value }: VertexProps) => (
  <span className={`vertex position-${index} ${qualityClass(value)}`} title={value.toFixed(1)}>
    {Math.trunc(value)}
  </span>
)
