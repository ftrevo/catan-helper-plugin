/**
 * Real colonist.io captures with hand-read ground truth. Pure data so the training package can import
 * it too; decoding lives in `../loadPng.ts`.
 */
import { SAMPLE_BOARD } from './sample-board'
import { SAMPLE_BOARD_2 } from './sample-board-2'
import { SAMPLE_BOARD_3 } from './sample-board-3'

export { SAMPLE_BOARD, SAMPLE_BOARD_2, SAMPLE_BOARD_3 }
export {
  BOARD_1_PIECES,
  BOARD_2_PIECES,
  BOARD_3_PIECES,
  BOARD_6_KEY_PIECES,
  FIXTURE_PIECES,
  LEGACY_RENDER_FIXTURES,
} from './pieces'

export type BoardTruth = { readonly resources: readonly string[]; readonly numbers: readonly string[] }

export type Fixture = {
  readonly name: string
  /** Path relative to the extension folder. */
  readonly file: string
  readonly truth: BoardTruth
  /** Approximate tile spacing in the capture, for documentation and sanity checks. */
  readonly spacing: number
}

export const FIXTURES: readonly Fixture[] = [
  { name: 'original sample, 1512x758 @2x (2025 token style)', file: 'test/fixtures/colonist-board.png', truth: SAMPLE_BOARD, spacing: 216 },
  { name: 'bots game, 1512x758 @2x', file: 'test/fixtures/colonist-board-2.png', truth: SAMPLE_BOARD_2, spacing: 193 },
  { name: 'bots game 3, 1280x720 @1x', file: 'test/fixtures/colonist-board-3-1280x720.png', truth: SAMPLE_BOARD_3, spacing: 86 },
  { name: 'bots game 3, 1366x768 @1x', file: 'test/fixtures/colonist-board-3-1366x768.png', truth: SAMPLE_BOARD_3, spacing: 94 },
  { name: 'bots game 3, 1920x1080 @1x', file: 'test/fixtures/colonist-board-3-1920x1080.png', truth: SAMPLE_BOARD_3, spacing: 126 },
  { name: 'bots game 3, 1512x758 @2x', file: 'test/fixtures/colonist-board-3-1512x758@2x.png', truth: SAMPLE_BOARD_3, spacing: 193 },
]

/**
 * Captures used only to check the locator: a spectated Cities & Knights game at 1600x900 whose knight
 * badges are white discs of nearly token size. Tiles are not labelled.
 */
export const LOCATOR_ONLY_FIXTURES = [
  { name: 'Cities & Knights spectated game, 1600x900 @1x', file: 'test/fixtures/colonist-board-4-ck.png', spacing: 115, minTokens: 16 },
]

/** Captures with only some pieces labelled (see `BOARD_6_KEY_PIECES`); tiles are not labelled. */
export const PARTIAL_PIECE_FIXTURES = [
  {
    name: 'Cities & Knights game over with three metropolises, 1600x900 @1x',
    file: 'test/fixtures/colonist-board-6-ck-metropolis.png',
    spacing: 115,
  },
]

/** A large custom island, listed as a base game by mistake: part of it fits the lattice, the rest gives it away. */
export const NON_STANDARD_FIXTURES = [
  { name: 'custom island map, 1600x900 @1x', file: 'test/fixtures/colonist-board-5-custom-map.png' },
]
