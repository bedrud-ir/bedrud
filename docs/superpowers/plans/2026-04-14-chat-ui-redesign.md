# Chat UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the in-meeting chat panel with Telegram-style message grouping, avatars, timestamps, auto-grow input, scroll banners, and sessionStorage persistence.

**Architecture:** Decompose the monolithic `ChatPanel.tsx` into focused sub-components under `src/components/meeting/chat/`. Pure functions (`chatGrouping.ts`) handle grouping logic and are unit-tested with vitest. A `useChatPersistence` hook handles sessionStorage. `MeetingContext` seeds its initial state from the hook.

**Tech Stack:** React 18, TypeScript, vitest + @testing-library/react, inline CSS (no Tailwind classes in meeting components), LiveKit data channel (unchanged)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/meeting/chat/chatGrouping.ts` | Pure function: messages → `DisplayItem[]`; avatar color/initials helpers; relative/absolute time formatters |
| Create | `src/components/meeting/chat/useChatPersistence.ts` | Hook: read/write `ChatMessage[]` to `sessionStorage` |
| Create | `src/components/meeting/chat/ChatMessageCluster.tsx` | One sender's time-grouped bubbles with avatar, name, timestamp |
| Create | `src/components/meeting/chat/ChatInput.tsx` | Auto-grow textarea with expand mode, file picker, send button |
| Create | `src/components/meeting/chat/ChatScrollManager.tsx` | Floating ↓ button + "↑ N new messages" banner |
| Create | `src/components/meeting/chat/ChatMessageList.tsx` | Scroll container, date separators, cluster list, drag-drop |
| Modify | `src/components/meeting/ChatPanel.tsx` | Thin coordinator that wires all sub-components |
| Modify | `src/components/meeting/MeetingContext.tsx` | Integrate `useChatPersistence` to seed and persist `chatMessages` |
| Create | `src/components/meeting/chat/chatGrouping.test.ts` | Unit tests for grouping, avatar helpers, time formatters |
| Create | `src/components/meeting/chat/useChatPersistence.test.ts` | Hook tests with fake sessionStorage |
| Modify | `vite.config.ts` | Add `test` block with `environment: 'jsdom'` |

---

## Task 0: Configure vitest with jsdom

**Files:**
- Modify: `apps/web/vite.config.ts`

- [ ] **Step 1: Add test block to vite.config.ts**

Open `apps/web/vite.config.ts`. The current file exports a `defineConfig({...})`. Add a `test` property at the top level of the config object:

```ts
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
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
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
            return 'react-vendor'
          }
          if (id.includes('/node_modules/recharts') || id.includes('/node_modules/d3-')) {
            return 'charts-vendor'
          }
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
```

- [ ] **Step 2: Verify vitest can start**

```bash
cd apps/web && bun run test -- --reporter=verbose 2>&1 | head -20
```

Expected: vitest starts, prints "No test files found" or similar. No errors about missing environment.

- [ ] **Step 3: Commit**

```bash
git add apps/web/vite.config.ts
git commit -m "test(web): configure vitest jsdom environment"
```

---

## Task 1: Pure grouping logic and helpers (`chatGrouping.ts`)

**Files:**
- Create: `apps/web/src/components/meeting/chat/chatGrouping.ts`
- Create: `apps/web/src/components/meeting/chat/chatGrouping.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/components/meeting/chat/chatGrouping.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  groupMessages,
  avatarColor,
  avatarInitials,
  relativeTime,
  absoluteTime,
  AVATAR_COLORS,
} from './chatGrouping'
import type { ChatMessage, SystemMessage } from '#/components/meeting/MeetingContext'

function makeMsg(overrides: Partial<ChatMessage> & { timestamp: number }): ChatMessage {
  return {
    id: crypto.randomUUID(),
    senderName: 'Alice',
    senderIdentity: 'alice',
    message: 'hello',
    attachments: [],
    isLocal: false,
    ...overrides,
  }
}

const NOW = new Date('2026-04-14T14:00:00Z').getTime()

