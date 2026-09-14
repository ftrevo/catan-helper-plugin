/**
 * Debug/calibration helper for classification B: dumps the raw template scores behind a decision.
 *
 *   CLASSIFY_B_LIB=1 node --import tsx src/classify-b-calibrate.ts vertex <game>/<capture> <vertex...>
 *   CLASSIFY_B_LIB=1 node --import tsx src/classify-b-calibrate.ts robber <game>/<capture>
 *   CLASSIFY_B_LIB=1 node --import tsx src/classify-b-calibrate.ts overlay <game>/<capture>
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { vertexCenters } from '../../extension-local/src/vision/layout.ts'
import { findMerchant, findOverlays, findRobber, loadImg, scoreVertex } from './classify-b.ts'
import { GAMES_DIR } from './registry.ts'

const [mode, target, ...rest] = process.argv.slice(2)
const [game, capture] = target!.split('/')
const dir = resolve(GAMES_DIR, game!)
const readingFile = readdirSync(dir).find((f) => f.startsWith(capture!) && f.endsWith('.reading.json'))!
const reading = JSON.parse(readFileSync(resolve(dir, readingFile), 'utf8')) as {
  location: { center: { x: number; y: number }; spacing: number }
}
const img = await loadImg(resolve(dir, readingFile.replace(/\.reading\.json$/, '.png')))
const geometry = reading.location

if (mode === 'vertex') {
  const vertices = vertexCenters(geometry)
  for (const v of rest.map(Number)) {
    const s = scoreVertex(img, vertices[v]!.x, vertices[v]!.y, geometry.spacing)
    const top = (r: Record<string, number>, n = 4) =>
      Object.entries(r)
        .sort((a, b) => a[1] - b[1])
        .slice(0, n)
        .map(([k, x]) => `${k}=${x.toFixed(1)}`)
        .join(' ')
    console.log(`v${v} offset=${JSON.stringify(s.offset)}`)
    console.log(`  settlement ${top(s.settlement)}`)
    console.log(`  city       ${top(s.city)}`)
    console.log(`  cityWall   ${top(s.cityWall)}`)
    console.log(`  tower      ${top(s.tower, 3)}`)
    console.log(`  knight     ${top(s.knight, 5)}`)
  }
} else if (mode === 'robber') {
  const r = findRobber(img, geometry)
  console.log(
    JSON.stringify({ tile: r.tile, score: r.score, runnerUp: r.runnerUpScore, sprite: r.sprite, reason: r.reason })
  )
  console.log(
    r.all
      .slice()
      .sort((a, b) => (a.score ?? 1e9) - (b.score ?? 1e9))
      .map((t) => `t${t.tile}=${t.score}`)
      .join(' ')
  )
} else if (mode === 'merchant') {
  const r = findMerchant(img, geometry)
  console.log(
    JSON.stringify({ tile: r.tile, colour: r.colour, score: r.score, runnerUp: r.runnerUpScore, reason: r.reason })
  )
  console.log(
    r.all
      .slice()
      .sort((a, b) => (a.score ?? 1e9) - (b.score ?? 1e9))
      .slice(0, 6)
      .map((t) => `t${t.tile}=${t.score}(${t.sprite})`)
      .join(' ')
  )
} else if (mode === 'robberscan') {
  // Wide search for the robber sprite around a tile centre, over a range of scales, to measure where and
  // how big the game actually draws it.
  const { tileCenters } = await import('../../extension-local/src/vision/layout.ts')
  const { Atlas, drawSprite } = await import('../../training/src/atlas.ts')
  const { createRequire } = await import('node:module')
  const { TRAINING_DIR } = await import('./paths.ts')
  const { createCanvas } = createRequire(resolve(TRAINING_DIR, 'src/atlas.ts'))(
    '@napi-rs/canvas'
  ) as typeof import('@napi-rs/canvas')
  const atlas = await Atlas.load()
  const centers = tileCenters(geometry)
  const sprite = rest[1] ?? 'icon_robber'
  const s = atlas.get(sprite)
  for (const tile of [Number(rest[0])]) {
    const c = centers[tile]!
    let best = { score: Infinity, dx: 0, dy: 0, h: 0 }
    for (let h = 0.3; h <= 0.75; h += 0.025) {
      const scale = (h * geometry.spacing) / s.sourceSize.h
      const size = Math.ceil(Math.max(s.sourceSize.w, s.sourceSize.h) * scale) + 2
      const cv = createCanvas(size, size)
      const ctx = cv.getContext('2d')
      drawSprite(ctx, s, size / 2, size / 2, scale)
      const t = ctx.getImageData(0, 0, size, size).data
      for (let dy = -Math.round(geometry.spacing * 0.6); dy <= Math.round(geometry.spacing * 0.6); dy += 2)
        for (let dx = -Math.round(geometry.spacing * 0.6); dx <= Math.round(geometry.spacing * 0.6); dx += 2) {
          let err = 0,
            n = 0
          for (let y = 0; y < size; y += 2)
            for (let x = 0; x < size; x += 2) {
              const o = (y * size + x) * 4
              if (t[o + 3]! < 200) continue
              const ix = Math.round(c.x + dx - size / 2 + x),
                iy = Math.round(c.y + dy - size / 2 + y)
              if (ix < 0 || iy < 0 || ix >= img.width || iy >= img.height) {
                n = 0
                break
              }
              const io = (iy * img.width + ix) * 4
              err +=
                Math.abs(img.data[io]! - t[o]!) +
                Math.abs(img.data[io + 1]! - t[o + 1]!) +
                Math.abs(img.data[io + 2]! - t[o + 2]!)
              n++
            }
          if (!n) continue
          const sc = err / (n * 3)
          if (sc < best.score) best = { score: sc, dx, dy, h }
        }
    }
    console.log(
      `tile ${tile} ${sprite}: score=${best.score.toFixed(1)} dx=${(best.dx / geometry.spacing).toFixed(3)} dy=${(best.dy / geometry.spacing).toFixed(3)} height=${best.h.toFixed(3)} spacings`
    )
  }
} else if (mode === 'overlay') {
  console.log(JSON.stringify(findOverlays(img, geometry), null, 2))
}
