import { describe, expect, test } from 'vitest'
import { formatVertexValue } from './vertexDisplay'

describe('formatVertexValue', () => {
  test('keeps whole pips whole and trims weighted values to one decimal', () => {
    expect(formatVertexValue(12)).toBe('12')
    expect(formatVertexValue(12.94)).toBe('12.9')
    expect(formatVertexValue(7.25)).toBe('7.3')
    expect(formatVertexValue(9.04)).toBe('9')
    expect(formatVertexValue(0)).toBe('0')
  })
})
