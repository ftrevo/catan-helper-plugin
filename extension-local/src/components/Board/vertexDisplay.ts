/**
 * Vertex value bands, in producing pips.
 * 13+: best settlement spots, 10-12: good, 7-9: medium, below 7: poor.
 */
export const VERTEX_BANDS = [
  { minimum: 13, level: 3, label: '13+' },
  { minimum: 10, level: 2, label: '10–12' },
  { minimum: 7, level: 1, label: '7–9' },
  { minimum: -Infinity, level: 0, label: '< 7' },
] as const

export const vertexLevel = (value: number): number => VERTEX_BANDS.find((band) => value >= band.minimum)?.level ?? 0

/** Whole pips stay whole ("12"); weighted values show one decimal ("12.9"). */
export const formatVertexValue = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '')
