/**
 * Calibration aid: template-matches the atlas building sprites against the labelled test fixtures to
 * measure how the game really draws pieces relative to the tile spacing (scale factor over
 * `spacing / TILE_SOURCE_WIDTH` and anchor offset from the vertex). Feeds PIECE_SCALE and PIECE_ANCHOR_DY in
 * renderer.ts.
 *
 *   npm run measure:pieces
 */
import { createCanvas } from '@napi-rs/canvas'
import { loadPng } from '../../extension-local/test/loadPng.ts'
import { locateBoard } from '../../extension-local/src/vision/boardLocator.ts'
import { vertexCenters } from '../../extension-local/src/vision/layout.ts'
import { FIXTURE_PIECES } from '../../extension-local/test/fixtures/index.ts'
import { Atlas, drawSprite } from './atlas.ts'
const X = '/Users/felipetrevisan/workspace/pessoal/catan-helper-plugin/extension-local'
const atlas = await Atlas.load()
for (const [file, pieces] of Object.entries(FIXTURE_PIECES)) {
  const img = await loadPng(`${X}/${file}`)
  const g = locateBoard(img)
  const centers = vertexCenters(g)
  const nominal = g.spacing / 416
  const render = (name: string, scale: number) => {
    const s = atlas.get(name)
    const size = Math.ceil(Math.max(s.sourceSize.w, s.sourceSize.h) * scale) + 2
    const c = createCanvas(size, size)
    const ctx = c.getContext('2d')
    drawSprite(ctx, s, size / 2, size / 2, scale)
    return { size, data: ctx.getImageData(0, 0, size, size).data }
  }
  const out: string[] = []
  for (const p of pieces.buildings.filter((b) => b.kind !== 'knight').slice(0, 4)) {
    const c = centers[p.vertex]!
    let best = { score: 1e18, scale: 0, dx: 0, dy: 0 }
    const radius = Math.round(g.spacing * 0.12)
    for (let f = 0.7; f <= 1.5; f += 0.025) {
      const scale = nominal * f
      const t = render(`${p.kind}_${p.colour}`, scale)
      for (let dy = -radius; dy <= radius; dy += 1)
        for (let dx = -radius; dx <= radius; dx += 1) {
          let err = 0,
            n = 0
          for (let y = 0; y < t.size; y += 1)
            for (let x = 0; x < t.size; x += 1) {
              const o = (y * t.size + x) * 4
              if (t.data[o + 3]! < 200) continue
              const ix = Math.round(c.x + dx - t.size / 2 + x),
                iy = Math.round(c.y + dy - t.size / 2 + y)
              if (ix < 0 || iy < 0 || ix >= img.width || iy >= img.height) continue
              const io = (iy * img.width + ix) * 4
              err +=
                Math.abs(img.data[io]! - t.data[o]!) +
                Math.abs(img.data[io + 1]! - t.data[o + 1]!) +
                Math.abs(img.data[io + 2]! - t.data[o + 2]!)
              n++
            }
          const score = err / n
          if (score < best.score) best = { score, scale, dx, dy }
        }
    }
    out.push(
      `${p.kind}/${p.colour} scale x${(best.scale / nominal).toFixed(3)} offset ${(best.dx / g.spacing).toFixed(3)},${(best.dy / g.spacing).toFixed(3)} err ${best.score.toFixed(1)}`
    )
  }
  console.log(`${file.split('/').pop()} spacing ${g.spacing.toFixed(1)}\n  ${out.join('\n  ')}`)
}
