/**
 * Turns rendered boards into model inputs using exactly the crop geometry the extension applies at
 * runtime (imported from the extension source), so training and inference never drift apart.
 */
import { type Pieces } from '../../extension-local/src/domain/pieces.ts'
import { BUILDING_KIND_LABELS, COLOUR_LABELS, ROAD_LABELS } from '../../extension-local/src/vision/labels.ts'
import {
  BUILDING_PATCH,
  type BoardGeometry,
  NUMBER_CROP,
  type PatchSpec,
  RESOURCE_CROP,
  ROAD_PATCH,
  cropRect,
  edgeCenters,
  patchRect,
  tileCenters,
  vertexCenters,
} from '../../extension-local/src/vision/layout.ts'
import { type RgbaImage, cropAndResize, rectFitsIn } from '../../extension-local/src/vision/pixels.ts'
import { type Random } from './random.ts'

export type TileCrops = { resources: RgbaImage[]; numbers: RgbaImage[] }

/**
 * Crops all 19 tiles. `jitter` shifts every crop centre by up to that fraction of the spacing to
 * imitate the locator's small errors; pass 0 for exact crops.
 */
export const cropTiles = (image: RgbaImage, geometry: BoardGeometry, jitter: number, random?: Random): TileCrops => {
  const centers = tileCenters(geometry)
  const shifted = centers.map((c) => ({
    x: c.x + (random ? random.range(-jitter, jitter) : 0) * geometry.spacing,
    y: c.y + (random ? random.range(-jitter, jitter) : 0) * geometry.spacing,
  }))

  const crop = (spec: typeof RESOURCE_CROP) =>
    shifted.map((c) => {
      const rect = cropRect(c, spec, geometry.spacing)
      if (!rectFitsIn(rect, image)) throw new Error(`Crop leaves the image at (${rect.x}, ${rect.y})`)
      return cropAndResize(image, rect, spec.size)
    })

  return { resources: crop(RESOURCE_CROP), numbers: crop(NUMBER_CROP) }
}

export type LabelledPatches = { images: RgbaImage[]; labels: number[] }
/** Vertex patches carry two labels: what stands there and, for occupied corners, whose colour it is (-1 when empty). */
export type VertexPatches = { images: RgbaImage[]; kinds: number[]; colours: number[] }

const cropPatch = (
  image: RgbaImage,
  center: { x: number; y: number },
  spec: PatchSpec,
  jitter: number,
  spacing: number,
  random?: Random
) => {
  const c = {
    x: center.x + (random ? random.range(-jitter, jitter) : 0) * spacing,
    y: center.y + (random ? random.range(-jitter, jitter) : 0) * spacing,
  }
  const rect = patchRect(c, spec, spacing)
  if (!rectFitsIn(rect, image)) return undefined
  return cropAndResize(image, rect, { width: spec.size, height: spec.size })
}

/** Vertex and edge patches with their class indices, exactly as the extension's piece reader crops them. */
export const cropPiecePatches = (
  image: RgbaImage,
  geometry: BoardGeometry,
  pieces: Pieces,
  jitter: number,
  random?: Random
): { buildings: VertexPatches; roads: LabelledPatches } => {
  const buildings: VertexPatches = { images: [], kinds: [], colours: [] }
  const roads: LabelledPatches = { images: [], labels: [] }

  vertexCenters(geometry).forEach((c, vertex) => {
    const patch = cropPatch(image, c, BUILDING_PATCH, jitter, geometry.spacing, random)
    if (!patch) return
    const piece = pieces.buildings.find((b) => b.vertex === vertex)
    buildings.images.push(patch)
    buildings.kinds.push((BUILDING_KIND_LABELS as readonly string[]).indexOf(piece?.kind ?? 'none'))
    buildings.colours.push(piece ? (COLOUR_LABELS as readonly string[]).indexOf(piece.colour) : -1)
  })

  edgeCenters(geometry).forEach((c, edge) => {
    const patch = cropPatch(image, c, ROAD_PATCH, jitter, geometry.spacing, random)
    if (!patch) return
    const piece = pieces.roads.find((r) => r.edge === edge)
    const label = piece ? `road_${piece.colour}` : 'none'
    roads.images.push(patch)
    roads.labels.push((ROAD_LABELS as readonly string[]).indexOf(label))
  })

  return { buildings, roads }
}
