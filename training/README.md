# Training

Builds the model sets used by `../extension-local` from synthetic boards composed of colonist.io's own
artwork, so the classifiers see every tile at every size the extension may encounter.

## Setup

```bash
npm install
npm run assets                 # spritesheets (tokens, pieces, highlights) → assets/colonist/
```

`assets/` is gitignored: the artwork belongs to colonist.io and is downloaded on demand. Only the trained
weights are committed, under `../extension-local/public/models/<set>/`.

Tile faces (background, border and the resource drawing) are not in the spritesheets; the game draws them
from flat `tile_*_empty` hexes plus artwork that is not shipped as an asset. They are therefore cut out of
a large capture of a real game:

```bash
# 1. capture a board at a big viewport (see extension-local/README.md, "Checking against a live game")
npm run locate -- --resize 4800 huge-capture.png board.png   # the locator wants tokens under 200 px
# 2. cut one clean tile per resource (no pieces or highlights on it); indices are tile positions, row by row
npm run extract-tiles -- board.png brick=7 grain=8 lumber=12 stone=14 wool=15 desert=6
```

The measured tile geometry (face offset, border, token patch) lives in `src/tile-geometry.ts`.

## Commands

| Command                                                                    | What it does                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run preview`                                                          | Renders one synthetic board and a contact sheet comparing synthetic and real crops (`out/`).            |
| `npm run train -- --set v2-synthetic --arch deep --boards 800 --epochs 15` | Generates boards, trains both classifiers, saves the set and scores it on the real fixtures.            |
| `npm run locate -- capture.png`                                            | Prints the board geometry the extension's locator finds in a capture.                                   |
| `npm run train:pieces -- --set pieces-v1 --boards 600 --epochs 10`         | Trains the vertex kind, piece colour and road classifiers from synthetic boards.                        |
| `npm run measure:pieces`                                                   | Template-matches piece sprites against the fixtures to calibrate the renderer's piece scale and anchor. |
| `npm run typecheck`                                                        | Type-checks the scripts, including the extension modules they import.                                   |

Options: `--arch compact|deep`, `--boards`, `--epochs`, `--seed`, `--min-spacing`, `--max-spacing`.

Runs on Node 22 or newer. `tfjs-node` needs the small shim in `tfjs-node-compat.cjs` on Node 23+; the
npm scripts preload it.

## How it fits together

- `src/renderer.ts` draws a board: sea, sand, one tile sprite per position, tokens with shadows, the
  robber, and random roads, settlements, cities and placement highlights from the spritesheets.
- `src/dataset.ts` crops each tile with the extension's own `cropRect` / `cropAndResize`, imported from
  `../extension-local/src/vision`, so training crops can never drift from what the popup feeds the models.
- `src/model.ts` defines two architectures: `compact` (like the 2025 models) and `deep`.
- `src/evaluate.ts` scores a model pair on the extension's fixture screenshots using the same locator.
- `src/train.ts` ties it together and writes `manifest.json` next to the saved models.

After training, register the new set in `../extension-local/src/vision/modelSets.ts` and run
`npm run evaluate` there to compare all sets.
