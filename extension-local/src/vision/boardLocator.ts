import { TILE_COUNT } from '../domain/board'
import { BoardNotFoundError } from './errors'
import { type BoardGeometry, TILE_OFFSETS, vertexCenters } from './layout'
import { type Point, type RgbaImage } from './pixels'

/**
 * Finds the board in a screenshot by looking for the number tokens: near-white discs whose diameter is
 * roughly 0.38 of the tile spacing and whose centres form a regular hexagonal lattice. Ships, harbour
 * labels and UI elements may pass the colour and shape filters but never all sit on the same lattice.
 */

export type LocatedBoard = BoardGeometry & {
  /** How many of the 18 tokens (the desert has none) matched the fitted lattice. */
  readonly tokensFound: number
  /**
   * Token-sized discs near the board that are not on any of the 19 slots. A standard board has none or
   * one (a knight badge); larger maps show many, since only part of them fits the lattice.
   */
  readonly extraTokens: number
}

type Blob = {
  readonly area: number
  readonly width: number
  readonly height: number
  readonly center: Point
}

/** A pixel is "token white" when it is bright and nearly grey. */
const WHITE_MIN_CHANNEL = 200
const WHITE_MAX_CHROMA = 40

const BLOB_MIN_SIZE = 20
const BLOB_MAX_SIZE = 200
const BLOB_MIN_ASPECT = 0.8
const BLOB_MAX_ASPECT = 1.25
/** Tokens are discs with dark digits punched out, so they fill 65-85% of their bounding box. */
const BLOB_MIN_FILL = 0.55

/** Token diameter relative to the tile spacing, with generous tolerance. */
const TOKEN_DIAMETER_MIN = 0.28
const TOKEN_DIAMETER_MAX = 0.48

/** A token counts as matching a lattice slot when it lies within this fraction of the spacing. */
const MATCH_TOLERANCE = 0.2
/**
 * A stray disc this close to a board vertex is a white player's building, not a token: the tokens of a
 * larger map sit at tile centres, which are at least 0.57 spacing from any vertex.
 */
const VERTEX_TOLERANCE = 0.2
const MIN_TOKENS = 12
const MAX_TOKENS = TILE_COUNT - 1

const findWhiteBlobs = (image: RgbaImage): Blob[] => {
  const { width, height, data } = image
  const pixelCount = width * height
  /** 0 = not white, 1 = white and unvisited, 2 = visited. */
  const mask = new Uint8Array(pixelCount)

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4] ?? 0
    const g = data[i * 4 + 1] ?? 0
    const b = data[i * 4 + 2] ?? 0
    const min = Math.min(r, g, b)
    const max = Math.max(r, g, b)
    if (min > WHITE_MIN_CHANNEL && max - min < WHITE_MAX_CHROMA) mask[i] = 1
  }

  const blobs: Blob[] = []
  const stack: number[] = []

  for (let seed = 0; seed < pixelCount; seed++) {
    if (mask[seed] !== 1) continue

    let area = 0
    let sumX = 0
    let sumY = 0
    let minX = width
    let maxX = 0
    let minY = height
    let maxY = 0

    mask[seed] = 2
    stack.push(seed)

    while (stack.length > 0) {
      const index = stack.pop() as number
      const x = index % width
      const y = (index - x) / width

      area++
      sumX += x
      sumY += y
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y

      const neighbours = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width]
      for (const n of neighbours) {
        if (n >= 0 && n < pixelCount && mask[n] === 1) {
          mask[n] = 2
          stack.push(n)
        }
      }
    }

    blobs.push({
      area,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      center: { x: sumX / area, y: sumY / area },
    })
  }

  return blobs
}

const looksLikeToken = (blob: Blob): boolean => {
  const aspect = blob.width / blob.height
  const fill = blob.area / (blob.width * blob.height)
  return (
    blob.width >= BLOB_MIN_SIZE &&
    blob.width <= BLOB_MAX_SIZE &&
    blob.height >= BLOB_MIN_SIZE &&
    blob.height <= BLOB_MAX_SIZE &&
    aspect >= BLOB_MIN_ASPECT &&
    aspect <= BLOB_MAX_ASPECT &&
    fill >= BLOB_MIN_FILL
  )
}

const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

/** Sea and shallow water are distinctly blue; every tile colour has at least as much red or green as blue. */
const isSea = (r: number, g: number, b: number): boolean => b > r + 40 && b > g + 10

/** Share of sample points on a circle around `center` that show sea. */
const seaFraction = (image: RgbaImage, center: Point, radius: number): number => {
  const samples = 16
  let sea = 0
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * 2 * Math.PI
    const x = Math.round(center.x + Math.cos(angle) * radius)
    const y = Math.round(center.y + Math.sin(angle) * radius)
    if (x < 0 || y < 0 || x >= image.width || y >= image.height) continue
    const o = (y * image.width + x) * 4
    if (isSea(image.data[o] ?? 0, image.data[o + 1] ?? 0, image.data[o + 2] ?? 0)) sea++
  }
  return sea / samples
}

/**
 * Adjacent tokens are exactly one spacing apart, so the spacing is a typical nearest-neighbour distance.
 * Other white discs (Cities & Knights knight badges, harbour labels) sit closer to a token than a spacing
 * and drag a plain median down, so several quantiles are tried and the lattice fit picks the winner.
 */
