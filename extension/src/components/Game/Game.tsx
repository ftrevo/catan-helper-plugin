import { Board } from '../../infra/board'
import { Line } from '../Line/Line'

import './Game.css'

export const Game = ({ board }: { board: Board }) => {
  return (
    <div key="game" id="game" className="game">
      <Line key="line0" hexagons={board.hexagons.slice(0, 3)} lineNumber="0" />
      <Line key="line1" hexagons={board.hexagons.slice(3, 7)} lineNumber="1" />
      <Line key="line2" hexagons={board.hexagons.slice(7, 12)} lineNumber="2" />
      <Line key="line3" hexagons={board.hexagons.slice(12, 16)} lineNumber="3" />
      <Line key="line4" hexagons={board.hexagons.slice(16, 19)} lineNumber="4" />
    </div>
  )
}