describe('groupMessages', () => {
  it('returns empty array for no messages', () => {
    expect(groupMessages([], [])).toEqual([])
  })

  it('wraps a single chat message in a date-separator + cluster', () => {
    const msg = makeMsg({ timestamp: NOW })
    const items = groupMessages([msg], [])
    expect(items[0].kind).toBe('date-separator')
    expect(items[1].kind).toBe('cluster')
    if (items[1].kind === 'cluster') {
      expect(items[1].messages).toHaveLength(1)
      expect(items[1].messages[0].id).toBe(msg.id)
    }
  })

  it('groups consecutive messages from same sender within 5 minutes into one cluster', () => {
    const m1 = makeMsg({ timestamp: NOW })
    const m2 = makeMsg({ timestamp: NOW + 60_000 }) // 1 minute later
    const items = groupMessages([m1, m2], [])
    const clusters = items.filter((i) => i.kind === 'cluster')
    expect(clusters).toHaveLength(1)
    if (clusters[0].kind === 'cluster') {
      expect(clusters[0].messages).toHaveLength(2)
    }
  })

  it('starts a new cluster when gap exceeds 5 minutes', () => {
    const m1 = makeMsg({ timestamp: NOW })
    const m2 = makeMsg({ timestamp: NOW + 6 * 60_000 }) // 6 minutes later
    const items = groupMessages([m1, m2], [])
    const clusters = items.filter((i) => i.kind === 'cluster')
    expect(clusters).toHaveLength(2)
  })

  it('starts a new cluster when sender changes', () => {
    const m1 = makeMsg({ timestamp: NOW, senderIdentity: 'alice' })
    const m2 = makeMsg({ timestamp: NOW + 30_000, senderIdentity: 'bob', senderName: 'Bob' })
    const items = groupMessages([m1, m2], [])
    const clusters = items.filter((i) => i.kind === 'cluster')
    expect(clusters).toHaveLength(2)
    if (clusters[0].kind === 'cluster') expect(clusters[0].identity).toBe('alice')
    if (clusters[1].kind === 'cluster') expect(clusters[1].identity).toBe('bob')
  })

  it('inserts system messages as standalone items (not in clusters)', () => {
    const msg = makeMsg({ timestamp: NOW })
    const sys: SystemMessage = { type: 'system', event: 'kick', actor: 'mod', target: 'user', ts: NOW + 10_000 }
    const items = groupMessages([msg], [sys])
    expect(items.some((i) => i.kind === 'system')).toBe(true)
    const cluster = items.find((i) => i.kind === 'cluster')
    expect(cluster?.kind === 'cluster' && cluster.messages).toHaveLength(1)
  })

  it('interleaves chat and system messages by timestamp', () => {
    const m1 = makeMsg({ timestamp: NOW })
    const sys: SystemMessage = { type: 'system', event: 'ban', actor: 'mod', target: 'user', ts: NOW + 5_000 }
    const m2 = makeMsg({ timestamp: NOW + 10_000 })
    const items = groupMessages([m1, m2], [sys])
    // Order: date-sep, cluster(m1), system, cluster(m2)
    const kinds = items.map((i) => i.kind)
    expect(kinds).toEqual(['date-separator', 'cluster', 'system', 'cluster'])
  })
})