const spacingCandidates = (centers: readonly Point[]): number[] => {
  const nearest = centers
    .map((c) => Math.min(...centers.filter((other) => other !== c).map((other) => distance(c, other))))
    .sort((a, b) => a - b)
  const quantile = (q: number) => nearest[Math.min(nearest.length - 1, Math.floor(q * nearest.length))] ?? 0
  const raw = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].flatMap((q) => [quantile(q), quantile(q) * 2])
  const distinct: number[] = []
  for (const value of raw.sort((a, b) => a - b)) {
    if (value > 0 && !distinct.some((d) => Math.abs(d - value) / value < 0.05)) distinct.push(value)
  }
  return distinct
}

type Fit = { geometry: BoardGeometry; matches: Array<{ token: Point; offset: Point }> }

/** Assigns tokens to lattice slots for a hypothesised geometry; each slot takes at most one token. */
const matchLattice = (tokens: readonly Point[], geometry: BoardGeometry): Fit => {
  const tolerance = geometry.spacing * MATCH_TOLERANCE
  const taken = new Set<Point>()
  const matches: Fit['matches'] = []

  for (const offset of TILE_OFFSETS) {
    const expected = {
      x: geometry.center.x + offset.x * geometry.spacing,
      y: geometry.center.y + offset.y * geometry.spacing,
    }
    let best: Point | undefined
    let bestDistance = tolerance
    for (const token of tokens) {
      if (taken.has(token)) continue
      const d = distance(token, expected)
      if (d < bestDistance) {
        best = token
        bestDistance = d
      }
    }
    if (best) {
      taken.add(best)
      matches.push({ token: best, offset })
    }
  }

  return { geometry, matches }
}

/** Least-squares refinement of centre and spacing from matched tokens. */
const refine = (fit: Fit): BoardGeometry => {
  const { matches } = fit
  let { center, spacing } = fit.geometry

  for (let iteration = 0; iteration < 3; iteration++) {
    center = {
      x: matches.reduce((sum, m) => sum + m.token.x - m.offset.x * spacing, 0) / matches.length,
      y: matches.reduce((sum, m) => sum + m.token.y - m.offset.y * spacing, 0) / matches.length,
    }
    const numerator = matches.reduce(
      (sum, m) => sum + (m.token.x - center.x) * m.offset.x + (m.token.y - center.y) * m.offset.y,
      0
    )
    const denominator = matches.reduce((sum, m) => sum + m.offset.x ** 2 + m.offset.y ** 2, 0)
    if (denominator > 0) spacing = numerator / denominator
  }

  return { center, spacing }
}

export const locateBoard = (image: RgbaImage): LocatedBoard => {
  const candidates = findWhiteBlobs(image).filter(looksLikeToken)
  if (candidates.length < MIN_TOKENS) {
    throw new BoardNotFoundError(`only ${candidates.length} token-like shapes found`)
  }

  // For each plausible spacing, keep only discs of token size, then hypothesise every centre at which one
  // of them sits on a lattice slot: the centre tile itself may carry no token (the desert, the robber or a
  // card sprite on it). The hypothesis explaining the most tokens wins across all spacings; ties go to the
  // centre nearest the tokens' centroid, since a lattice shifted by a tile can explain as many tokens.
  let best: { fit: Fit; tokens: Point[]; offCentre: number } | undefined
  for (const roughSpacing of spacingCandidates(candidates.map((c) => c.center))) {
    const tokens = candidates
      .filter((c) => {
        const diameter = (c.width + c.height) / 2 / roughSpacing
        return diameter >= TOKEN_DIAMETER_MIN && diameter <= TOKEN_DIAMETER_MAX
      })
      .map((c) => c.center)
    const centroid = {
      x: tokens.reduce((sum, t) => sum + t.x, 0) / tokens.length,
      y: tokens.reduce((sum, t) => sum + t.y, 0) / tokens.length,
    }
    for (const token of tokens) {
      for (const slot of TILE_OFFSETS) {
        const center = { x: token.x - slot.x * roughSpacing, y: token.y - slot.y * roughSpacing }
        const fit = matchLattice(tokens, { center, spacing: roughSpacing })
        const offCentre = distance(center, centroid)
        if (
          !best ||
          fit.matches.length > best.fit.matches.length ||
          (fit.matches.length === best.fit.matches.length && offCentre < best.offCentre)
        ) {
          best = { fit, tokens, offCentre }
        }
      }
    }
  }

  if (!best || best.fit.matches.length < MIN_TOKENS) {
    throw new BoardNotFoundError(`best lattice fit explains ${best?.fit.matches.length ?? 0} of ${MAX_TOKENS} tokens`)
  }

  const refined = refine(best.fit)
  // Re-match with the refined geometry: the desert or a covered token may now be resolved correctly.
  const finalFit = matchLattice(best.tokens, refined)
  const geometry = refine(finalFit)

  // Stray discs: token-sized, not on a slot, near the board, standing on land and not on a vertex.
  // Harbour ships are token-sized too, but they float on the sea; white settlements and cities pass the
  // colour filter, but they stand on vertices.
  const matched = new Set(finalFit.matches.map((m) => m.token))
  const vertices = vertexCenters(geometry)
  const extraTokens = best.tokens.filter(
    (t) =>
      !matched.has(t) &&
      distance(t, geometry.center) < geometry.spacing * 4 &&
      seaFraction(image, t, geometry.spacing * 0.3) < 0.5 &&
      !vertices.some((v) => distance(t, v) < geometry.spacing * VERTEX_TOLERANCE)
  ).length

  return { ...geometry, tokensFound: Math.min(finalFit.matches.length, MAX_TOKENS), extraTokens }
}
