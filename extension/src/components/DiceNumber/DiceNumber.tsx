import './DiceNumber.css'

export const DiceNumber = ({ displayNumber, probability }: { displayNumber: string; probability: number }) => {
  return (
    <div id="div-dice-number" className="diceNumber">
      {displayNumber}
      <span className="tooltiptext">{probability}%</span>
    </div>
  )
}
