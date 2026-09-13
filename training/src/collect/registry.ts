/**
 * Shared registry of spectated games, so parallel workers never watch the same room. Writes go through a
 * lock directory (mkdir is atomic on every filesystem we care about) and the file is rewritten whole.
 */
import { existsSync, mkdirSync, readFileSync, rmdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { TRAINING_DIR } from '../paths.ts'

export const EXAMPLES_DIR = resolve(TRAINING_DIR, '../examples')
export const GAMES_DIR = resolve(EXAMPLES_DIR, 'games')
export const REGISTRY_FILE = resolve(EXAMPLES_DIR, 'registry.json')
export const STOP_FILE = resolve(EXAMPLES_DIR, 'STOP')
const LOCK_DIR = resolve(EXAMPLES_DIR, '.registry.lock')

export type ClaimStatus = 'watching' | 'done' | 'rejected'

export type Claim = {
  roomCode: string
  agent: string
  status: ClaimStatus
  claimedAt: string
  heartbeatAt: string
  finishedAt?: string
  captures?: number
  colours?: string[]
  buildings?: number
  roads?: number
  reason?: string
}

export type Registry = {
  /** Games to collect before workers stop on their own; null means keep going until STOP is created. */
  target: number | null
  claims: Record<string, Claim>
}

/** Claims without a heartbeat for this long are considered abandoned. */
export const STALE_AFTER_MS = 20 * 60 * 1000

const withLock = <T>(fn: () => T): T => {
  const deadline = Date.now() + 30_000
  for (;;) {
    try {
      mkdirSync(LOCK_DIR)
      break
    } catch {
      if (Date.now() > deadline) throw new Error(`registry lock held for over 30 s: ${LOCK_DIR}`)
      const until = Date.now() + 50 + Math.random() * 100
      while (Date.now() < until) {
        /* spin briefly; contention is rare and short */
      }
    }
  }
  try {
    return fn()
  } finally {
    rmdirSync(LOCK_DIR)
  }
}

export const readRegistry = (): Registry => {
  if (!existsSync(REGISTRY_FILE)) return { target: null, claims: {} }
  return JSON.parse(readFileSync(REGISTRY_FILE, 'utf8')) as Registry
}

const writeRegistry = (registry: Registry) => writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2) + '\n')

const isStale = (claim: Claim) =>
  claim.status === 'watching' && Date.now() - Date.parse(claim.heartbeatAt) > STALE_AFTER_MS

/** Games that count towards the target. */
export const doneCount = (registry: Registry = readRegistry()): number =>
  Object.values(registry.claims).filter((c) => c.status === 'done').length

export const shouldStop = (): boolean => {
  if (existsSync(STOP_FILE)) return true
  const { target } = readRegistry()
  return target !== null && doneCount() >= target
}

/** Returns true when this agent now holds the room. A room that is done or rejected can never be claimed again. */
export const claim = (roomCode: string, agent: string): boolean =>
  withLock(() => {
    const registry = readRegistry()
    const existing = registry.claims[roomCode]
    if (existing && !isStale(existing)) return false
    const now = new Date().toISOString()
    registry.claims[roomCode] = { roomCode, agent, status: 'watching', claimedAt: now, heartbeatAt: now }
    writeRegistry(registry)
    return true
  })

export const heartbeat = (roomCode: string, agent: string): void =>
  withLock(() => {
    const registry = readRegistry()
    const c = registry.claims[roomCode]
    if (c && c.agent === agent && c.status === 'watching') {
      c.heartbeatAt = new Date().toISOString()
      writeRegistry(registry)
    }
  })

export const finish = (
  roomCode: string,
  agent: string,
  summary: Pick<Claim, 'captures' | 'colours' | 'buildings' | 'roads'>
): void =>
  withLock(() => {
    const registry = readRegistry()
    const c = registry.claims[roomCode]
    if (!c || c.agent !== agent) return
    Object.assign(c, summary, { status: 'done', finishedAt: new Date().toISOString() })
    writeRegistry(registry)
  })

export const reject = (roomCode: string, agent: string, reason: string): void =>
  withLock(() => {
    const registry = readRegistry()
    const c = registry.claims[roomCode]
    if (!c || c.agent !== agent) return
    Object.assign(c, { status: 'rejected', reason, finishedAt: new Date().toISOString() })
    writeRegistry(registry)
  })

/** Turns a rejected room into a done one, after its captures were re-read successfully. */
export const recover = (roomCode: string, summary: Pick<Claim, 'captures' | 'colours' | 'buildings' | 'roads'>): void =>
  withLock(() => {
    const registry = readRegistry()
    const c = registry.claims[roomCode]
    if (!c || c.status !== 'rejected') return
    delete c.reason
    Object.assign(c, summary, { status: 'done', finishedAt: new Date().toISOString() })
    writeRegistry(registry)
  })

/** Rooms nobody should pick: held, done or rejected. */
export const unavailableRooms = (): Set<string> => {
  const registry = readRegistry()
  return new Set(
    Object.values(registry.claims)
      .filter((c) => !isStale(c))
      .map((c) => c.roomCode)
  )
}
