import './Vertex.css'

const getVertexCssColor = (value: number) => {
  if (value >= 13) return 'best'
  if (value >= 10) return 'good'
  if (value >= 7) return 'medium'
  return 'bad'
}

export const Vertex = ({ number, value }: { number: number; value: number }) => {
  return (
    <span id={`span-vertex-${number}`} className={`vertex vertex${number} ${getVertexCssColor(value)}`}>
      {value}
    </span>
  )
}
