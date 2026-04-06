import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const config = defineConfig({
  plugins: [devtools(), tsconfigPaths({ projects: ['./tsconfig.json'] }), tailwindcss(), tanstackStart(), viteReact()],
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
})

export default config
