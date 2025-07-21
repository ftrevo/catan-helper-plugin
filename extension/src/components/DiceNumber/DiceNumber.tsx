import './DiceNumber.css'

type DiceNumberProps = {
  displayNumber: string
  probability: number
}

export const DiceNumber = ({ displayNumber, probability }: DiceNumberProps) => {
  return (
    <div id="div-dice-number" className="dice-number">
      {displayNumber}
      <span className="tooltiptext">{probability}%</span>
    </div>
  )
}
