/// <reference types="vite/client" />

// View Transitions API — not yet in all TypeScript lib.dom.d.ts versions
interface ViewTransition {
  ready: Promise<void>
  finished: Promise<void>
  updateCallbackDone: Promise<void>
}

interface Document {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransition
}
