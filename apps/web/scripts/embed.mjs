#!/usr/bin/env node
/**
 * Builds the React app and copies the output into server/frontend/
 * so the Go binary can embed it at compile time.
 *
 * Steps:
 *  1. bun run build  →  dist/client/ (assets) + dist/server/server.js (SSR)
 *  2. Start the SSR server on a temp port
 *  3. Fetch / to capture the rendered HTML shell
 *  4. Clear server/frontend/ and copy dist/client/ into it
 *  5. Write the captured HTML as server/frontend/index.html
 */

import { spawn, spawnSync } from 'child_process'
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const webDir = resolve(__dir, '..')
const clientDir = resolve(webDir, 'dist/client')
const targetDir = resolve(webDir, '../../server/frontend')
const PORT = 4173

// ── 1. Build ─────────────────────────────────────────────────────────────────
console.log('▶ Building React app…')
const build = spawnSync('bun', ['run', 'build'], { cwd: webDir, stdio: 'inherit' })
if (build.status !== 0) process.exit(build.status ?? 1)

// ── 2. Start the SSR server ───────────────────────────────────────────────────
const serverEntry = resolve(webDir, 'dist/server/server.js')
if (!existsSync(serverEntry)) throw new Error(`SSR server not found: ${serverEntry}`)

console.log(`▶ Starting SSR server on port ${PORT}…`)
const proc = spawn('bun', ['run', serverEntry], {
  cwd: webDir,
  env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
  stdio: ['ignore', 'pipe', 'pipe'],
})
proc.stderr.on('data', (d) => process.stderr.write(d))

// ── 3. Wait for it to be ready, then capture the HTML shell ──────────────────
const shell = await waitAndFetch(`http://localhost:${PORT}/`, 10_000)
proc.kill('SIGTERM')

// ── 4. Copy dist/client/ → server/frontend/ ──────────────────────────────────
console.log(`▶ Copying assets to server/frontend/…`)
rmSync(targetDir, { recursive: true, force: true })
mkdirSync(targetDir, { recursive: true })
cpSync(clientDir, targetDir, { recursive: true })

// ── 5. Write index.html ───────────────────────────────────────────────────────
writeFileSync(resolve(targetDir, 'index.html'), shell, 'utf8')

// ── 6. Generate shell.html (no pre-rendered route content) ───────────────────
// Served for non-root routes so users don't see the homepage flash while JS loads.
const shellHtml = generateShell(shell)
writeFileSync(resolve(targetDir, 'shell.html'), shellHtml, 'utf8')

console.log('✅ server/frontend/ updated — restart `go run ./cmd/server` to pick up changes.')

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip pre-rendered route content from the SSR'd HTML, keeping only <head>,
 * scripts, and the theme-init snippet. The result is a minimal shell that
 * TanStack Router will hydrate against the actual URL.
 */
function generateShell(html) {
  // Replace everything between <!--$--> and <!--/$--> (the SSR'd route markup)
  // with an empty container that won't flash any route-specific content.
  return html.replace(/<!--\$-->[\s\S]*?<!--\/\$-->/, '<!--$--><!--/$-->')
}

async function waitAndFetch(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return res.text()
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Timed out waiting for SSR server at ${url}`)
}
