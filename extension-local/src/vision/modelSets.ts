/**
 * The model sets shipped with the extension. Each set is a folder under `public/models/<id>/` holding a
 * `resources` and a `numbers` TensorFlow.js layers model plus a `manifest.json` describing its training.
 * One set ships today; the registry stays so a candidate can be added and scored with `npm run evaluate`.
 */
export type ModelSetId = (typeof MODEL_SETS)[number]['id']

export type ModelSet = {
  readonly id: string
  readonly label: string
  readonly description: string
}

export const MODEL_SETS = [
  {
    id: 'v2-synthetic',
    label: 'v2 · synthetic',
    description: 'Trained on boards composed from the game artwork at many sizes, with pieces and highlights.',
  },
] as const satisfies readonly ModelSet[]

export const DEFAULT_MODEL_SET: ModelSetId = 'v2-synthetic'

export const isModelSetId = (value: string): value is ModelSetId => MODEL_SETS.some((set) => set.id === value)

/** Relative paths of a set's model files inside the extension package. */
export const modelSetPaths = (id: ModelSetId) => ({
  resources: `models/${id}/resources/model.json`,
  numbers: `models/${id}/numbers/model.json`,
})

/** Piece detectors are shared by all tile model sets. */
export const PIECE_MODEL_SET = 'pieces-v1'

export const pieceModelPaths = () => ({
  buildings: `models/${PIECE_MODEL_SET}/buildings/model.json`,
  colours: `models/${PIECE_MODEL_SET}/colours/model.json`,
  roads: `models/${PIECE_MODEL_SET}/roads/model.json`,
})