describe('avatarColor', () => {
  it('returns a string from AVATAR_COLORS', () => {
    const color = avatarColor('alice')
    expect(AVATAR_COLORS).toContain(color)
  })

  it('is deterministic for the same identity', () => {
    expect(avatarColor('alice')).toBe(avatarColor('alice'))
  })

  it('differs for different identities (at least sometimes)', () => {
    const colors = ['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'heidi'].map(avatarColor)
    const unique = new Set(colors)
    expect(unique.size).toBeGreaterThan(1)
  })
})

describe('avatarInitials', () => {
  it('returns first two chars uppercased for single-word names', () => {
    expect(avatarInitials('alice')).toBe('AL')
  })

  it('returns initials for two-word names', () => {
    expect(avatarInitials('Alice Smith')).toBe('AS')
  })

  it('handles extra spaces', () => {
    expect(avatarInitials('  Bob   Jones  ')).toBe('BJ')
  })
})

describe('relativeTime', () => {
  it('returns "just now" for < 1 minute ago', () => {
    expect(relativeTime(Date.now() - 30_000)).toBe('just now')
  })

  it('returns "Xm ago" for < 1 hour ago', () => {
    expect(relativeTime(Date.now() - 5 * 60_000)).toBe('5m ago')
  })

  it('returns "Xh ago" for < 1 day ago', () => {
    expect(relativeTime(Date.now() - 3 * 3_600_000)).toBe('3h ago')
  })
})

describe('absoluteTime', () => {
  it('returns a non-empty string', () => {
    expect(absoluteTime(Date.now()).length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/web && bun run test -- --reporter=verbose src/components/meeting/chat/chatGrouping.test.ts
```

Expected: multiple FAIL lines — `Cannot find module './chatGrouping'`.

- [ ] **Step 3: Implement `chatGrouping.ts`**

Create `apps/web/src/components/meeting/chat/chatGrouping.ts`:

```ts
import type { ChatMessage, SystemMessage } from '#/components/meeting/MeetingContext'

// ─── Display item types ───────────────────────────────────────────────────────

export interface ClusterGroup {
  kind: 'cluster'
  sender: string
  identity: string
  isLocal: boolean
  messages: ChatMessage[]
}

export interface DateSeparatorItem {
  kind: 'date-separator'
  label: string
}

export interface SystemItem {
  kind: 'system'
  msg: SystemMessage
}

export type DisplayItem = ClusterGroup | DateSeparatorItem | SystemItem

// ─── Constants ────────────────────────────────────────────────────────────────

const CLUSTER_GAP_MS = 5 * 60_000

export const AVATAR_COLORS = [
  'rgba(99,102,241,0.85)',  // indigo
  'rgba(139,92,246,0.85)', // violet
  'rgba(20,184,166,0.85)', // teal
  'rgba(244,63,94,0.85)',  // rose
  'rgba(245,158,11,0.85)', // amber
  'rgba(14,165,233,0.85)', // sky
  'rgba(16,185,129,0.85)', // emerald
  'rgba(217,70,239,0.85)', // fuchsia
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDateLabel(ts: number): string {
  const date = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

export function avatarColor(identity: string): string {
  let hash = 0
  for (let i = 0; i < identity.length; i++) {
    hash = (hash * 31 + identity.charCodeAt(i)) & 0xffffffff
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function absoluteTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// ─── Core grouping function ───────────────────────────────────────────────────

export function groupMessages(
  chatMessages: ChatMessage[],
  systemMessages: SystemMessage[],
): DisplayItem[] {
  type RawItem =
    | { ts: number; kind: 'chat'; msg: ChatMessage }
    | { ts: number; kind: 'system'; msg: SystemMessage }

  const raw: RawItem[] = [
    ...chatMessages.map((m) => ({ ts: m.timestamp, kind: 'chat' as const, msg: m })),
    ...systemMessages.map((m) => ({ ts: m.ts, kind: 'system' as const, msg: m })),
  ].sort((a, b) => a.ts - b.ts)

  const result: DisplayItem[] = []
  let currentCluster: ClusterGroup | null = null
  let lastDateLabel: string | null = null

  for (const item of raw) {
    const dateLabel = formatDateLabel(item.ts)

    if (dateLabel !== lastDateLabel) {
      lastDateLabel = dateLabel
      currentCluster = null
      result.push({ kind: 'date-separator', label: dateLabel })
    }

    if (item.kind === 'system') {
      currentCluster = null
      result.push({ kind: 'system', msg: item.msg })
      continue
    }

    const msg = item.msg
    const last = currentCluster?.messages[currentCluster.messages.length - 1]
    const gapExceeded = last ? msg.timestamp - last.timestamp > CLUSTER_GAP_MS : false
    const senderChanged = currentCluster ? currentCluster.identity !== msg.senderIdentity : false

    if (!currentCluster || gapExceeded || senderChanged) {
      currentCluster = {
        kind: 'cluster',
        sender: msg.senderName,
        identity: msg.senderIdentity,
        isLocal: msg.isLocal,
        messages: [msg],
      }
      result.push(currentCluster)
    } else {
      currentCluster.messages.push(msg)
    }
  }

  return result
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
cd apps/web && bun run test -- --reporter=verbose src/components/meeting/chat/chatGrouping.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/meeting/chat/chatGrouping.ts \
        apps/web/src/components/meeting/chat/chatGrouping.test.ts
git commit -m "feat(web): add chat grouping logic and helpers"
```

---

## Task 2: Session persistence hook (`useChatPersistence.ts`)

**Files:**
- Create: `apps/web/src/components/meeting/chat/useChatPersistence.ts`
- Create: `apps/web/src/components/meeting/chat/useChatPersistence.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/components/meeting/chat/useChatPersistence.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatPersistence } from './useChatPersistence'
import type { ChatMessage } from '#/components/meeting/MeetingContext'

function makeMsg(id: string): ChatMessage {
  return {
    id,
    timestamp: Date.now(),
    senderName: 'Alice',
    senderIdentity: 'alice',
    message: 'hello',
    attachments: [],
    isLocal: false,
  }
}

beforeEach(() => sessionStorage.clear())
afterEach(() => sessionStorage.clear())

describe('useChatPersistence', () => {
  it('returns empty array when sessionStorage has no entry', () => {
    const { result } = renderHook(() => useChatPersistence('room-1'))
    const [initial] = result.current
    expect(initial).toEqual([])
  })

  it('returns stored messages on mount', () => {
    const msgs = [makeMsg('a'), makeMsg('b')]
    sessionStorage.setItem('chat:room-1', JSON.stringify(msgs))
    const { result } = renderHook(() => useChatPersistence('room-1'))
    const [initial] = result.current
    expect(initial).toHaveLength(2)
    expect(initial[0].id).toBe('a')
  })

  it('persist() writes messages to sessionStorage', () => {
    const { result } = renderHook(() => useChatPersistence('room-2'))
    const [, persist] = result.current
    const msgs = [makeMsg('x')]
    act(() => persist(msgs))
    const stored = JSON.parse(sessionStorage.getItem('chat:room-2') ?? '[]') as ChatMessage[]
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe('x')
  })

  it('scopes storage to roomId', () => {
    const { result: r1 } = renderHook(() => useChatPersistence('room-A'))
    const { result: r2 } = renderHook(() => useChatPersistence('room-B'))
    act(() => r1.current[1]([makeMsg('from-A')]))
    act(() => r2.current[1]([makeMsg('from-B')]))
    const a = JSON.parse(sessionStorage.getItem('chat:room-A') ?? '[]') as ChatMessage[]
    const b = JSON.parse(sessionStorage.getItem('chat:room-B') ?? '[]') as ChatMessage[]
    expect(a[0].id).toBe('from-A')
    expect(b[0].id).toBe('from-B')
  })

  it('returns empty array when stored JSON is malformed', () => {
    sessionStorage.setItem('chat:room-bad', 'not-json{{{')
    const { result } = renderHook(() => useChatPersistence('room-bad'))
    const [initial] = result.current
    expect(initial).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/web && bun run test -- --reporter=verbose src/components/meeting/chat/useChatPersistence.test.ts
```

Expected: FAIL — `Cannot find module './useChatPersistence'`.

- [ ] **Step 3: Implement `useChatPersistence.ts`**

Create `apps/web/src/components/meeting/chat/useChatPersistence.ts`:

```ts
import { useCallback, useMemo } from 'react'
import type { ChatMessage } from '#/components/meeting/MeetingContext'

/**
 * Reads and writes ChatMessage[] from sessionStorage.
 * Data survives tab refresh but is cleared on tab close.
 * Storage is scoped by roomId — different rooms don't collide.
 *
 * Returns [initialMessages, persist]:
 *   - initialMessages: messages loaded on mount (stable reference)
 *   - persist: call with the latest messages array after any change
 */
export function useChatPersistence(
  roomId: string,
): [ChatMessage[], (msgs: ChatMessage[]) => void] {
  const key = `chat:${roomId}`

  const initialMessages = useMemo<ChatMessage[]>(() => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw ? (JSON.parse(raw) as ChatMessage[]) : []
    } catch {
      return []
    }
  }, [key])

  const persist = useCallback(
    (msgs: ChatMessage[]) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(msgs))
      } catch {
        // sessionStorage unavailable (private browsing quota exceeded)
      }
    },
    [key],
  )

  return [initialMessages, persist]
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
cd apps/web && bun run test -- --reporter=verbose src/components/meeting/chat/useChatPersistence.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/meeting/chat/useChatPersistence.ts \
        apps/web/src/components/meeting/chat/useChatPersistence.test.ts
git commit -m "feat(web): add useChatPersistence hook (sessionStorage)"
```

---

## Task 3: Message cluster component (`ChatMessageCluster.tsx`)

**Files:**
- Create: `apps/web/src/components/meeting/chat/ChatMessageCluster.tsx`

This component renders one `ClusterGroup` — avatar, sender name, all bubbles with Telegram-style border-radius, and a timestamp on the last bubble.

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/meeting/chat/ChatMessageCluster.tsx`:

```tsx
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ClusterGroup } from './chatGrouping'
import { avatarColor, avatarInitials, relativeTime, absoluteTime } from './chatGrouping'

// Telegram-style radius per bubble position
function bubbleRadius(isLocal: boolean, pos: 'only' | 'first' | 'middle' | 'last'): string {
  if (isLocal) {
    if (pos === 'only' || pos === 'first') return '14px 14px 4px 14px'
    if (pos === 'middle') return '14px 4px 4px 14px'
    return '14px 4px 14px 14px'
  }
  if (pos === 'only' || pos === 'first') return '14px 14px 14px 4px'
  if (pos === 'middle') return '4px 14px 14px 4px'
  return '4px 14px 14px 14px'
}

function bubblePosition(idx: number, total: number): 'only' | 'first' | 'middle' | 'last' {
  if (total === 1) return 'only'
  if (idx === 0) return 'first'
  if (idx === total - 1) return 'last'
  return 'middle'
}

function ChatMarkdown({ content, isLocal }: { content: string; isLocal: boolean }) {
  const linkColor = isLocal ? 'rgba(255,255,255,0.9)' : 'rgba(165,180,252,0.9)'
  const codeBg = isLocal ? 'rgba(0,0,0,0.25)' : 'rgba(99,102,241,0.15)'

  const components: Components = {
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer"
        style={{ color: linkColor, textDecoration: 'underline', wordBreak: 'break-all' }}>
        {children}
      </a>
    ),
    p: ({ children }) => <p style={{ margin: 0, lineHeight: 1.45 }}>{children}</p>,
    code: ({ children, className }) => {
      const isBlock = Boolean(className)
      return isBlock ? (
        <pre style={{ margin: '4px 0', padding: '6px 9px', borderRadius: 6, background: codeBg, overflowX: 'auto', fontSize: 12 }}>
          <code>{children}</code>
        </pre>
      ) : (
        <code style={{ background: codeBg, borderRadius: 4, padding: '1px 5px', fontSize: 12 }}>
          {children}
        </code>
      )
    },
    ul: ({ children }) => <ul style={{ margin: '2px 0', paddingLeft: 18 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ margin: '2px 0', paddingLeft: 18 }}>{children}</ol>,
    li: ({ children }) => <li style={{ lineHeight: 1.45 }}>{children}</li>,
    strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
    em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
    blockquote: ({ children }) => (
      <blockquote style={{ margin: '4px 0', paddingLeft: 10, borderLeft: `2px solid ${isLocal ? 'rgba(255,255,255,0.4)' : 'rgba(165,180,252,0.4)'}`, color: isLocal ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)' }}>
        {children}
      </blockquote>
    ),
    h1: ({ children }) => <strong style={{ fontSize: 15 }}>{children}</strong>,
    h2: ({ children }) => <strong style={{ fontSize: 14 }}>{children}</strong>,
    h3: ({ children }) => <strong style={{ fontSize: 13 }}>{children}</strong>,
  }

  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
}

interface Props {
  cluster: ClusterGroup
}

export function ChatMessageCluster({ cluster }: Props) {
  const { isLocal, sender, identity, messages } = cluster
  const total = messages.length
  const color = avatarColor(identity)
  const initials = avatarInitials(sender)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isLocal ? 'flex-end' : 'flex-start', gap: 2 }}>
      {/* Sender name (remote only) */}
      {!isLocal && (
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, paddingLeft: 36 }}>
          {sender}
        </span>
      )}

      {messages.map((msg, idx) => {
        const pos = bubblePosition(idx, total)
        const isLast = idx === total - 1
        const hasAttachments = msg.attachments.length > 0

        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              flexDirection: isLocal ? 'row-reverse' : 'row',
              width: '100%',
            }}
          >
            {/* Avatar slot — 28px wide on remote side, always present for alignment */}
            {!isLocal && (
              <div style={{ width: 28, flexShrink: 0 }}>
                {(pos === 'only' || pos === 'first') && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)',
                    userSelect: 'none',
                  }}>
                    {initials}
                  </div>
                )}
              </div>
            )}

            {/* Bubble */}
            <div style={{
              maxWidth: '78%',
              padding: hasAttachments && !msg.message ? '4px' : '7px 12px',
              borderRadius: bubbleRadius(isLocal, pos),
              background: isLocal ? 'rgba(99,102,241,0.75)' : 'rgba(255,255,255,0.07)',
              border: isLocal ? '1px solid rgba(165,180,252,0.25)' : '1px solid rgba(255,255,255,0.06)',
              color: isLocal ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
              fontSize: 13, lineHeight: 1.45, wordBreak: 'break-word', overflow: 'hidden',
            }}>
              {/* Image attachments */}
              {msg.attachments.map((att, ai) =>
                att.kind === 'image' ? (
                  <a key={ai} href={att.url} target="_blank" rel="noopener noreferrer">
                    <img src={att.url} alt="attachment" loading="lazy" style={{ display: 'block', maxWidth: '100%', maxHeight: 240, borderRadius: 10, objectFit: 'contain' }} />
                  </a>
                ) : null,
              )}
              {/* Text */}
              {msg.message && (
                <div style={{ padding: hasAttachments ? '6px 8px 2px' : '0' }}>
                  <ChatMarkdown content={msg.message} isLocal={isLocal} />
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Timestamp on last bubble */}
      <span
        title={absoluteTime(messages[total - 1].timestamp)}
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.25)',
          paddingLeft: isLocal ? 0 : 36,
          paddingRight: isLocal ? 2 : 0,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        {relativeTime(messages[total - 1].timestamp)}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd apps/web && bun run typecheck 2>&1 | grep -i "chat"
```

Expected: no errors mentioning any `chat/` file.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/meeting/chat/ChatMessageCluster.tsx
git commit -m "feat(web): add ChatMessageCluster with Telegram-style bubbles and avatars"
```

---

## Task 4: Auto-grow input component (`ChatInput.tsx`)

**Files:**
- Create: `apps/web/src/components/meeting/chat/ChatInput.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/meeting/chat/ChatInput.tsx`:

```tsx
import { Image, Maximize2, Minimize2, Send } from 'lucide-react'
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import type { ChatAttachment } from '#/components/meeting/MeetingContext'

const LINE_HEIGHT = 20
const MIN_ROWS = 1
const NORMAL_MAX_ROWS = 4
const EXPANDED_MAX_ROWS = 10

interface Props {
  onSend: (text: string, attachments?: ChatAttachment[]) => void
  onUpload: (file: File) => Promise<ChatAttachment>
  disabled?: boolean
}

export interface ChatInputHandle {
  focus: () => void
}

export const ChatInput = forwardRef<ChatInputHandle, Props>(function ChatInput(
  { onSend, onUpload, disabled },
  ref,
) {
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({ focus: () => textareaRef.current?.focus() }))

  const maxRows = expanded ? EXPANDED_MAX_ROWS : NORMAL_MAX_ROWS
  const minHeight = MIN_ROWS * LINE_HEIGHT + 16 // 16px vertical padding
  const maxHeight = maxRows * LINE_HEIGHT + 16

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [draft, maxHeight])

  const send = useCallback(() => {
    const text = draft.trim()
    if (!text || disabled || uploading) return
    onSend(text)
    setDraft('')
    setExpanded(false)
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`
  }, [draft, disabled, uploading, onSend, minHeight])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && e.ctrlKey)) {
        e.preventDefault()
        send()
      }
    },
    [send],
  )

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null)
      setUploading(true)
      try {
        const attachment = await onUpload(file)
        onSend(draft.trim(), [attachment])
        setDraft('')
        setExpanded(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [draft, onSend, onUpload],
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData.items)
      const imageItem = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'))
      if (!imageItem) return
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) uploadFile(file)
    },
    [uploadFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) uploadFile(file)
      e.target.value = ''
    },
    [uploadFile],
  )

  const canSend = Boolean(draft.trim()) && !uploading && !disabled

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px' }}>
      {error && (
        <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(248,113,113,0.9)' }}>{error}</p>
      )}
      {uploading && (
        <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(165,180,252,0.7)' }}>Uploading image…</p>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        {/* Attach image */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          title="Attach image"
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.04)',
            color: (uploading || disabled) ? 'rgba(255,255,255,0.15)' : 'rgba(165,180,252,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: (uploading || disabled) ? 'default' : 'pointer',
          }}
          aria-label="Attach image"
        >
          <Image size={14} />
        </button>

        {/* Textarea wrapper */}
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message…"
            disabled={uploading || disabled}
            rows={1}
            style={{
              width: '100%',
              minHeight,
              maxHeight,
              resize: 'none',
              overflowY: 'auto',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10,
              padding: '8px 32px 8px 12px', // right padding for expand button
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
              lineHeight: `${LINE_HEIGHT}px`,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {/* Expand / collapse button */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Collapse' : 'Expand'}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 18, height: 18, padding: 0,
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.25)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label={expanded ? 'Collapse input' : 'Expand input'}
          >
            {expanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
        </div>

        {/* Send */}
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0, border: 'none',
            background: canSend ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.06)',
            color: canSend ? 'white' : 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s',
          }}
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
})
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd apps/web && bun run typecheck 2>&1 | grep -i "ChatInput\|chat/Chat"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/meeting/chat/ChatInput.tsx
git commit -m "feat(web): add ChatInput with auto-grow textarea and expand mode"
```

---

## Task 5: Scroll manager component (`ChatScrollManager.tsx`)

**Files:**
- Create: `apps/web/src/components/meeting/chat/ChatScrollManager.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/meeting/chat/ChatScrollManager.tsx`:

```tsx
import { ArrowDown } from 'lucide-react'

interface Props {
  show: boolean
  unreadCount: number
  onScrollToBottom: () => void
}

export function ChatScrollManager({ show, unreadCount, onScrollToBottom }: Props) {
  if (!show) return null

  const label = unreadCount === 1 ? '↑ 1 new message' : `↑ ${unreadCount} new messages`

  return (
    <>
      {/* Inline banner — pill centered just above the input */}
      {unreadCount > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(88px + env(safe-area-inset-bottom, 0px) + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 6,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <button
            type="button"
            onClick={onScrollToBottom}
            style={{
              background: 'rgba(99,102,241,0.85)',
              border: 'none',
              borderRadius: 20,
              padding: '5px 14px',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {label}
          </button>
        </div>
      )}

      {/* Floating ↓ button — bottom-right corner */}
      <button
        type="button"
        onClick={onScrollToBottom}
        aria-label="Scroll to latest messages"
        style={{
          position: 'absolute',
          bottom: 'calc(88px + env(safe-area-inset-bottom, 0px) + 56px)',
          right: 14,
          width: 34, height: 34,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(30,30,50,0.92)',
          color: 'rgba(165,180,252,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          zIndex: 5,
        }}
      >
        <ArrowDown size={14} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: 'rgba(99,102,241,0.9)',
            color: 'white', fontSize: 9, fontWeight: 700,
            borderRadius: '50%', width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && bun run typecheck 2>&1 | grep -i "ChatScrollManager\|chat/Chat"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/meeting/chat/ChatScrollManager.tsx
git commit -m "feat(web): add ChatScrollManager with inline banner and floating button"
```

---

## Task 6: Message list component (`ChatMessageList.tsx`)

**Files:**
- Create: `apps/web/src/components/meeting/chat/ChatMessageList.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/meeting/chat/ChatMessageList.tsx`:

```tsx
import { MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, SystemMessage } from '#/components/meeting/MeetingContext'
import { ChatMessageCluster } from './ChatMessageCluster'
import { ChatScrollManager } from './ChatScrollManager'
import { groupMessages } from './chatGrouping'

interface Props {
  chatMessages: ChatMessage[]
  systemMessages: SystemMessage[]
  onScrollUnreadChange: (n: number) => void
  onDrop: (file: File) => void
}

export function ChatMessageList({ chatMessages, systemMessages, onScrollUnreadChange, onDrop }: Props) {
  const messagesRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoFollowRef = useRef(true)
  const prevCountRef = useRef(0)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [scrollUnread, setScrollUnread] = useState(0)

  const handleScroll = useCallback(() => {
    const el = messagesRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    autoFollowRef.current = atBottom
    setShowScrollBtn(!atBottom)
    if (atBottom) {
      setScrollUnread(0)
      onScrollUnreadChange(0)
    }
  }, [onScrollUnreadChange])

  const totalCount = chatMessages.length + systemMessages.length

  useEffect(() => {
    const delta = totalCount - prevCountRef.current
    if (delta <= 0) return
    prevCountRef.current = totalCount
    if (autoFollowRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setScrollUnread((n) => {
        const next = n + delta
        onScrollUnreadChange(next)
        return next
      })
    }
  }, [totalCount, onScrollUnreadChange])

  const scrollToBottom = useCallback(() => {
    autoFollowRef.current = true
    setShowScrollBtn(false)
    setScrollUnread(0)
    onScrollUnreadChange(0)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [onScrollUnreadChange])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
      if (file) onDrop(file)
    },
    [onDrop],
  )

  const items = groupMessages(chatMessages, systemMessages)

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <div
        ref={messagesRef}
        onScroll={handleScroll}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {items.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} style={{ color: 'rgba(99,102,241,0.5)' }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12, textAlign: 'center' }}>
              No messages yet.<br />Say hello!
            </p>
          </div>
        ) : (
          items.map((item, i) => {
            if (item.kind === 'date-separator') {
              return (
                <div key={`sep-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>{item.label}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )
            }

            if (item.kind === 'system') {
              const label = item.msg.event === 'kick' ? 'was kicked by' : 'was banned by'
              return (
                <div key={`sys-${i}`} style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '3px 10px', fontStyle: 'italic' }}>
                    {item.msg.target} {label} {item.msg.actor}
                  </span>
                </div>
              )
            }

            return <ChatMessageCluster key={`cluster-${i}`} cluster={item} />
          })
        )}
        <div ref={bottomRef} />
      </div>

      <ChatScrollManager
        show={showScrollBtn}
        unreadCount={scrollUnread}
        onScrollToBottom={scrollToBottom}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/web && bun run typecheck 2>&1 | grep -i "ChatMessageList\|chat/Chat"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/meeting/chat/ChatMessageList.tsx
git commit -m "feat(web): add ChatMessageList with date separators and scroll tracking"
```

---

## Task 7: Wire ChatPanel + integrate persistence into MeetingContext

**Files:**
- Modify: `apps/web/src/components/meeting/ChatPanel.tsx`
- Modify: `apps/web/src/components/meeting/MeetingContext.tsx`

This task replaces `ChatPanel.tsx` with a thin coordinator and adds `useChatPersistence` to `MeetingContext`.

- [ ] **Step 1: Update `MeetingContext.tsx` to integrate persistence**

In `apps/web/src/components/meeting/MeetingContext.tsx`, make these changes:

**1a. Add the import** (after the existing imports):
```ts
import { useChatPersistence } from '#/components/meeting/chat/useChatPersistence'
```

**1b. Replace the `chatMessages` useState initialization.** Find:
```ts
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
```
Replace with:
```ts
const [initialMessages, persistMessages] = useChatPersistence(roomId)
const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages)
```

**1c. Add a `useEffect` to persist on every change.** Add this after the `chatMessages` state declaration:
```ts
useEffect(() => {
  persistMessages(chatMessages)
}, [chatMessages, persistMessages])
```

- [ ] **Step 2: Rewrite `ChatPanel.tsx`**

Replace the entire content of `apps/web/src/components/meeting/ChatPanel.tsx` with:

```tsx
import { MessageSquare, X } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import type { ChatAttachment } from '#/components/meeting/MeetingContext'
import { useMeetingContext } from '#/components/meeting/MeetingContext'
import { ChatInput, type ChatInputHandle } from './chat/ChatInput'
import { ChatMessageList } from './chat/ChatMessageList'

interface Props {
  onClose: () => void
}

const panel: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  width: 'min(320px, 100vw)',
  zIndex: 30,
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(10,10,22,0.94)',
  backdropFilter: 'blur(24px)',
  borderLeft: '1px solid rgba(255,255,255,0.07)',
  paddingTop: 'env(safe-area-inset-top, 0px)',
  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))',
}

