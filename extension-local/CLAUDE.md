# CLAUDE.md

Guidance for Claude Code when working in `extension-local/`.

- Read `README.md` first: it documents the layer structure and the capture flow.
- Commands: `npm run dev`, `npm run build`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run format`.
- Layers depend downwards only: components/app → vision/platform → domain. Keep `domain/` free of
  browser and TensorFlow imports, and keep pixel coordinates inside `vision/layout.ts`.
- `src/vision/labels.ts` mirrors the training class order in `../train-model`; never reorder it without
  retraining.
- The end-to-end test in `test/boardReader.e2e.spec.ts` is the safety net for any change to `vision/`
  or to the model files. Run `npm test` after touching them.
- Formatting follows `.prettierrc` (no semicolons, single quotes, width 120).
- All colours, radii and sizes are CSS custom properties in `src/index.css` (light and dark); components
  use the tokens, never raw colours.
