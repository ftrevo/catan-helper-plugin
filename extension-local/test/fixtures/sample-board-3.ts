/**
 * Ground truth for the `colonist-board-3-*.png` captures: one bots game (2026-09-12) captured at four
 * viewport sizes and pixel densities, read off the 1920x1080 capture by hand. Tile 8 is the desert.
 * Three settlements and roads were already placed, overlapping tiles 0/1, 12/13 and 13/14.
 */
export const SAMPLE_BOARD_3 = {
  resources: [
    'stone', 'brick', 'lumber',
    'wool', 'grain', 'stone', 'lumber',
    'lumber', 'desert', 'wool', 'grain', 'brick',
    'wool', 'stone', 'brick', 'grain',
    'lumber', 'wool', 'grain',
  ],
  numbers: [
    '8', '4', '11',
    '10', '3', '6', '12',
    '5', '7', '11', '5', '9',
    '2', '9', '4', '10',
    '6', '3', '8',
  ],
} as const
