/**
 * How colonist.io draws a tile relative to its number token, in units of the tile spacing.
 * Measured on a 4800 px wide render: the hexagonal face is 0.955 spacings wide and sits above the token;
 * the golden border between faces is about 0.05 spacings. Settlements, cities and highlights are drawn at
 * the face corners, which are the token-lattice vertices shifted up by the same amount.
 */

/** Vertical offset of the face centre from the token centre (negative = up); shared with the extension. */
export { FACE_OFFSET_Y } from '../../extension-local/src/vision/layout.ts'

/** Side of the square sprite that `extract-tiles.ts` cuts around the face centre. */
export const TILE_SPRITE_SIZE = 1.16

/** Radius of the patch painted over the token when extracting a sprite. */
export const TOKEN_PATCH_RADIUS = 0.23

/** Region the robber occupies on the desert at game start, relative to the token centre. */
export const ROBBER_REGION = { minX: -0.44, maxX: -0.02, minY: -0.36, maxY: 0.28 }
