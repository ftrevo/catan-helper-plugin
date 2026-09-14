import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export const COLLECTION_DIR = resolve(here, '..')
export const REPO_DIR = resolve(COLLECTION_DIR, '..')
export const EXAMPLES_DIR = resolve(REPO_DIR, 'examples')
export const EXTENSION_DIR = resolve(REPO_DIR, 'extension-local')
export const TRAINING_DIR = resolve(REPO_DIR, 'training')
/** Per-agent Chrome profiles live here unless --profile says otherwise (gitignored). */
export const PROFILES_DIR = resolve(COLLECTION_DIR, '.profiles')
