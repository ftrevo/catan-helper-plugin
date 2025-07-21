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

  const rarestResource = entries.reduce((prev, current) => {
    return prev[1].pipSum < current[1].pipSum ? prev : current
  })

  return (
    <div className="resource-dashboard">
      {entries.map(([resource, { pipSum, occurences, numberSet }]) => (
        <div className="resource-card" key={resource}>
          <div className="icon">{emojiMap[resource]}</div>
          <div className="name">{resource.charAt(0).toUpperCase() + resource.slice(1)}</div>
          <div className="value">{getDisplayPercentage((pipSum / TOTAL_PIPS) * 100)}%</div>
          <div className="scarcity">Scarcity ×{(pipSum / rarestResource[1].pipSum).toFixed(2)}</div>
          <div className="pipSum">Pip {pipSum}</div>
          <div className="numberSet">
            {Array.from(numberSet)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .join(', ')}
          </div>
        </div>
      ))}
    </div>
  )
}
