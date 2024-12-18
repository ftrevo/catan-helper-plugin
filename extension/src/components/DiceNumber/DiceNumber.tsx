import './DiceNumber.css'

export const DiceNumber = ({ displayNumber }: { displayNumber: string }) => {
  return (
    <div id="div-dice-number" className="diceNumber">
      {displayNumber}
    </div>
  )
}
