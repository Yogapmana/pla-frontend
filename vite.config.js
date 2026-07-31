import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * Vite alias: `web-worker` is an optional dependency of `elkjs` (the
 * graph-layout library). It's only used when ELK spawns a Web Worker,
 * which we don't do — `ConceptGraphService` always uses the main-thread
 * layout (`elk.layout(...)` without a worker URL). The alias points to
 * an empty stub so Rollup's static analysis doesn't fail when bundling
 * the `elkjs` source.
 */
const webWorkerStub = path.resolve(
  new URL('./src/lib/web-worker-stub.js', import.meta.url).pathname
)

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
  resolve: {
    alias: {
      '@': path.resolve(new URL('./src', import.meta.url).pathname),
      'web-worker': webWorkerStub,
    },
  },
  optimizeDeps: {
    // elkjs pre-bundling triggers the same `web-worker` resolution —
    // exclude it so Vite's dep optimizer leaves the require as-is and
    // the alias above resolves it.
    exclude: ['web-worker'],
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('@xyflow') || id.includes('elkjs') || id.includes('markmap') || id.includes('mermaid')) {
            return 'mindmap'
          }
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('@tanstack')) return 'query'
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
            return 'react-vendor'
          }
          if (id.includes('lucide-react') || id.includes('date-fns') || id.includes('i18next')) {
            return 'ui-utils'
          }
        },
      },
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      }
    }
  }
})
