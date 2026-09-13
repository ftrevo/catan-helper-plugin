/**
 * Games the focus worker returns to. Persisted in examples/revisit.json so a restart resumes the visits;
 * only the focus worker process writes it, so no lock is needed, but every write must go through
 * modifyQueue because its two loops interleave.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { EXAMPLES_DIR } from './paths.ts'

export type Revisit = {
  roomCode: string
  url: string
  /** Game folder under examples/games. */
  dir: string
  seats: string[]
  wanted: string[]
  agent: string
  addedAt: string
  nextVisitAt: string
  visits: number
  maxVisits: number
  /** Consecutive visits that could not reach the game; the entry is dropped after a few. */
  failures: number
}

export const REVISIT_FILE = resolve(EXAMPLES_DIR, 'revisit.json')

export const loadQueue = (): Revisit[] =>
  existsSync(REVISIT_FILE) ? (JSON.parse(readFileSync(REVISIT_FILE, 'utf8')) as Revisit[]) : []

export const saveQueue = (queue: Revisit[]): void => writeFileSync(REVISIT_FILE, JSON.stringify(queue, null, 2) + '\n')

export const dueNow = (queue: Revisit[]): Revisit | undefined =>
  queue
    .filter((r) => Date.parse(r.nextVisitAt) <= Date.now())
    .sort((a, b) => a.nextVisitAt.localeCompare(b.nextVisitAt))[0]
