import { type Board, type Resource, TILES_PER_ROW, assertTilePosition } from '../../domain'
import { Hexagon } from '../Hexagon/Hexagon'
import './BoardView.css'

type BoardViewProps = {
  board: Board
  /** When set, vertex values are weighted by resource rarity. */
  scarcity: ReadonlyMap<Resource, number> | undefined
}

/** Tile positions grouped by row, e.g. [[0,1,2],[3,4,5,6],...]. */
const rows = TILES_PER_ROW.reduce<number[][]>((acc, count) => {
  const start = acc.reduce((sum, row) => sum + row.length, 0)
  acc.push(Array.from({ length: count }, (_, i) => start + i))
  return acc
}, [])

export const BoardView = ({ board, scarcity }: BoardViewProps) => (
  <div className="board">
    {rows.map((positions, rowIndex) => (
      <div key={rowIndex} className="board-row">
        {positions.map((position) => {
          assertTilePosition(position)
          return <Hexagon key={position} board={board} position={position} scarcity={scarcity} />
        })}
      </div>
    ))}
  </div>
)
