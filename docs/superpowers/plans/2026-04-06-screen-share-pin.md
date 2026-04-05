# Screen Share + Participant Pin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Meet–style screen sharing and participant pinning to the web meeting room, with a `FocusLayout` that shows focused content in a large main area and all other participants in a compact bottom strip.

**Architecture:** A new `MeetingLayout` component inside the existing `LiveKitRoom` context owns pin state via `usePinnedParticipants` and detects screen share tracks via `useTracks`. It switches between `FocusLayout` (when focused content exists) and `ParticipantGrid` (default). The `ControlsBar` gains a screen share toggle button. `ParticipantTile` gains a hover pin button replacing the old spotlight button.

**Tech Stack:** React 18, TypeScript, LiveKit (`@livekit/components-react`, `livekit-client`), lucide-react 1.7, inline styles (no Tailwind in meeting components)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/web/src/lib/usePinnedParticipants.ts` | **Create** | Local pin state: toggle, unpin, clear, isPinned |
| `apps/web/src/components/meeting/ScreenShareTile.tsx` | **Create** | Renders one screen share track with "presenting" label |
| `apps/web/src/components/meeting/FocusLayout.tsx` | **Create** | Main area (screen shares + pinned) + bottom strip |
| `apps/web/src/components/meeting/ParticipantTile.tsx` | **Modify** | Replace `onSpotlight` prop with `isPinned` + `onTogglePin`; swap icon |
| `apps/web/src/components/meeting/ParticipantGrid.tsx` | **Modify** | Remove internal SpotlightView; accept + forward pin props |
| `apps/web/src/components/meeting/ControlsBar.tsx` | **Modify** | Add screen share toggle button |
| `apps/web/src/routes/m.$meetId.tsx` | **Modify** | Add `MeetingLayout` inner component wiring all pieces together |

---

### Task 1: `usePinnedParticipants` hook

**Files:**
- Create: `apps/web/src/lib/usePinnedParticipants.ts`

- [ ] **Step 1: Create the hook**

```ts
// apps/web/src/lib/usePinnedParticipants.ts
import { useState, useCallback } from 'react'

export interface UsePinnedParticipants {
  pinned: Set<string>
  toggle: (identity: string) => void
  unpin: (identity: string) => void
  clear: () => void
  isPinned: (identity: string) => boolean
}

