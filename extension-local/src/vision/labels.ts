import { HEX_NUMBERS, RESOURCES } from '../domain/board'

/**
 * Output class order of the two models. This order is fixed by training (see `train-model/`): the
 * resource classes are the dataset folder names sorted alphabetically, the number classes run 2..12
 * with "7" standing for the desert tile. Changing these lists without retraining breaks every reading.
 */
export const RESOURCE_LABELS = RESOURCES
export const NUMBER_LABELS = HEX_NUMBERS
