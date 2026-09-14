import { type Board, LONGEST_ROAD_MINIMUM, PRODUCING_RESOURCES, type Pieces, playerStatistics } from '../../domain'
import { PIECE_COLOURS, colourName } from '../Board/pieceColours'
import './Players.css'

const EMOJI: Record<string, string> = { brick: '🧱', grain: '🌾', lumber: '🪵', stone: '🪨', wool: '🐑' }

type PlayersProps = {
  board: Board
  pieces: Pieces
}

/** One card per colour on the board: visible points, pieces and expected production per resource. */
export const Players = ({ board, pieces }: PlayersProps) => {
  const players = playerStatistics(board, pieces)

  if (players.length === 0) {
    return (
      <section className="players players-empty">
        <p>No settlements or roads were recognised on this capture.</p>
      </section>
    )
  }

  const maxProduction = Math.max(...players.map((p) => p.totalProduction), 1)

  return (
    <section className="players">
      <header className="players-header">
        <span className="players-title">Players on the board</span>
        <span className="players-subtitle">Points from buildings and longest road only; cards are hidden</span>
      </header>
      <ol className="players-list">
        {players.map((player) => {
          const palette = PIECE_COLOURS[player.colour]
          return (
            <li className="player" key={player.colour}>
              <div className="player-line">
                <span className="player-swatch" style={{ background: palette.fill }} />
                <span className="player-name">{colourName(player.colour)}</span>
                <span className="player-pieces">
                  {player.settlements} <small>settl.</small> · {player.cities} <small>cities</small>
                  {player.metropolises > 0 && (
                    <>
                      {' '}
                      ({player.metropolises} <small>metro.</small>)
                    </>
                  )}{' '}
                  · {player.roads} <small>roads</small>
                  {player.knights > 0 && (
                    <>
                      {' '}
                      · {player.knights} <small>knights</small>
                    </>
                  )}
                </span>
                <span className="player-points" title="Visible victory points">
                  {player.visiblePoints} <small>VP</small>
                </span>
              </div>
              <div className="player-bar" aria-hidden="true">
                <div
                  className="player-fill"
                  style={{ width: `${(player.totalProduction / maxProduction) * 100}%`, background: palette.fill }}
                />
              </div>
              <div className="player-meta">
                <span className="player-production">
                  {PRODUCING_RESOURCES.map((resource) => (
                    <span key={resource} className="player-resource" title={resource}>
                      {EMOJI[resource]} {player.production.get(resource) ?? 0}
                    </span>
                  ))}
                </span>
                <span>
                  {player.totalProduction} pips · road {player.longestRoad}
                  {player.longestRoad >= LONGEST_ROAD_MINIMUM ? ' ★' : ''}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
