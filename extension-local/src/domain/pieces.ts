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

/**
 * What can stand on a vertex. `metropolis` is a city carrying a Cities & Knights metropolis; `knight` is a
 * Cities & Knights knight of any level, which occupies the corner but is not a building.
 */
export const BUILDING_KINDS = ['settlement', 'city', 'metropolis', 'knight'] as const
export type BuildingKind = (typeof BUILDING_KINDS)[number]

export const isBuildingKind = (value: string): value is BuildingKind =>
  (BUILDING_KINDS as readonly string[]).includes(value)

/** Victory points a vertex piece is worth on the board. */
export const BUILDING_POINTS: Record<BuildingKind, number> = { settlement: 1, city: 2, metropolis: 4, knight: 0 }

/** How many resource cards a vertex piece collects per matching roll. */
export const BUILDING_YIELD: Record<BuildingKind, number> = { settlement: 1, city: 2, metropolis: 2, knight: 0 }

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
