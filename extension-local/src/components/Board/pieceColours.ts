import { type PlayerColour } from '../../domain'

/** Display colours for player pieces, close to colonist.io's palette. */
export const PIECE_COLOURS: Record<PlayerColour, { fill: string; text: string }> = {
  red: { fill: '#d63a2f', text: '#fff' },
  blue: { fill: '#2d6fe0', text: '#fff' },
  orange: { fill: '#f0862b', text: '#1a1a1a' },
  green: { fill: '#3fb14f', text: '#fff' },
  white: { fill: '#f4f4f4', text: '#1a1a1a' },
  black: { fill: '#2b2b2b', text: '#fff' },
  pink: { fill: '#ef6fb1', text: '#1a1a1a' },
  purple: { fill: '#8a4fd6', text: '#fff' },
  bronze: { fill: '#b07a3c', text: '#fff' },
  silver: { fill: '#b9c2cc', text: '#1a1a1a' },
  gold: { fill: '#e2b935', text: '#1a1a1a' },
  mysticblue: { fill: '#3aa6c9', text: '#1a1a1a' },
}

export const colourName = (colour: PlayerColour): string =>
  colour === 'mysticblue' ? 'Mystic blue' : colour.charAt(0).toUpperCase() + colour.slice(1)
