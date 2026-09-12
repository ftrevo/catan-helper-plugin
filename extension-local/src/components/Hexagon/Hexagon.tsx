import { type Board, type Resource, type TilePosition, tileVertexValues } from '../../domain'
import { DiceNumber } from '../DiceNumber/DiceNumber'
import { Vertex } from '../Vertex/Vertex'
import './Hexagon.css'

/** Tiles on the board's edge need extra borders so the outline is drawn on every side. */
const LEFT_BORDER = new Set<TilePosition>([0, 3, 7, 12, 16])
const LEFT_BORDER_AFTER = new Set<TilePosition>([7, 12, 16, 17, 18])
const RIGHT_BORDER_BEFORE = new Set<TilePosition>([11, 15, 16, 17, 18])

type HexagonProps = {
  board: Board
  position: TilePosition
  scarcity: ReadonlyMap<Resource, number> | undefined
}

export const Hexagon = ({ board, position, scarcity }: HexagonProps) => {
  const tile = board.tiles[position]
  if (!tile) return null

  const classes = [
    'hexagon',
    `resource-${tile.resource}`,
    LEFT_BORDER.has(position) && 'border-left',
    LEFT_BORDER_AFTER.has(position) && 'border-left-after',
    RIGHT_BORDER_BEFORE.has(position) && 'border-right-before',
  ]

  return (
    <div className={classes.filter(Boolean).join(' ')}>
      <DiceNumber number={tile.number} />
      {tileVertexValues(board, position, scarcity).map((value, index) => (
        <Vertex key={index} index={index} value={value} />
      ))}
    </div>
  )
}
