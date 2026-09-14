import { type Building, type Pieces, type PlayerColour, type Road, isPlayerColour } from '../domain/pieces'
import { type ModelSource, TileClassifier } from './classifier'
import { BUILDING_KIND_LABELS, COLOUR_LABELS, ROAD_LABELS, type RoadLabel } from './labels'
import { BUILDING_PATCH, type BoardGeometry, ROAD_PATCH, edgeCenters, patchRect, vertexCenters } from './layout'
import { type RgbaImage, cropAndResize, rectFitsIn } from './pixels'

export type PieceModelSources = {
  /** Vertex patch → kind (none, settlement, city, metropolis, knight). */
  readonly buildings: ModelSource
  /** Vertex patch holding a piece → player colour. */
  readonly colours: ModelSource
  /** Edge patch → none or road colour. */
  readonly roads: ModelSource
}

export type PieceReading = {
  readonly pieces: Pieces
  /** Lowest confidence among the accepted pieces, 1 when there are none. */
  readonly minConfidence: number
}

export type PieceReader = {
  read(screenshot: RgbaImage, geometry: BoardGeometry): Promise<PieceReading>
  dispose(): void
}

/** Below this the classifier's guess is treated as an empty spot rather than a piece. */
const MIN_CONFIDENCE = 0.6

const parseRoad = (label: RoadLabel): Omit<Road, 'edge'> | undefined => {
  const [kind, colour] = label.split('_') as [string, string]
  if (kind !== 'road' || !isPlayerColour(colour)) return undefined
  return { colour: colour as PlayerColour }
}

/**
 * Reads settlements, cities and roads: a square patch around every vertex and every edge midpoint,
 * classified in two batched inferences. Patches that leave the screenshot are treated as empty.
 */
export const createPieceReader = async (sources: PieceModelSources): Promise<PieceReader> => {
  const [kinds, colours, roads] = await Promise.all([
    TileClassifier.load('building kind', sources.buildings, BUILDING_KIND_LABELS),
    TileClassifier.load('piece colour', sources.colours, COLOUR_LABELS),
    TileClassifier.load('road', sources.roads, ROAD_LABELS),
  ])

  return {
    async read(screenshot, geometry) {
      const blank = (spec: typeof BUILDING_PATCH): RgbaImage => ({
        width: spec.size,
        height: spec.size,
        data: new Uint8ClampedArray(spec.size * spec.size * 4),
      })
      const crop = (centers: readonly { x: number; y: number }[], spec: typeof BUILDING_PATCH) =>
        centers.map((c) => {
          const rect = patchRect(c, spec, geometry.spacing)
          return rectFitsIn(rect, screenshot)
            ? cropAndResize(screenshot, rect, { width: spec.size, height: spec.size })
            : blank(spec)
        })

      const vertexPatches = crop(vertexCenters(geometry), BUILDING_PATCH)
      const [kindPredictions, roadPredictions] = await Promise.all([
        kinds.predict(vertexPatches),
        roads.predict(crop(edgeCenters(geometry), ROAD_PATCH)),
      ])

      const found: Building[] = []
      const foundRoads: Road[] = []
      let minConfidence = 1

      // Only patches that hold a piece go to the colour model.
      const occupied = kindPredictions
        .map((p, vertex) => ({ p, vertex }))
        .filter(({ p }) => p.label !== 'none' && p.confidence >= MIN_CONFIDENCE)
      const colourPredictions = await colours.predict(occupied.map(({ vertex }) => vertexPatches[vertex] as RgbaImage))
      occupied.forEach(({ p, vertex }, i) => {
        const colour = colourPredictions[i]
        if (!colour || p.label === 'none' || !isPlayerColour(colour.label)) return
        found.push({ vertex, kind: p.label, colour: colour.label as PlayerColour })
        minConfidence = Math.min(minConfidence, p.confidence, colour.confidence)
      })
      roadPredictions.forEach((p, edge) => {
        if (p.label === 'none' || p.confidence < MIN_CONFIDENCE) return
        const parsed = parseRoad(p.label)
        if (!parsed) return
        foundRoads.push({ edge, ...parsed })
        minConfidence = Math.min(minConfidence, p.confidence)
      })

      return { pieces: { buildings: found, roads: foundRoads }, minConfidence }
    },
    dispose() {
      kinds.dispose()
      colours.dispose()
      roads.dispose()
    },
  }
}
