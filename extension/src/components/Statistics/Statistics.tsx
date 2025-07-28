import type { ReadCreateData } from '../../../typings/api'
import { getDisplayPercentage, TOTAL_PIPS } from '../../utils/calculations'
import { getStatisticsData } from '../../utils/statistics'
import './Statistics.css'

const emojiMap: Record<string, string> = {
  brick: '🧱',
  grain: '🌾',
  lumber: '🪵',
  stone: '🪨',
  wool: '🐑',
}

type StatisticsProps = {
  data: ReadCreateData
}

export const Statistics = ({ data }: StatisticsProps) => {
  const resources = getStatisticsData(data)
  const entries = Array.from(resources.entries())
  const rarestResource = entries.reduce((prev, current) => (prev[1].pipSum < current[1].pipSum ? prev : current))

  return (
    <div className="dashboard">
      {entries
        .sort((a, b) => a[1].pipSum - b[1].pipSum)
        .map(([resource, { pipSum, numberSet }]) => {
          const percentage = getDisplayPercentage((pipSum / TOTAL_PIPS) * 100)
          const multiplier = pipSum / rarestResource[1].pipSum

          return (
            <div className="resource-card" key={resource}>
              <div className="header-line">
                <span className="emoji">{emojiMap[resource]}</span>
                <span className="name">{resource.charAt(0).toUpperCase() + resource.slice(1)}</span>
                <span className="pip-sum">{pipSum}</span>
              </div>

              <div className="hex-list">
                {Array.from(numberSet)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((num) => (
                    <div className="hex-badge" key={num}>
                      {num}
                    </div>
                  ))}
              </div>

              <div className="stats">
                <div className="scarcity-bar">
                  {/* Adjusted the width with a *2 for better visibility */}
                  <div className={`scarcity-fill ${resource}`} style={{ width: `${percentage * 2}%` }} />{' '}
                </div>
                <div className="percent">{percentage}%</div>
                <div className="multiplier-pill">×{multiplier.toFixed(2)}</div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