export function usePinnedParticipants(): UsePinnedParticipants {
  const [pinned, setPinned] = useState<Set<string>>(new Set())

  const toggle = useCallback((identity: string) => {
    setPinned((prev) => {
      const next = new Set(prev)
      if (next.has(identity)) next.delete(identity)
      else next.add(identity)
      return next
    })
  }, [])

  const unpin = useCallback((identity: string) => {
    setPinned((prev) => {
      const next = new Set(prev)
      next.delete(identity)
      return next
    })
  }, [])

  const clear = useCallback(() => setPinned(new Set()), [])

  const isPinned = useCallback((identity: string) => pinned.has(identity), [pinned])

  return { pinned, toggle, unpin, clear, isPinned }
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npm run check 2>&1 | grep usePinnedParticipants
```

Expected: no output (no errors referencing this file).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/usePinnedParticipants.ts
git commit -m "feat(web/meeting): add usePinnedParticipants hook"
```

---

### Task 2: `ScreenShareTile` component

**Files:**
- Create: `apps/web/src/components/meeting/ScreenShareTile.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/meeting/ScreenShareTile.tsx
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react'
import { VideoTrack, useParticipantInfo } from '@livekit/components-react'
import { Monitor } from 'lucide-react'

interface ScreenShareTileProps {
  trackRef: TrackReferenceOrPlaceholder
}

export function ScreenShareTile({ trackRef }: ScreenShareTileProps) {
  const { name, identity } = useParticipantInfo({ participant: trackRef.participant })
  const displayName = name ?? identity ?? '?'

  return (
    <div style={{
      position: 'relative',
      width: '100%', height: '100%',
      background: '#030308',
      borderRadius: 12,
      border: '1px solid rgba(99,102,241,0.35)',
      overflow: 'hidden',
    }}>
      <VideoTrack
        trackRef={trackRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'contain',
        }}
      />
      <div style={{
        position: 'absolute', bottom: 10, left: 10,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
        borderRadius: 7, padding: '4px 10px',
      }}>
        <Monitor size={12} style={{ color: '#a5b4fc', flexShrink: 0 }} />
        <span style={{ color: 'white', fontSize: 12, fontWeight: 500 }}>
          {displayName} is presenting
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npm run check 2>&1 | grep ScreenShareTile
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/meeting/ScreenShareTile.tsx
git commit -m "feat(web/meeting): add ScreenShareTile component"
```

---

### Task 3: `FocusLayout` component

**Files:**
- Create: `apps/web/src/components/meeting/FocusLayout.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/meeting/FocusLayout.tsx
import { useTracks, useParticipants } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { ScreenShareTile } from './ScreenShareTile'
import { ParticipantTile } from './ParticipantTile'

interface FocusLayoutProps {
  pinnedIdentities: Set<string>
  onTogglePin: (identity: string) => void
}

export function FocusLayout({ pinnedIdentities, onTogglePin }: FocusLayoutProps) {
  const screenShareTracks = useTracks([Track.Source.ScreenShare])
  const participants = useParticipants()

  const pinnedParticipants = participants.filter((p) => pinnedIdentities.has(p.identity))
  const stripParticipants  = participants.filter((p) => !pinnedIdentities.has(p.identity))

  const mainCount = screenShareTracks.length + pinnedParticipants.length
  const gridCols  = Math.min(mainCount, 3)

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      paddingTop: 56,
      paddingBottom: 88,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      zIndex: 0,
    }}>
      {/* ── Main focus area ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridAutoRows: '1fr',
        gap: 4,
        padding: '4px 4px 0',
        minHeight: 0,
      }}>
        {screenShareTracks.map((track) => (
          <ScreenShareTile
            key={`${track.participant.identity}-screen`}
            trackRef={track}
          />
        ))}
        {pinnedParticipants.map((p, i) => (
          <ParticipantTile
            key={p.identity}
            participant={p}
            totalCount={mainCount}
            index={screenShareTracks.length + i}
            isPinned={true}
            onTogglePin={() => onTogglePin(p.identity)}
          />
        ))}
      </div>

      {/* ── Bottom strip: non-focused participants ── */}
      {stripParticipants.length > 0 && (
        <div style={{
          height: 100,
          flexShrink: 0,
          display: 'flex',
          gap: 4,
          padding: '0 4px 4px',
          overflowX: 'auto',
        }}>
          {stripParticipants.map((p, i) => (
            <div key={p.identity} style={{ width: 160, height: 90, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
              <ParticipantTile
                participant={p}
                totalCount={9}
                index={i}
                isPinned={false}
                onTogglePin={() => onTogglePin(p.identity)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npm run check 2>&1 | grep FocusLayout
```

Expected: errors referencing `isPinned`/`onTogglePin` not yet on `ParticipantTile` — this is expected and resolved in Task 4.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/meeting/FocusLayout.tsx
git commit -m "feat(web/meeting): add FocusLayout component"
```

---

### Task 4: Update `ParticipantTile` — replace spotlight with pin

**Files:**
- Modify: `apps/web/src/components/meeting/ParticipantTile.tsx`

- [ ] **Step 1: Update imports and props**

Replace the top of the file:

```tsx
// apps/web/src/components/meeting/ParticipantTile.tsx
import { useMemo, useState, useEffect } from 'react'
import type { Participant } from 'livekit-client'
import { Track, ParticipantEvent } from 'livekit-client'
import { useParticipantInfo, useIsSpeaking, VideoTrack } from '@livekit/components-react'
import { MicOff, Pin } from 'lucide-react'
```

- [ ] **Step 2: Update the Props interface**

Replace:
```tsx
interface Props {
  participant: Participant
  totalCount: number
  index: number
  onSpotlight?: (p: Participant) => void
}
```

With:
```tsx
interface Props {
  participant: Participant
  totalCount: number
  index: number
  isPinned?: boolean
  onTogglePin?: () => void
}
```

- [ ] **Step 3: Update the function signature and hover button**

Replace:
```tsx
export function ParticipantTile({ participant, totalCount, index, onSpotlight }: Props) {
```
With:
```tsx
export function ParticipantTile({ participant, totalCount, index, isPinned = false, onTogglePin }: Props) {
```

Replace the entire "Spotlight trigger" block at the bottom of the JSX:
```tsx
      {/* Pin button — always visible when pinned, appears on hover otherwise */}
      {onTogglePin && (
        <button
          onClick={onTogglePin}
          className={isPinned ? undefined : 'group-hover:opacity-100'}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 30, height: 30, borderRadius: 8,
            background: isPinned ? 'rgba(99,102,241,0.7)' : 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${isPinned ? 'rgba(165,180,252,0.5)' : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isPinned ? '#e0e7ff' : 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            opacity: isPinned ? 1 : 0,
            transition: 'opacity 0.15s ease, background 0.15s ease',
          }}
          aria-label={isPinned ? 'Unpin participant' : 'Pin participant'}
        >
          <Pin size={13} style={{ fill: isPinned ? 'currentColor' : 'none' }} />
        </button>
      )}
```

- [ ] **Step 4: Type-check**

```bash
cd apps/web && npm run check 2>&1 | grep -i "participanttile\|onSpotlight"
```

Expected: errors about `onSpotlight` being passed from `ParticipantGrid` — resolved in Task 5.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/meeting/ParticipantTile.tsx
git commit -m "feat(web/meeting): replace spotlight button with pin in ParticipantTile"
```

---

### Task 5: Update `ParticipantGrid` — remove SpotlightView, forward pin props

**Files:**
- Modify: `apps/web/src/components/meeting/ParticipantGrid.tsx`

- [ ] **Step 1: Rewrite the file**

```tsx
// apps/web/src/components/meeting/ParticipantGrid.tsx
import { useParticipants } from '@livekit/components-react'
import { Video } from 'lucide-react'
import { ParticipantTile } from './ParticipantTile'

interface ParticipantGridProps {
  pinnedIdentities: Set<string>
  onTogglePin: (identity: string) => void
}

function gridCols(count: number): string {
  if (count === 1) return 'grid-cols-1'
  if (count <= 4) return 'grid-cols-2'
  if (count <= 9) return 'grid-cols-3'
  return 'grid-cols-4'
}

const gridArea: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  paddingTop: 56,
  paddingBottom: 88,
  zIndex: 0,
}

export function ParticipantGrid({ pinnedIdentities, onTogglePin }: ParticipantGridProps) {
  const participants = useParticipants()

  if (participants.length === 0) {
    return (
      <div style={gridArea} className="flex flex-col items-center justify-center gap-5">
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Video size={32} style={{ color: 'rgba(99,102,241,0.55)' }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Waiting for others to join…</p>
      </div>
    )
  }

  return (
    <div style={gridArea}>
      <div
        className={gridCols(participants.length)}
        style={{
          display: 'grid',
          height: '100%',
          width: '100%',
          gridAutoRows: '1fr',
          gap: participants.length === 1 ? 0 : 3,
          padding: participants.length === 1 ? 0 : 3,
        }}
      >
        {participants.map((p, i) => (
          <ParticipantTile
            key={p.identity}
            participant={p}
            totalCount={participants.length}
            index={i}
            isPinned={pinnedIdentities.has(p.identity)}
            onTogglePin={() => onTogglePin(p.identity)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/web && npm run check 2>&1 | grep -i "participantgrid\|SpotlightView"
```

Expected: errors about `<ParticipantGrid />` missing required props in `m.$meetId.tsx` — resolved in Task 7.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/meeting/ParticipantGrid.tsx
git commit -m "feat(web/meeting): remove SpotlightView from ParticipantGrid, add pin prop forwarding"
```

---

### Task 6: Update `ControlsBar` — add screen share button

**Files:**
- Modify: `apps/web/src/components/meeting/ControlsBar.tsx`

- [ ] **Step 1: Add `MonitorUp` and `MonitorOff` to the lucide import**

Find the existing lucide import line and add the two icons:

```tsx
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users, Volume2, Mic2, Check, MonitorUp, MonitorOff } from 'lucide-react'
```

- [ ] **Step 2: Add `useAuthStore` import at the top of `ControlsBar.tsx`**

```tsx
import { useAuthStore } from '#/lib/auth.store'
```

- [ ] **Step 3: Read screen share state and compute `canShare`**

The hook is already called at the top of `ControlsBar`:
```tsx
const { localParticipant } = useLocalParticipant()
```

Add directly after the existing `camEnabled` line:
```tsx
const isScreenShareEnabled = localParticipant?.isScreenShareEnabled ?? false
const tokens    = useAuthStore((s) => s.tokens)
const canShare  = Boolean(tokens) && Boolean(navigator.mediaDevices?.getDisplayMedia)
const shareTip  = !tokens
  ? 'Sign in to share screen'
  : !navigator.mediaDevices?.getDisplayMedia
    ? 'Screen sharing not supported on this device'
    : isScreenShareEnabled
      ? 'Stop sharing'
      : 'Share screen'
```

- [ ] **Step 4: Insert the screen share button**

Add the button between the noise dropdown (`</DropdownMenu>`) and the first `<div style={divider} />` that comes before Leave:

```tsx
        {/* ── Screen share ── */}
        <CtrlBtn
          tip={shareTip}
          style={{ ...iconBtn(false, isScreenShareEnabled), opacity: canShare ? 1 : 0.4, cursor: canShare ? 'pointer' : 'not-allowed' }}
          onClick={canShare ? () => localParticipant?.setScreenShareEnabled(!isScreenShareEnabled) : undefined}
        >
          {isScreenShareEnabled ? <MonitorOff size={17} /> : <MonitorUp size={17} />}
        </CtrlBtn>
```

- [ ] **Step 5: Type-check**

```bash
cd apps/web && npm run check 2>&1 | grep ControlsBar
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/meeting/ControlsBar.tsx
git commit -m "feat(web/meeting): add screen share toggle button to ControlsBar"
```

---

### Task 7: Wire layout switching in `m.$meetId.tsx`

**Files:**
- Modify: `apps/web/src/routes/m.$meetId.tsx`

- [ ] **Step 1: Add new imports at the top of `m.$meetId.tsx`**

Add to the existing import block:
```tsx
import { useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { FocusLayout } from '@/components/meeting/FocusLayout'
import { usePinnedParticipants } from '#/lib/usePinnedParticipants'
```

- [ ] **Step 2: Add `MeetingLayout` component**

Add this function directly above `MeetingPanels` (around line 296):

```tsx
// ── Layout controller (must be inside LiveKitRoom context) ──────────────────

function MeetingLayout() {
  const { pinned, toggle, clear } = usePinnedParticipants()
  const screenShareTracks = useTracks([Track.Source.ScreenShare])
  const isFocusMode = screenShareTracks.length > 0 || pinned.size > 0

  useEffect(() => () => clear(), [clear])

  if (isFocusMode) {
    return <FocusLayout pinnedIdentities={pinned} onTogglePin={toggle} />
  }
  return <ParticipantGrid pinnedIdentities={pinned} onTogglePin={toggle} />
}
```

- [ ] **Step 3: Replace `<ParticipantGrid />` with `<MeetingLayout />`**

In the JSX inside `MeetingProvider`, find:
```tsx
        <ParticipantGrid />
```
Replace with:
```tsx
        <MeetingLayout />
```

- [ ] **Step 4: Final type-check — must be zero errors**

```bash
cd apps/web && npm run check
```

Expected: clean output with no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/m.\$meetId.tsx
git commit -m "feat(web/meeting): wire MeetingLayout for screen share and pin switching"
```

---

### Task 8: Push and smoke-test

- [ ] **Step 1: Push**

```bash
git push
```

- [ ] **Step 2: Start dev server**

```bash
cd apps/web && npm run dev
```

- [ ] **Step 3: Smoke-test screen share**

1. Open two browser tabs on the meeting URL (`/m/<room-name>`)
2. In tab 1, click the screen share button (monitor icon) in the controls bar
3. Select a window or screen in the browser dialog
4. Verify: tab 1 and tab 2 both switch to `FocusLayout` — screen share in the main area, camera tiles in the bottom strip
5. Click the screen share button again (or the browser's "Stop sharing" bar)
6. Verify: both tabs return to the tile grid

- [ ] **Step 4: Smoke-test pin**

1. In tab 2, hover over a participant tile
2. Verify: a pin icon appears in the top-right corner of the tile
3. Click the pin button
4. Verify: tab 2 switches to `FocusLayout` — pinned participant in the main area, others in the bottom strip
5. Click the pin button again on the pinned tile in the main area
6. Verify: tab 2 returns to the tile grid
7. Verify: tab 1 is unaffected (pin is local only)

- [ ] **Step 5: Smoke-test combined**

1. Tab 1 shares screen, tab 2 pins someone
2. On tab 2: both the screen share and the pinned participant appear in the main area side by side
3. Stop screen share from tab 1
4. On tab 2: pinned participant remains in main area, grid reverts fully once unpinned
