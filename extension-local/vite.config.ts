import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The popup is a single HTML entry. `public/` (manifest, icons, models) is copied verbatim into `dist/`,
// so `dist/` is the folder to load as an unpacked extension.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // TensorFlow.js is a single large dependency; a chunk size warning adds no information here.
    chunkSizeWarningLimit: 2000,
  },
})
