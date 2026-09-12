import { type Building, type Pieces } from '../../src/domain/pieces'

/**
 * Pieces visible on the fixture captures, labelled by hand with vertex and edge ids from
 * `training/src/overlay.ts`. Board 3 was captured four times, so its pieces apply to every size.
 */
export const BOARD_2_PIECES: Pieces = {
  buildings: [
    { vertex: 22, kind: 'settlement', colour: 'orange' },
    { vertex: 44, kind: 'settlement', colour: 'green' },
  ],
  roads: [
    { edge: 25, colour: 'orange' },
    { edge: 57, colour: 'green' },
  ],
}

export const BOARD_3_PIECES: Pieces = {
  buildings: [
    { vertex: 8, kind: 'settlement', colour: 'green' },
    { vertex: 39, kind: 'settlement', colour: 'blue' },
    { vertex: 40, kind: 'settlement', colour: 'orange' },
  ],
  roads: [
    { edge: 7, colour: 'green' },
    { edge: 56, colour: 'blue' },
    { edge: 51, colour: 'orange' },
  ],
}

/**
 * The original 2025 sample is a spectated mid-game board with three players. Its artwork predates the
 * current game rendering, so the piece models trained on today's sprites confuse orange and red roads
 * with bronze there; it is kept as a tolerance check rather than an exact one (see pieceReader.e2e.spec).
 */
export const BOARD_1_PIECES: Pieces = {
  buildings: [
    { vertex: 3, kind: 'settlement', colour: 'orange' },
    { vertex: 12, kind: 'settlement', colour: 'orange' },
    { vertex: 29, kind: 'city', colour: 'orange' },
    { vertex: 25, kind: 'settlement', colour: 'red' },
    { vertex: 44, kind: 'city', colour: 'red' },
    { vertex: 51, kind: 'settlement', colour: 'red' },
    { vertex: 30, kind: 'settlement', colour: 'blue' },
    { vertex: 37, kind: 'settlement', colour: 'blue' },
    { vertex: 45, kind: 'settlement', colour: 'blue' },
    { vertex: 46, kind: 'settlement', colour: 'blue' },
  ],
  roads: [
    { edge: 6, colour: 'orange' },
    { edge: 35, colour: 'orange' },
    { edge: 43, colour: 'orange' },
    { edge: 31, colour: 'red' },
    { edge: 63, colour: 'red' },
    { edge: 67, colour: 'red' },
    { edge: 44, colour: 'blue' },
    { edge: 51, colour: 'blue' },
    { edge: 53, colour: 'blue' },
    { edge: 58, colour: 'blue' },
    { edge: 59, colour: 'blue' },
    { edge: 61, colour: 'blue' },
  ],
}

/**
 * A spectated Cities & Knights game at its end: the black player holds the Science and Politics
 * metropolises, red holds Trade. Only these pieces are labelled; every one must be read with its kind and
 * colour. Black pieces used to be missed entirely by the first piece models.
 */
export const BOARD_6_KEY_PIECES: readonly Building[] = [
  { vertex: 24, kind: 'metropolis', colour: 'black' },
  { vertex: 40, kind: 'metropolis', colour: 'black' },
  { vertex: 28, kind: 'metropolis', colour: 'red' },
  { vertex: 25, kind: 'city', colour: 'black' },
  { vertex: 48, kind: 'city', colour: 'black' },
  { vertex: 19, kind: 'knight', colour: 'black' },
  { vertex: 13, kind: 'city', colour: 'blue' },
  { vertex: 36, kind: 'settlement', colour: 'orange' },
]

/** Fixtures whose artwork predates the current game rendering; piece detection is checked loosely there. */
export const LEGACY_RENDER_FIXTURES = new Set(['test/fixtures/colonist-board.png'])

/** Pieces per fixture file; fixtures not listed here have no pieces on the board. */
export const FIXTURE_PIECES: Record<string, Pieces> = {
  'test/fixtures/colonist-board.png': BOARD_1_PIECES,
  'test/fixtures/colonist-board-2.png': BOARD_2_PIECES,
  'test/fixtures/colonist-board-3-1280x720.png': BOARD_3_PIECES,
  'test/fixtures/colonist-board-3-1366x768.png': BOARD_3_PIECES,
  'test/fixtures/colonist-board-3-1920x1080.png': BOARD_3_PIECES,
  'test/fixtures/colonist-board-3-1512x758@2x.png': BOARD_3_PIECES,
}
