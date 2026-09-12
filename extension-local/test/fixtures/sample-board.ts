/**
 * Ground truth for `colonist-board.png`, produced by the original backend with the corrected
 * 11-class number model. Tile 1 is the desert, which the number model labels "7".
 */
export const SAMPLE_BOARD = {
  resources: [
    'brick', 'desert', 'grain',
    'lumber', 'grain', 'lumber', 'wool',
    'brick', 'wool', 'lumber', 'grain', 'brick',
    'stone', 'stone', 'lumber', 'grain',
    'wool', 'stone', 'wool',
  ],
  numbers: [
    '8', '7', '5',
    '4', '3', '10', '2',
    '11', '6', '11', '9', '6',
    '12', '5', '4', '3',
    '9', '10', '8',
  ],
} as const
