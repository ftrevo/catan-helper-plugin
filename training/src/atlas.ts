/**
 * Reads the TexturePacker-style atlases and exposes named sprites that can be drawn on a canvas.
 * Sprites are drawn around their anchor (always the centre of the untrimmed source frame) so that a
 * tile placed at a tile centre lands exactly where the game puts it.
 */
import { readFile, readdir } from 'node:fs/promises'
import { type Image, type SKRSContext2D, loadImage } from '@napi-rs/canvas'
import sharp from 'sharp'
import { ASSETS_DIR } from './paths.ts'

type Frame = {
  frame: { x: number; y: number; w: number; h: number }
  spriteSourceSize: { x: number; y: number; w: number; h: number }
  sourceSize: { w: number; h: number }
}

type AtlasJson = {
  frames: Record<string, Frame> | Array<Frame & { filename: string }>
  meta: { image: string }
}

export type Sprite = Frame & { readonly image: Image; readonly name: string }

export class Atlas {
  private constructor(private readonly sprites: Map<string, Sprite>) {}

  static async load(dir = ASSETS_DIR): Promise<Atlas> {
    const sprites = new Map<string, Sprite>()
    const files = (await readdir(dir)).filter((f) => /^game_spritesheet_\d+\..*\.json$/.test(f))
    if (files.length === 0) throw new Error(`No spritesheets in ${dir}; run "npm run assets" first`)

    for (const file of files) {
      const atlas = JSON.parse(await readFile(`${dir}/${file}`, 'utf8')) as AtlasJson
      // Skia decodes PNG reliably everywhere; convert the WebP sheet once.
      const image = await loadImage(await sharp(`${dir}/${atlas.meta.image}`).png().toBuffer())
      const entries = Array.isArray(atlas.frames)
        ? atlas.frames.map((f) => [f.filename, f] as const)
        : Object.entries(atlas.frames)
      for (const [name, frame] of entries) sprites.set(name, { ...frame, image, name })
    }

    return new Atlas(sprites)
  }

  get(name: string): Sprite {
    const sprite = this.sprites.get(name)
    if (!sprite) throw new Error(`Sprite "${name}" not found in the atlases`)
    return sprite
  }

  has(name: string): boolean {
    return this.sprites.has(name)
  }

  names(pattern: RegExp): string[] {
    return [...this.sprites.keys()].filter((n) => pattern.test(n))
  }
}

/**
 * Draws a sprite with its source frame scaled by `scale`, centred on (cx, cy), optionally rotated.
 * `scale` is pixels per source pixel, so a tile drawn at `spacing / tileSourceWidth` is one tile wide.
 */
export const drawSprite = (
  ctx: SKRSContext2D,
  sprite: Sprite,
  cx: number,
  cy: number,
  scale: number,
  rotation = 0
): void => {
  const { frame, spriteSourceSize, sourceSize } = sprite
  const dx = (spriteSourceSize.x - sourceSize.w / 2) * scale
  const dy = (spriteSourceSize.y - sourceSize.h / 2) * scale

  ctx.save()
  ctx.translate(cx, cy)
  if (rotation !== 0) ctx.rotate(rotation)
  ctx.drawImage(sprite.image, frame.x, frame.y, frame.w, frame.h, dx, dy, frame.w * scale, frame.h * scale)
  ctx.restore()
}