export function ChatPanel({ onClose }: Props) {
  const { roomId, chatMessages, systemMessages, sendChat, markRead } = useMeetingContext()
  const inputRef = useRef<ChatInputHandle>(null)
  const noop = useCallback(() => {}, [])

  // Mark read and focus on open
  useEffect(() => {
    markRead()
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [markRead])

  const uploadAndSend = useCallback(
    async (file: File): Promise<ChatAttachment> => {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/room/${roomId}/chat/upload`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `Upload failed (${res.status})`)
      }
      return res.json() as Promise<ChatAttachment>
    },
    [roomId],
  )

  return (
    <aside className="meet-panel" style={panel}>
      {/* Header */}
      <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <MessageSquare size={14} style={{ color: 'rgba(165,180,252,0.7)' }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>Chat</span>
        </div>
        <button
          onClick={onClose}
          style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}
          aria-label="Close chat"
        >
          <X size={15} />
        </button>
      </div>

      {/* Message list */}
      <ChatMessageList
        chatMessages={chatMessages}
        systemMessages={systemMessages}
        onScrollUnreadChange={noop}
        onDrop={(file) => uploadAndSend(file).then((att) => sendChat('', [att])).catch(() => {})}
      />

      {/* Input */}
      <ChatInput
        ref={inputRef}
        onSend={sendChat}
        onUpload={uploadAndSend}
      />
    </aside>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd apps/web && bun run typecheck 2>&1
```

Expected: zero errors. Fix any that appear before proceeding.

- [ ] **Step 4: Run all tests**

```bash
cd apps/web && bun run test -- --reporter=verbose
```

Expected: all tests pass (chatGrouping + useChatPersistence suites).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/meeting/ChatPanel.tsx \
        apps/web/src/components/meeting/MeetingContext.tsx
git commit -m "feat(web): wire chat sub-components into ChatPanel, add persistence to MeetingContext"
```

---

## Task 8: Build verification

- [ ] **Step 1: Run production build**

```bash
cd apps/web && bun run build 2>&1 | tail -30
```

Expected: build completes without errors. Chunk sizes should be similar to before (chat sub-components add minimal JS).

- [ ] **Step 2: Final commit if any build fixes were needed**

Only commit if Step 1 required changes. Use:

```bash
git add <changed files>
git commit -m "fix(web): resolve build issues from chat redesign"
```
