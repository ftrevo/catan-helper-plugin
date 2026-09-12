import { type Board, type Resource, TOTAL_PIPS, resourceStatistics, roundPercentage } from '../../domain'
import './Statistics.css'

const EMOJI: Record<Exclude<Resource, 'desert'>, string> = {
  brick: '🧱',
  grain: '🌾',
  lumber: '🪵',
  stone: '🪨',
  wool: '🐑',
}

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

type StatisticsProps = {
  board: Board
}

/** One card per resource, rarest first, showing its pips, numbers and share of the board's production. */
export const Statistics = ({ board }: StatisticsProps) => {
  const entries = [...resourceStatistics(board).entries()].sort((a, b) => a[1].pipSum - b[1].pipSum)
  const rarestPipSum = entries[0]?.[1].pipSum ?? 0

  return (
    <div className="dashboard">
      {entries.map(([resource, { pipSum, numbers }]) => {
        const share = roundPercentage((pipSum / TOTAL_PIPS) * 100)
        const multiplier = rarestPipSum === 0 ? 0 : pipSum / rarestPipSum

        return (
          <article className="resource-card" key={resource}>
            <div className="header-line">
              <span className="emoji">{resource === 'desert' ? '' : EMOJI[resource]}</span>
              <span className="name">{capitalize(resource)}</span>
              <span className="pip-sum">{pipSum}</span>
            </div>

            <div className="hex-list">
              {[...numbers]
                .sort((a, b) => Number(a) - Number(b))
                .map((num) => (
                  <span className="hex-badge" key={num}>
                    {num}
                  </span>
                ))}
            </div>

            <div className="stats">
              <div className="scarcity-bar">
                {/* Doubled so the bar is readable: no resource holds more than ~35% of the pips. */}
                <div className={`scarcity-fill resource-${resource}`} style={{ width: `${share * 2}%` }} />
              </div>
              <span className="percent">{share}%</span>
              <span className="multiplier-pill">×{multiplier.toFixed(2)}</span>
            </div>
          </article>
        )
      })}
    </div>
  )
}
