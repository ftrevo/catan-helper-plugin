import { type HexNumber, type Resource, type Tile, pipsOf, rollProbability } from '../../domain'
import './Hexagon.css'

type TokenProps = { number: HexNumber; resource: Resource }

/** Catan-style number token: number on a pale disc with probability dots, red for 6 and 8. */
const Token = ({ number, resource }: TokenProps) => {
  if (resource === 'desert') return null
  const pips = pipsOf(number)
  return (
    <div className={`token ${pips === 5 ? 'token-hot' : ''}`} title={`${rollProbability(number)}% per roll`}>
      <span className="token-number">{number}</span>
      <span className="token-pips" aria-hidden="true">
        {'•'.repeat(pips)}
      </span>
    </div>
  )
}

type HexagonProps = {
  tile: Tile
  /** Centre of the hexagon inside the board canvas, in pixels. */
  x: number
  y: number
}

/** One tile: outlined hexagon face with its number token. Vertex badges are drawn by the board. */
export const Hexagon = ({ tile, x, y }: HexagonProps) => (
  <div
    className="hex"
    style={{ left: x, top: y }}
    role="img"
    aria-label={tile.resource === 'desert' ? 'desert' : `${tile.resource} ${tile.number}`}
  >
    <div className={`hex-face tile-${tile.resource}`} />
    <Token number={tile.number} resource={tile.resource} />
  </div>
)
