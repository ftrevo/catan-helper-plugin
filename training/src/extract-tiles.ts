/**
 * Cuts hex-shaped tile sprites out of a large board render captured from the game, so synthetic boards
 * can be composed from tiles exactly as colonist.io draws them (background, border and artwork).
 *
 *   node --import tsx src/extract-tiles.ts <board.png> <resource=tileIndex> ... [--mirror-desert]
 *
 * Tile indices follow the extension's position order (row by row). The output goes to
 * assets/rendered/tile_<resource>.png with transparent corners outside the hexagon.
 */
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { RESOURCES, type Resource, isResource } from '../../extension-local/src/domain/board.ts'
import { locateBoard } from '../../extension-local/src/vision/boardLocator.ts'
import { tileCenters } from '../../extension-local/src/vision/layout.ts'
import { type RgbaImage } from '../../extension-local/src/vision/pixels.ts'
import { RENDERED_DIR } from './paths.ts'
import { FACE_OFFSET_Y, ROBBER_REGION, TILE_SPRITE_SIZE, TOKEN_PATCH_RADIUS } from './tile-geometry.ts'

const [, , input, ...rest] = process.argv
if (!input) throw new Error('usage: extract-tiles <board.png> resource=index ...')
const picks = new Map<Resource, number>()
for (const arg of rest) {
  const [resource, index] = arg.split('=')
  if (resource && isResource(resource) && index) picks.set(resource, Number(index))
}
for (const r of RESOURCES) if (!picks.has(r)) throw new Error(`missing tile index for ${r}`)

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const image: RgbaImage = {
  width: info.width,
  height: info.height,
  data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
}
const located = locateBoard(image)
const centers = tileCenters(located)
const { spacing } = located
console.log(`board spacing ${spacing.toFixed(1)} px, ${located.tokensFound} tokens`)

/**
 * Cuts the hexagon (flat-to-flat width = spacing, i.e. face plus half the shared border) around the face
 * centre into a square RGBA sprite. `cx, cy` is the token centre; the face sits FACE_OFFSET_Y above it.
 */
const cutHex = (tokenX: number, tokenY: number, mirror: boolean): RgbaImage => {
  const cx = tokenX
  const cy = tokenY + FACE_OFFSET_Y * spacing
  const size = Math.ceil(spacing * TILE_SPRITE_SIZE)
  const half = size / 2
  const radius = spacing / Math.sqrt(3)
  const out = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - half
      const dy = y + 0.5 - half
      // Pointy-top hex membership: |dx| <= spacing/2 and |dy| <= radius - |dx| / sqrt(3)
      const inside = Math.abs(dx) <= spacing / 2 - 0.5 && Math.abs(dy) <= radius - Math.abs(dx) / Math.sqrt(3) - 0.5
      if (!inside) continue
      const sx = Math.round(cx + (mirror ? -dx : dx))
      const sy = Math.round(cy + dy)
      const src = (sy * image.width + sx) * 4
      const dst = (y * size + x) * 4
      out[dst] = image.data[src] ?? 0
      out[dst + 1] = image.data[src + 1] ?? 0
      out[dst + 2] = image.data[src + 2] ?? 0
      out[dst + 3] = 255
    }
  }
  return { width: size, height: size, data: out }
}

/**
 * Every producing tile carries a number token at its centre. Paint it over with the tile's own shade so
 * the renderer can place any token there later. The patch is hidden under a token in real captures.
 */
const removeToken = (sprite: RgbaImage): void => {
  const half = sprite.width / 2
  const tokenY = half - FACE_OFFSET_Y * spacing
  const tokenRadius = TOKEN_PATCH_RADIUS * spacing
  const samples: number[][] = []
  for (let y = 0; y < sprite.height; y++)
    for (let x = 0; x < sprite.width; x++) {
      const d = Math.hypot(x + 0.5 - half, y + 0.5 - tokenY)
      const i = (y * sprite.width + x) * 4
      if (d > tokenRadius && d < tokenRadius * 1.3 && (sprite.data[i + 3] ?? 0) > 0)
        samples.push([sprite.data[i] ?? 0, sprite.data[i + 1] ?? 0, sprite.data[i + 2] ?? 0])
    }
  const median = (k: number) => samples.map((s) => s[k] ?? 0).sort((a, b) => a - b)[Math.floor(samples.length / 2)] ?? 0
  const fill = [median(0), median(1), median(2)]
  for (let y = 0; y < sprite.height; y++)
    for (let x = 0; x < sprite.width; x++) {
      const d = Math.hypot(x + 0.5 - half, y + 0.5 - tokenY)
      if (d >= tokenRadius) continue
      const i = (y * sprite.width + x) * 4
      sprite.data[i] = fill[0] ?? 0
      sprite.data[i + 1] = fill[1] ?? 0
      sprite.data[i + 2] = fill[2] ?? 0
    }
}

await mkdir(RENDERED_DIR, { recursive: true })
for (const [resource, index] of picks) {
  const c = centers[index]
  if (!c) throw new Error(`no tile ${index}`)
  const sprite = cutHex(c.x, c.y, false)
  if (resource !== 'desert') removeToken(sprite)
  await sharp(Buffer.from(sprite.data.buffer), { raw: { width: sprite.width, height: sprite.height, channels: 4 } })
    .png()
    .toFile(`${RENDERED_DIR}/tile_${resource}.png`)
  console.log(`tile_${resource}.png from tile ${index} (${sprite.width}px)`)
  if (resource === 'desert') {
    // The robber stands left of centre on the desert at game start; paint it over with the sand shade
    // sampled from the mirrored position on the right, column by column, so the gradient is preserved.
    const clean = cutHex(c.x, c.y, false)
    const cx = clean.width / 2
    const cy = clean.height / 2 - FACE_OFFSET_Y * spacing
    for (let y = 0; y < clean.height; y++)
      for (let x = 0; x < clean.width; x++) {
        const dx = (x + 0.5 - cx) / spacing
        const dy = (y + 0.5 - cy) / spacing
        const inRobber =
          dx > ROBBER_REGION.minX && dx < ROBBER_REGION.maxX && dy > ROBBER_REGION.minY && dy < ROBBER_REGION.maxY
        if (!inRobber) continue
        const src = (y * clean.width + Math.round(clean.width - 1 - x)) * 4
        const dst = (y * clean.width + x) * 4
        clean.data.set(clean.data.subarray(src, src + 4), dst)
      }
    await sharp(Buffer.from(clean.data.buffer), { raw: { width: clean.width, height: clean.height, channels: 4 } })
      .png()
      .toFile(`${RENDERED_DIR}/tile_desert_clean.png`)
    console.log('tile_desert_clean.png (robber side mirrored away)')
  }
}
