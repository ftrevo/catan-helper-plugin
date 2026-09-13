/** Runs the extension's capture reader on one stored capture and refreshes its summary in game.json. */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { EXTENSION_DIR } from '../paths.ts'

export type CaptureSummary = {
  file: string
  takenAt?: string
  ok: boolean
  tokens?: number
  buildings: number
  roads: number
  colours: string[]
  reason?: string
}

export type GameMeta = { roomCode: string; captures: CaptureSummary[]; notes: string[] }

type Reading = {
  ok: boolean
  reason?: string
  location?: { tokensFound: number; extraTokens?: number }
  pieces?: { buildings: { colour: string; kind: string }[]; roads: { colour: string }[] }
}

/** A capture counts when the board was found with most tokens and nothing standing outside the lattice. */
export const MIN_TOKENS = 15
export const MAX_EXTRA_TOKENS = 2

export const acceptable = (reading: Reading): boolean =>
  reading.ok &&
  (reading.location?.tokensFound ?? 0) >= MIN_TOKENS &&
  (reading.location?.extraTokens ?? 0) <= MAX_EXTRA_TOKENS

/** Re-reads `capture` in `dir`, rewriting its .reading.json and summary; returns the kinds found, or undefined when the read failed. */
export const rereadCapture = (dir: string, capture: CaptureSummary): Record<string, number> | undefined => {
  const png = resolve(dir, capture.file)
  const json = png.replace(/\.png$/, '.reading.json')
  if (!existsSync(png)) return undefined
  try {
    execFileSync('npx', ['vite-node', 'scripts/read-capture.ts', png, json], {
      cwd: EXTENSION_DIR,
      stdio: 'pipe',
      timeout: 180_000,
    })
  } catch {
    return undefined
  }
  const reading = JSON.parse(readFileSync(json, 'utf8')) as Reading
  const tokens = reading.location?.tokensFound ?? 0
  capture.ok = acceptable(reading)
  capture.tokens = tokens
  capture.buildings = reading.pieces?.buildings.length ?? 0
  capture.roads = reading.pieces?.roads.length ?? 0
  capture.colours = [
    ...new Set([...(reading.pieces?.buildings ?? []), ...(reading.pieces?.roads ?? [])].map((p) => p.colour)),
  ]
  if (capture.ok) delete capture.reason
  else if (reading.reason) capture.reason = reading.reason
  else if (tokens < MIN_TOKENS) capture.reason = `only ${tokens} tokens`
  else capture.reason = `${reading.location?.extraTokens ?? 0} stray tokens: not the base map`
  return (reading.pieces?.buildings ?? []).reduce<Record<string, number>>(
    (acc, b) => ((acc[b.kind] = (acc[b.kind] ?? 0) + 1), acc),
    {}
  )
}
