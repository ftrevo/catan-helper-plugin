import type { HexNumber } from './board'

/** Total number of pips (dots) on a standard Catan board. */
export const TOTAL_PIPS = 58

/** Average pips per producing resource: 58 pips spread over 5 resources. */
export const AVERAGE_PIPS_PER_RESOURCE = TOTAL_PIPS / 5

/** Number of two-dice combinations that roll `number`, i.e. the pips printed on the token. */
export const pipsOf = (number: HexNumber): number => 6 - Math.abs(7 - Number(number))

/** Pips that actually produce resources. A "7" moves the robber and yields nothing. */
export const producingPipsOf = (number: HexNumber): number => (number === '7' ? 0 : pipsOf(number))

export const roundPercentage = (percentage: number): number => parseFloat(percentage.toFixed(1))

/** Probability, in percent with one decimal, that a two-dice roll hits `number`. */
export const rollProbability = (number: HexNumber): number => roundPercentage((pipsOf(number) / 36) * 100)
