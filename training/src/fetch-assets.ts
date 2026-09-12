/**
 * Downloads the colonist.io game spritesheets (atlas JSON + WebP) into assets/colonist.
 * The file names carry content hashes, so they are discovered from the game's JavaScript bundles
 * on every run instead of being hard-coded. The artwork is colonist.io's and stays out of git.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { ASSETS_DIR } from './paths.ts'

const SITE = 'https://colonist.io/'
const CDN = 'https://cdn.colonist.io/dist/assets/'

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return response.text()
}

const download = async (name: string): Promise<void> => {
  const response = await fetch(CDN + name)
  if (!response.ok) throw new Error(`${CDN + name}: ${response.status}`)
  await writeFile(`${ASSETS_DIR}/${name}`, Buffer.from(await response.arrayBuffer()))
  console.log('downloaded', name)
}

const main = async () => {
  await mkdir(ASSETS_DIR, { recursive: true })

  const html = await fetchText(SITE)
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => new URL(m[1] ?? '', SITE).href)
  const atlasNames = new Set<string>()
  for (const script of scripts) {
    const source = await fetchText(script).catch(() => '')
    for (const m of source.matchAll(/game_spritesheet_\d+\.[0-9a-f]+\.json/g)) atlasNames.add(m[0])
  }
  if (atlasNames.size === 0) throw new Error('No game_spritesheet_*.json referenced by the site scripts')

  for (const atlasName of atlasNames) {
    await download(atlasName)
    const atlas = JSON.parse(await fetchText(CDN + atlasName)) as { meta: { image: string } }
    await download(atlas.meta.image)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
