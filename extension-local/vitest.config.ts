import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    // The end-to-end reading test runs two CNNs on the CPU backend.
    testTimeout: 60_000,
  },
})
