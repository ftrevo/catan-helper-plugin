import * as tf from '@tensorflow/tfjs'

/** Backends in order of preference. WebGL is far faster; CPU is the always-available fallback. */
const PREFERRED_BACKENDS = ['webgl', 'cpu'] as const

let readyBackend: Promise<string> | undefined

/**
 * Selects the best available TensorFlow.js backend once per process. Safe to call repeatedly.
 * Resolves to the backend name so callers can log or display it.
 */
export const ensureTensorFlowBackend = (): Promise<string> => {
  readyBackend ??= (async () => {
    for (const backend of PREFERRED_BACKENDS) {
      // Backends register themselves only where they can run (WebGL needs a browser), so check first.
      if (tf.findBackendFactory(backend) && (await tf.setBackend(backend))) {
        await tf.ready()
        return backend
      }
    }
    throw new Error(`None of the TensorFlow.js backends (${PREFERRED_BACKENDS.join(', ')}) could be initialised`)
  })()

  return readyBackend
}
