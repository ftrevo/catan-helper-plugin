import { type Building, type Pieces, type PlayerColour, type Road, isPlayerColour } from '../domain/pieces'
import { type ModelSource, TileClassifier } from './classifier'
import { BUILDING_LABELS, type BuildingLabel, ROAD_LABELS, type RoadLabel } from './labels'
import { BUILDING_PATCH, type BoardGeometry, ROAD_PATCH, edgeCenters, patchRect, vertexCenters } from './layout'
import { type RgbaImage, cropAndResize, rectFitsIn } from './pixels'

export type PieceModelSources = {
  readonly buildings: ModelSource
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

const parseBuilding = (label: BuildingLabel): Omit<Building, 'vertex'> | undefined => {
  const [kind, colour] = label.split('_') as [string, string]
  if ((kind !== 'settlement' && kind !== 'city') || !isPlayerColour(colour)) return undefined
  return { kind, colour: colour as PlayerColour }
}

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
  const [buildings, roads] = await Promise.all([
    TileClassifier.load('building', sources.buildings, BUILDING_LABELS),
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

      const [buildingPredictions, roadPredictions] = await Promise.all([
        buildings.predict(crop(vertexCenters(geometry), BUILDING_PATCH)),
        roads.predict(crop(edgeCenters(geometry), ROAD_PATCH)),
      ])

      const found: Building[] = []
      const foundRoads: Road[] = []
      let minConfidence = 1

      buildingPredictions.forEach((p, vertex) => {
        if (p.label === 'none' || p.confidence < MIN_CONFIDENCE) return
        const parsed = parseBuilding(p.label)
        if (!parsed) return
        found.push({ vertex, ...parsed })
        minConfidence = Math.min(minConfidence, p.confidence)
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
      buildings.dispose()
      roads.dispose()
    },
  }
}
