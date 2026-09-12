import { type HexNumber, rollProbability } from '../../domain'
import './DiceNumber.css'

type DiceNumberProps = {
  number: HexNumber
}

export const DiceNumber = ({ number }: DiceNumberProps) => (
  <div className="dice-number">
    {number}
    <span className="tooltiptext">{rollProbability(number)}%</span>
  </div>
)
