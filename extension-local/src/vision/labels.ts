import { HEX_NUMBERS, RESOURCES } from '../domain/board'
import { BUILDING_KINDS, PLAYER_COLOURS } from '../domain/pieces'

/**
 * Output class order of the two models. This order is fixed by training (see `train-model/`): the
 * resource classes are the dataset folder names sorted alphabetically, the number classes run 2..12
 * with "7" standing for the desert tile. Changing these lists without retraining breaks every reading.
 */
export const RESOURCE_LABELS = RESOURCES
export const NUMBER_LABELS = HEX_NUMBERS

/**
 * Vertex patches are classified in two steps: what stands there (kind), then whose it is (colour).
 * Splitting the two gives every class many more training examples than one 49-way softmax would.
 */
export const BUILDING_KIND_LABELS = ['none', ...BUILDING_KINDS] as const
export type BuildingKindLabel = (typeof BUILDING_KIND_LABELS)[number]

/** Colour of a piece, for vertex patches that hold one. Order fixed by training. */
export const COLOUR_LABELS = PLAYER_COLOURS
export type ColourLabel = (typeof COLOUR_LABELS)[number]

/** Edge patch classes: nothing, or a road in a player colour. */
export const ROAD_LABELS = ['none', ...PLAYER_COLOURS.map((c) => `road_${c}` as const)] as const
export type RoadLabel = (typeof ROAD_LABELS)[number]
