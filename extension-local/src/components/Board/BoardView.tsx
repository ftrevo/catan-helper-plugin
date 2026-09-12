import { type Board, type Resource, TILE_OFFSETS, TILE_VERTICES, VERTEX_TILES, vertexValues } from '../../domain'
import { Hexagon } from '../Hexagon/Hexagon'
import { formatVertexValue, vertexLevel } from './vertexDisplay'
import './BoardView.css'

/** Board geometry in CSS pixels. The hex width plus the gap is the lattice spacing. */
const HEX_WIDTH = 70
const GAP = 3
const SPACING = HEX_WIDTH + GAP
const HEX_HEIGHT = (HEX_WIDTH * 2) / Math.sqrt(3)
/** Distance from a tile centre to its corners; corners are shared, so use the lattice spacing. */
const CORNER_RADIUS = SPACING / Math.sqrt(3)
/** Room for the badges that overhang the outer corners. */
const MARGIN = 14

/** Directions of a tile's six corners, in `TILE_VERTICES` order: top, upper-left, upper-right, lower-left, lower-right, bottom. */
const CORNER_ANGLES = [-90, -150, -30, 150, 30, 90].map((deg) => (deg * Math.PI) / 180)

const CANVAS_WIDTH = 5 * SPACING - GAP + 2 * MARGIN
const CANVAS_HEIGHT = 4 * SPACING * (Math.sqrt(3) / 2) + HEX_HEIGHT + 2 * MARGIN
const ORIGIN = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }

const tileCenters = TILE_OFFSETS.map((o) => ({ x: ORIGIN.x + o.x * SPACING, y: ORIGIN.y + o.y * SPACING }))

/** Pixel position of every vertex, derived from the first tile that touches it. */
const vertexPositions = VERTEX_TILES.map((tiles, vertex) => {
  const tile = tiles[0]
  const corner = tile === undefined ? -1 : TILE_VERTICES[tile].indexOf(vertex as never)
  const center = tile === undefined ? ORIGIN : (tileCenters[tile] ?? ORIGIN)
  const angle = CORNER_ANGLES[corner] ?? 0
  return { x: center.x + Math.cos(angle) * CORNER_RADIUS, y: center.y + Math.sin(angle) * CORNER_RADIUS }
})

type BoardViewProps = {
  board: Board
  /** When set, vertex values are weighted by resource rarity. */
  scarcity: ReadonlyMap<Resource, number> | undefined
}

export const BoardView = ({ board, scarcity }: BoardViewProps) => {
  const values = vertexValues(board, scarcity)

  return (
    <div className="board">
      <div
        className="board-canvas"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, '--hex-w': `${HEX_WIDTH}px` } as React.CSSProperties}
      >
        {board.tiles.map((tile) => {
          const c = tileCenters[tile.position]
          return c ? <Hexagon key={tile.position} tile={tile} x={c.x} y={c.y} /> : null
        })}
        {values.map((value, vertex) => {
          const p = vertexPositions[vertex]
          return p ? (
            <span
              key={vertex}
              className={`vertex vertex-level-${vertexLevel(value)}`}
              style={{ left: p.x, top: p.y }}
              title={`Vertex ${vertex}: ${value.toFixed(2)} pips`}
            >
              {formatVertexValue(value)}
            </span>
          ) : null
        })}
      </div>
    </div>
  )
}
