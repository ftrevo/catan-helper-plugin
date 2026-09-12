import { HEX_NUMBERS, RESOURCES } from '../domain/board'
import { PLAYER_COLOURS } from '../domain/pieces'

/**
 * Output class order of the two models. This order is fixed by training (see `train-model/`): the
 * resource classes are the dataset folder names sorted alphabetically, the number classes run 2..12
 * with "7" standing for the desert tile. Changing these lists without retraining breaks every reading.
 */
export const RESOURCE_LABELS = RESOURCES
export const NUMBER_LABELS = HEX_NUMBERS

/** Vertex patch classes: nothing, or a settlement / city in a player colour. Order fixed by training. */
export const BUILDING_LABELS = [
  'none',
  ...PLAYER_COLOURS.map((c) => `settlement_${c}` as const),
  ...PLAYER_COLOURS.map((c) => `city_${c}` as const),
] as const
export type BuildingLabel = (typeof BUILDING_LABELS)[number]

/** Edge patch classes: nothing, or a road in a player colour. */
export const ROAD_LABELS = ['none', ...PLAYER_COLOURS.map((c) => `road_${c}` as const)] as const
export type RoadLabel = (typeof ROAD_LABELS)[number]
