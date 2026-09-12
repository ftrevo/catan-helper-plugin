import { type Board, type Resource, TOTAL_PIPS, resourceStatistics, roundPercentage } from '../../domain'
import './Statistics.css'

const EMOJI: Record<Exclude<Resource, 'desert'>, string> = {
  brick: '🧱',
  grain: '🌾',
  lumber: '🪵',
  stone: '🪨',
  wool: '🐑',
}

const NAMES: Record<Exclude<Resource, 'desert'>, string> = {
  brick: 'Brick',
  grain: 'Grain',
  lumber: 'Lumber',
  stone: 'Ore',
  wool: 'Wool',
}

type StatisticsProps = {
  board: Board
}

/** Resources ranked rarest first: pips on the board, the numbers producing them and their share. */
export const Statistics = ({ board }: StatisticsProps) => {
  const entries = [...resourceStatistics(board).entries()]
    .filter((entry): entry is [Exclude<Resource, 'desert'>, (typeof entry)[1]] => entry[0] !== 'desert')
    .sort((a, b) => a[1].pipSum - b[1].pipSum)
  const maxPips = Math.max(...entries.map(([, s]) => s.pipSum), 1)
  const rarest = entries[0]

  return (
    <section className="stats">
      <header className="stats-header">
        <span className="stats-title">Production by resource</span>
        <span className="stats-subtitle">{TOTAL_PIPS} pips on the board · rarest first</span>
      </header>
      <ol className="stats-list">
        {entries.map(([resource, { pipSum, tileCount, numbers }]) => {
          const share = roundPercentage((pipSum / TOTAL_PIPS) * 100)
          const scarcity = rarest ? pipSum / rarest[1].pipSum : 1
          return (
            <li className="stats-row" key={resource}>
              <span className="stats-emoji" aria-hidden="true">
                {EMOJI[resource]}
              </span>
              <div className="stats-body">
                <div className="stats-line">
                  <span className="stats-name">{NAMES[resource]}</span>
                  <span className="stats-numbers">
                    {[...numbers]
                      .sort((a, b) => Number(a) - Number(b))
                      .map((n) => (
                        <span key={n} className="stats-chip">
                          {n}
                        </span>
                      ))}
                  </span>
                  <span className="stats-pips">
                    {pipSum} <small>pips</small>
                  </span>
                </div>
                <div className="stats-bar" aria-hidden="true">
                  <div className={`stats-fill tile-${resource}`} style={{ width: `${(pipSum / maxPips) * 100}%` }} />
                </div>
                <div className="stats-meta">
                  <span>
                    {tileCount} {tileCount === 1 ? 'tile' : 'tiles'} · {share}% of production
                  </span>
                  <span className={scarcity === 1 ? 'stats-tag is-rarest' : 'stats-tag'}>
                    {scarcity === 1 ? 'rarest' : `×${scarcity.toFixed(2)} vs rarest`}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
