import { describe, expect, test } from 'vitest'
import { TILE_COUNT } from '../domain/board'
import { EDGES } from '../domain/edges'
import {
  BUILDING_PATCH,
  FACE_OFFSET_Y,
  NUMBER_CROP,
  REFERENCE_SPACING,
  RESOURCE_CROP,
  TILE_OFFSETS,
  cropRect,
  edgeCenters,
  patchRect,
  tileCenters,
  vertexCenters,
} from './layout'

describe('TILE_OFFSETS', () => {
  test('describes a 3-4-5-4-3 hex grid centred on tile 9', () => {
    expect(TILE_OFFSETS).toHaveLength(TILE_COUNT)
    expect(TILE_OFFSETS[9]).toEqual({ x: 0, y: 0 })
    expect(TILE_OFFSETS[0]).toEqual({ x: -1, y: -Math.sqrt(3) })
    expect(TILE_OFFSETS[7]?.x).toBe(-2)
    expect(TILE_OFFSETS[18]).toEqual({ x: 1, y: Math.sqrt(3) })
  })

  test('neighbouring tiles are exactly one spacing apart', () => {
    const [a, b, c] = [TILE_OFFSETS[0], TILE_OFFSETS[1], TILE_OFFSETS[4]]
    expect(Math.hypot(a!.x - b!.x, a!.y - b!.y)).toBeCloseTo(1)
    expect(Math.hypot(a!.x - c!.x, a!.y - c!.y)).toBeCloseTo(1)
  })
})

describe('cropRect', () => {
  test('reproduces the original backend crops at the reference spacing', () => {
    // Token of the first tile in the middle row of the original sample sits at (780, 699).
    const center = { x: 780, y: 699 }
    const number = cropRect(center, NUMBER_CROP, REFERENCE_SPACING)
    expect([number.x, number.y, number.width, number.height].map(Math.round)).toEqual([750, 665, 64, 70])

    const resource = cropRect(center, RESOURCE_CROP, REFERENCE_SPACING)
    expect([resource.x, resource.y, resource.width, resource.height].map(Math.round)).toEqual([745, 578, 80, 64])
  })

  test('scales with the spacing', () => {
    const rect = cropRect({ x: 1000, y: 1000 }, NUMBER_CROP, REFERENCE_SPACING / 2)
    expect(rect.width).toBe(32)
    expect(rect.height).toBe(35)
  })

  test('tile centres follow the geometry', () => {
    const centers = tileCenters({ center: { x: 100, y: 200 }, spacing: 10 })
    expect(centers[9]).toEqual({ x: 100, y: 200 })
    expect(centers[10]).toEqual({ x: 110, y: 200 })
    expect(centers[0]?.y).toBeCloseTo(200 - 10 * Math.sqrt(3))
  })
})

describe('piece geometry', () => {
  const geometry = { center: { x: 1000, y: 1000 }, spacing: 100 }

  test('vertex 8 (shared by tiles 0, 1 and 4) sits between them, above the token row', () => {
    const v = vertexCenters(geometry)
    expect(v).toHaveLength(54)
    // Tile 0 is at (-1, -sqrt3) spacings; its lower-right corner is half a spacing right, sqrt3/6 down, then the face offset.
    expect(v[8]?.x).toBeCloseTo(1000 - 100 + 50)
    expect(v[8]?.y).toBeCloseTo(1000 - Math.sqrt(3) * 100 + (100 / Math.sqrt(3)) * 0.5 + FACE_OFFSET_Y * 100)
  })

  test('edge midpoints lie halfway between their vertices', () => {
    const v = vertexCenters(geometry)
    const e = edgeCenters(geometry)
    expect(e).toHaveLength(72)
    const [a, b] = EDGES[0] as [number, number]
    expect(e[0]?.x).toBeCloseTo(((v[a]?.x ?? 0) + (v[b]?.x ?? 0)) / 2)
  })

  test('patches scale with the spacing', () => {
    const rect = patchRect({ x: 50, y: 50 }, BUILDING_PATCH, 100)
    expect(rect.width).toBeCloseTo(42)
    expect(rect.x).toBeCloseTo(29)
  })
})
