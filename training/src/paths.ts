import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export const TRAINING_DIR = resolve(here, '..')
export const ASSETS_DIR = resolve(TRAINING_DIR, 'assets/colonist')
export const RENDERED_DIR = resolve(TRAINING_DIR, 'assets/rendered')
export const OUT_DIR = resolve(TRAINING_DIR, 'out')
export const EXTENSION_DIR = resolve(TRAINING_DIR, '../extension-local')
export const MODELS_DIR = resolve(EXTENSION_DIR, 'public/models')
export const FIXTURES_DIR = resolve(EXTENSION_DIR, 'test/fixtures')
