/** Player colours as colonist.io names them; the first four are the defaults in a four-player game. */
export const PLAYER_COLOURS = [
  'red',
  'blue',
  'orange',
  'green',
  'white',
  'black',
  'pink',
  'purple',
  'bronze',
  'silver',
  'gold',
  'mysticblue',
] as const
export type PlayerColour = (typeof PLAYER_COLOURS)[number]

export const isPlayerColour = (value: string): value is PlayerColour =>
  (PLAYER_COLOURS as readonly string[]).includes(value)

export type BuildingKind = 'settlement' | 'city'

export type Building = {
  readonly vertex: number
  readonly kind: BuildingKind
  readonly colour: PlayerColour
}

export type Road = {
  readonly edge: number
  readonly colour: PlayerColour
}

export type Pieces = {
  readonly buildings: readonly Building[]
  readonly roads: readonly Road[]
}

export const NO_PIECES: Pieces = { buildings: [], roads: [] }
