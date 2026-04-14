import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8090',
      '/livekit': {
        target: 'http://localhost:8090',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Core React runtime — always loaded, stable long-term cache target
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
            return 'react-vendor'
          }
          // Recharts + D3 — only used in admin routes (already lazy via route splitting)
          if (id.includes('/node_modules/recharts') || id.includes('/node_modules/d3-')) {
            return 'charts-vendor'
          }
          // Markdown pipeline (react-markdown, remark, unified, rehype, micromark…)
          // Kept separate so the lazy ChatPanel chunk doesn't bloat with ~150 kB of parsers.
          // @livekit/krisp-noise-filter is intentionally excluded — it stays as its own
          // dynamically-imported lazy chunk (loaded only when krisp mode is activated).
          if (
            id.includes('/node_modules/react-markdown') ||
            id.includes('/node_modules/remark') ||
            id.includes('/node_modules/unified') ||
            id.includes('/node_modules/rehype') ||
            id.includes('/node_modules/hast') ||
            id.includes('/node_modules/mdast') ||
            id.includes('/node_modules/micromark') ||
            id.includes('/node_modules/vfile')
          ) {
            return 'markdown-vendor'
          }
        },
      },
    },
  },
})

export default config
