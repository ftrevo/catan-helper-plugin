/**
 * Ground truth for `colonist-board-2.png`: a bots game on colonist.io captured on 2026-09-12 at 3024x1516,
 * read off the screenshot by hand. The board is drawn smaller than in `colonist-board.png` (tile spacing
 * about 193 px instead of 216), which is what makes it a useful second fixture. Tile 11 is the desert.
 */
export const SAMPLE_BOARD_2 = {
  resources: [
    'wool', 'wool', 'stone',
    'lumber', 'grain', 'grain', 'brick',
    'stone', 'wool', 'grain', 'brick', 'desert',
    'stone', 'lumber', 'grain', 'lumber',
    'brick', 'wool', 'lumber',
  ],
  numbers: [
    '10', '8', '3',
    '9', '5', '4', '6',
    '12', '6', '11', '9', '7',
    '11', '3', '10', '2',
    '4', '8', '5',
  ],
} as const
