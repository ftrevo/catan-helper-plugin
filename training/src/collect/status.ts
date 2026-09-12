/**
 * Coordinator view of the collection: progress against the target, per-agent activity, stale claims,
 * colours seen, and a STOP file once the target is reached.
 *
 *   node --import tsx src/collect/status.ts [--stop-at-target]
 */
import { existsSync, writeFileSync } from 'node:fs'
import { STALE_AFTER_MS, STOP_FILE, doneCount, readRegistry } from './registry.ts'

const registry = readRegistry()
const claims = Object.values(registry.claims)
const done = doneCount(registry)
const watching = claims.filter((c) => c.status === 'watching')
const stale = watching.filter((c) => Date.now() - Date.parse(c.heartbeatAt) > STALE_AFTER_MS)
const rejected = claims.filter((c) => c.status === 'rejected')
const colours = new Map<string, number>()
for (const c of claims)
  if (c.status === 'done') for (const col of c.colours ?? []) colours.set(col, (colours.get(col) ?? 0) + 1)
const perAgent = new Map<string, { done: number; watching: number; rejected: number }>()
for (const c of claims) {
  const a = perAgent.get(c.agent) ?? { done: 0, watching: 0, rejected: 0 }
  a[c.status]++
  perAgent.set(c.agent, a)
}

console.log(
  `games done: ${done}${registry.target === null ? ' (no target, runs until STOP)' : `/${registry.target}`}  watching: ${watching.length} (${stale.length} stale)  rejected: ${rejected.length}`
)
console.log('colours in finished games:', [...colours].map(([k, v]) => `${k} ${v}`).join(', ') || 'none yet')
console.log(
  'per agent:',
  [...perAgent].map(([a, s]) => `${a} done ${s.done} watching ${s.watching} rejected ${s.rejected}`).join(' | ') ||
    'none'
)
if (rejected.length) console.log('rejection reasons:', [...new Set(rejected.map((c) => c.reason))].join(' | '))
if (stale.length) console.log('stale claims:', stale.map((c) => `${c.roomCode} (${c.agent})`).join(', '))

if (
  process.argv.includes('--stop-at-target') &&
  registry.target !== null &&
  done >= registry.target &&
  !existsSync(STOP_FILE)
) {
  writeFileSync(STOP_FILE, `target ${registry.target} reached at ${new Date().toISOString()}\n`)
  console.log('STOP file written')
}
