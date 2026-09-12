import { describe, expect, test } from 'vitest'
import { EDGES, EDGE_COUNT, TILE_EDGES, VERTEX_EDGES, edgeIdOf } from './edges'

describe('edges', () => {
  test('a standard board has 72 edges', () => {
    expect(EDGE_COUNT).toBe(72)
    expect(new Set(EDGES.map(([a, b]) => `${a}-${b}`)).size).toBe(72)
  })

  test('every vertex touches two or three edges', () => {
    expect(VERTEX_EDGES).toHaveLength(54)
    for (const edges of VERTEX_EDGES) expect([2, 3]).toContain(edges.length)
  })

  test('every tile has six edges, and the top edge of tile 0 links its top and upper-right corners', () => {
    for (const edges of TILE_EDGES) {
      expect(edges).toHaveLength(6)
      expect(edges.every((e) => e >= 0)).toBe(true)
    }
    expect(TILE_EDGES[0]?.[0]).toBe(edgeIdOf(0, 4))
  })
})
