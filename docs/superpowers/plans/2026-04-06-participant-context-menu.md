# Participant Context Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rich participant context menu (right-click / long-press / 3-dot) to both the video grid tiles and the participants list panel, with role-gated actions including client-side volume, server moderation, role management, and connection stats.

**Architecture:** A `ParticipantMenuContent` component renders all menu items and accepts `Item`/`Separator`/`Label` as typed props so the same tree works in both a Radix `ContextMenu` (right-click/long-press) and a `DropdownMenu` (3-dot button). Client-side volume/mute is stored in a Zustand store and applied via `RemoteParticipant.setVolume()`. New Go endpoints handle promote/demote, video disable, chat block, and targeted deafen data packets.

**Tech Stack:** React 18, Radix UI (ContextMenu + DropdownMenu), Zustand, LiveKit client v2.18, Go Fiber, livekit.RoomService

---

## File Map

**New frontend files:**
- `apps/web/src/components/ui/context-menu.tsx` — Radix ContextMenu shadcn wrapper
- `apps/web/src/lib/participant-overrides.store.ts` — Zustand store for client-side mute/volume per identity
- `apps/web/src/lib/useLongPress.ts` — pointer-event long-press hook (mobile trigger)
- `apps/web/src/components/meeting/ParticipantContextMenu.tsx` — shared menu content + ContextMenu wrapper + 3-dot button

**Modified frontend files:**
- `apps/web/src/components/meeting/ParticipantTile.tsx` — add ContextMenu wrapper + 3-dot button + apply volume effect
- `apps/web/src/components/meeting/ParticipantsList.tsx` — replace basic dropdown with ParticipantMenuButton
- `apps/web/src/components/meeting/MeetingContext.tsx` — expand system message events; expose `spotlight` via pinned state

**New/modified backend files:**
- `server/internal/handlers/room.go` — add PromoteParticipant, DemoteParticipant, DisableParticipantVideo (implement stub), BlockChat, DeafenParticipant handlers
- `server/internal/server/server.go` — register new routes

---

## Task 1: Install Radix ContextMenu + scaffold context-menu.tsx

**Files:**
- Create: `apps/web/src/components/ui/context-menu.tsx`

- [ ] **Step 1: Install package**

```bash
cd apps/web && bun add @radix-ui/react-context-menu
```

- [ ] **Step 2: Create shadcn-style wrapper** at `apps/web/src/components/ui/context-menu.tsx`

```tsx
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import { cn } from '@/lib/utils'
import { Check, ChevronRight, Circle } from 'lucide-react'

export const ContextMenu = ContextMenuPrimitive.Root
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger
export const ContextMenuGroup = ContextMenuPrimitive.Group
export const ContextMenuPortal = ContextMenuPrimitive.Portal
export const ContextMenuSub = ContextMenuPrimitive.Sub
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

export function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & { inset?: boolean }) {
  return (
    <ContextMenuPrimitive.SubTrigger
      className={cn(
        'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
        inset && 'pl-8',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </ContextMenuPrimitive.SubTrigger>
  )
}

export function ContextMenuSubContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.SubContent
      className={cn('z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md', className)}
      {...props}
    />
  )
}

export function ContextMenuContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={cn('z-50 min-w-[10rem] overflow-hidden rounded-md border p-1 shadow-md', className)}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

export function ContextMenuItem({
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & { inset?: boolean }) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
}

export function ContextMenuSeparator({ className, ...props }: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>) {
  return <ContextMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px', className)} {...props} />
}

export function ContextMenuLabel({ className, inset, ...props }: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & { inset?: boolean }) {
  return (
    <ContextMenuPrimitive.Label
      className={cn('px-2 py-1.5 text-xs font-semibold', inset && 'pl-8', className)}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd apps/web && git add src/components/ui/context-menu.tsx && git commit -m "feat(ui): add Radix ContextMenu shadcn wrapper"
```

---

## Task 2: Participant overrides store (client-side mute/volume)

**Files:**
- Create: `apps/web/src/lib/participant-overrides.store.ts`

- [ ] **Step 1: Create Zustand store**

```typescript
// apps/web/src/lib/participant-overrides.store.ts
import { create } from 'zustand'

interface ParticipantOverridesState {
  // volume override: 0.0–1.0. Absent = use default (1.0)
  volumes: Map<string, number>
  // identities that are client-muted (volume forced to 0)
  muted: Set<string>
  setVolume: (identity: string, vol: number) => void
  toggleMute: (identity: string) => void
  isMuted: (identity: string) => boolean
  getVolume: (identity: string) => number
}

export const useParticipantOverridesStore = create<ParticipantOverridesState>((set, get) => ({
  volumes: new Map(),
  muted: new Set(),

  setVolume: (identity, vol) =>
    set((s) => {
      const volumes = new Map(s.volumes)
      volumes.set(identity, Math.max(0, Math.min(1, vol)))
      return { volumes }
    }),

  toggleMute: (identity) =>
    set((s) => {
      const muted = new Set(s.muted)
      if (muted.has(identity)) muted.delete(identity)
      else muted.add(identity)
      return { muted }
    }),

  isMuted: (identity) => get().muted.has(identity),

  getVolume: (identity) => {
    const { muted, volumes } = get()
    if (muted.has(identity)) return 0
    return volumes.get(identity) ?? 1
  },
}))
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/participant-overrides.store.ts && git commit -m "feat(meeting): add participant overrides store for client-side mute/volume"
```

---

## Task 3: Long-press hook (mobile context menu trigger)

**Files:**
- Create: `apps/web/src/lib/useLongPress.ts`

- [ ] **Step 1: Create hook**

```typescript
// apps/web/src/lib/useLongPress.ts
import { useCallback, useRef } from 'react'

export function useLongPress(callback: (e: React.PointerEvent) => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventRef = useRef<React.PointerEvent | null>(null)

  const start = useCallback(
    (e: React.PointerEvent) => {
      // Only trigger on touch/stylus, not mouse (mouse uses right-click)
      if (e.pointerType === 'mouse') return
      eventRef.current = e
      timerRef.current = setTimeout(() => {
        if (eventRef.current) callback(eventRef.current)
      }, ms)
    },
    [callback, ms]
  )

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/useLongPress.ts && git commit -m "feat(meeting): add useLongPress hook for mobile context menu trigger"
```

---

## Task 4: ParticipantContextMenu component

**Files:**
- Create: `apps/web/src/components/meeting/ParticipantContextMenu.tsx`

This is the core of the feature. It exports:
- `ParticipantMenuContent` — renders items using injected `Item`/`Separator`/`Label` components (works for both ContextMenu and DropdownMenu)
- `ParticipantContextMenu` — wraps children in a ContextMenu (right-click + long-press)
- `ParticipantMenuButton` — standalone 3-dot DropdownMenu button

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/meeting/ParticipantContextMenu.tsx
import { useState, useMemo, useCallback, type ComponentType } from 'react'
import type { Participant } from 'livekit-client'
import { Track } from 'livekit-client'
import { useParticipantInfo } from '@livekit/components-react'
import {
  VolumeX, Volume2, Pin, PinOff, MicOff, Mic, VideoOff, MessageSquareOff,
  UserX, Ban, ShieldCheck, ShieldMinus, MoreVertical, Activity, Monitor,
  BellRing,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuLabel, ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useMeetingContext } from '@/components/meeting/MeetingContext'
import { useParticipantOverridesStore } from '#/lib/participant-overrides.store'
import { api } from '#/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MenuItemProps {
  onClick?: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

interface ParticipantMenuContentProps {
  participant: Participant
  isPinned?: boolean
  onTogglePin?: () => void
  // Render props — caller passes the right Radix component family
  Item: ComponentType<MenuItemProps>
  Separator: ComponentType<{ className?: string }>
  Label: ComponentType<{ className?: string; children: React.ReactNode }>
  onClose?: () => void
}

function parseMeta(raw: string | undefined): { accesses?: string[] } {
  try { return JSON.parse(raw ?? '{}') } catch { return {} }
}

// ─── Shared menu content (works for ContextMenu AND DropdownMenu) ─────────────

export function ParticipantMenuContent({
  participant,
  isPinned,
  onTogglePin,
  Item,
  Separator,
  Label,
  onClose,
}: ParticipantMenuContentProps) {
  const { roomId, adminId, isAdmin, isModerator } = useMeetingContext()
  const canModerate = isAdmin || isModerator
  const { name, identity } = useParticipantInfo({ participant })
  const displayName = name ?? identity ?? '?'

  const meta = useMemo(() => parseMeta(participant.metadata), [participant.metadata])
  const accesses = meta.accesses ?? []
  const isRoomAdmin = identity === adminId
  const isMod = !isRoomAdmin && accesses.includes('moderator')
  const isScreenSharing = Boolean(participant.getTrackPublication(Track.Source.ScreenShare))

  const overrides = useParticipantOverridesStore()
  const clientMuted = overrides.isMuted(identity ?? '')
  const currentVolume = overrides.getVolume(identity ?? '')

  const [loading, setLoading] = useState<string | null>(null)
  async function call(key: string, fn: () => Promise<unknown>) {
    setLoading(key)
    try { await fn() } catch (e) { console.error(e) } finally { setLoading(null) }
  }

  const post = (path: string) => () =>
    api.post(`/api/room/${roomId}${path}`)

  // ── Section 1: Local audio controls (always shown for remote participants) ──

  const localSection = !participant.isLocal && (
    <>
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-white/30 px-2 py-1">
        Local
      </Label>
      <Item
        onClick={() => {
          overrides.toggleMute(identity ?? '')
          onClose?.()
        }}
        className="text-white/80 text-[13px] hover:bg-white/8"
      >
        {clientMuted
          ? <Volume2 size={13} className="mr-2 text-white/50" />
          : <VolumeX size={13} className="mr-2 text-white/50" />}
        {clientMuted ? 'Unmute (local)' : 'Mute (local)'}
      </Item>

      {/* Volume slider — rendered as a non-interactive menu row */}
      <div
        className="px-3 py-1.5 flex items-center gap-2"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <Volume2 size={11} className="text-white/30 flex-shrink-0" />
        <input
          type="range" min={0} max={100}
          value={Math.round(currentVolume * 100)}
          onChange={(e) => overrides.setVolume(identity ?? '', Number(e.target.value) / 100)}
          className="flex-1 h-1 accent-indigo-400"
          disabled={clientMuted}
          style={{ opacity: clientMuted ? 0.3 : 1 }}
        />
        <span className="text-[11px] text-white/30 w-7 text-right">
          {Math.round(currentVolume * 100)}%
        </span>
      </div>
    </>
  )

  // ── Section 2: Pin ────────────────────────────────────────────────────────

  const pinSection = onTogglePin && (
    <Item
      onClick={() => { onTogglePin(); onClose?.() }}
      className="text-white/80 text-[13px] hover:bg-white/8"
    >
      {isPinned
        ? <PinOff size={13} className="mr-2 text-white/50" />
        : <Pin size={13} className="mr-2 text-white/50" />}
      {isPinned ? 'Unpin' : 'Pin'}
    </Item>
  )

  // ── Section 3: Moderation (admin/mod, non-local, non-admin target) ─────────

  const modSection = canModerate && !participant.isLocal && !isRoomAdmin && (
    <>
      <Separator className="bg-white/7 my-1" />
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-white/30 px-2 py-1">
        Moderation
      </Label>
      <Item
        onClick={() => { call('srvmute', post(`/mute/${identity}`)); onClose?.() }}
        disabled={loading === 'srvmute'}
        className="text-white/80 text-[13px] hover:bg-white/8"
      >
        <MicOff size={13} className="mr-2 text-white/50" />
        Server mute
      </Item>
      <Item
        onClick={() => { call('srvvideo', post(`/video/${identity}/off`)); onClose?.() }}
        disabled={loading === 'srvvideo'}
        className="text-white/80 text-[13px] hover:bg-white/8"
      >
        <VideoOff size={13} className="mr-2 text-white/50" />
        Disable camera
      </Item>
      <Item
        onClick={() => { call('blockchat', post(`/chat/${identity}/block`)); onClose?.() }}
        disabled={loading === 'blockchat'}
        className="text-white/80 text-[13px] hover:bg-white/8"
      >
        <MessageSquareOff size={13} className="mr-2 text-white/50" />
        Block chat
      </Item>
      <Item
        onClick={() => { call('deafen', post(`/deafen/${identity}`)); onClose?.() }}
        disabled={loading === 'deafen'}
        className="text-white/80 text-[13px] hover:bg-white/8"
      >
        <VolumeX size={13} className="mr-2 text-white/50" />
        Server deafen
      </Item>
      <Separator className="bg-white/7 my-1" />
      <Item
        onClick={() => { call('askunmute', post(`/ask/${identity}/unmute`)); onClose?.() }}
        className="text-white/80 text-[13px] hover:bg-white/8"
      >
        <BellRing size={13} className="mr-2 text-white/50" />
        Ask to unmute
      </Item>
      <Item
        onClick={() => { call('askcam', post(`/ask/${identity}/camera`)); onClose?.() }}
        className="text-white/80 text-[13px] hover:bg-white/8"
      >
        <BellRing size={13} className="mr-2 text-white/50" />
        Ask to turn on camera
      </Item>
      <Item
        onClick={() => { call('spotlight', post(`/spotlight/${identity}`)); onClose?.() }}
        className="text-white/80 text-[13px] hover:bg-white/8"
      >
        <Monitor size={13} className="mr-2 text-white/50" />
        Spotlight for all
      </Item>
      {isScreenSharing && (
        <Item
          onClick={() => { call('stopscreen', post(`/screenshare/${identity}/stop`)); onClose?.() }}
          className="text-white/80 text-[13px] hover:bg-white/8"
        >
          <VideoOff size={13} className="mr-2 text-white/50" />
          Stop screen share
        </Item>
      )}
    </>
  )

  // ── Section 4: Role management (admin only, non-self, non-room-admin) ──────

  const roleSection = isAdmin && !participant.isLocal && !isRoomAdmin && (
    <>
      <Separator className="bg-white/7 my-1" />
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-white/30 px-2 py-1">
        Role
      </Label>
      {isMod ? (
        <Item
          onClick={() => { call('demote', post(`/demote/${identity}`)); onClose?.() }}
          disabled={loading === 'demote'}
          className="text-amber-300/80 text-[13px] hover:bg-white/8"
        >
          <ShieldMinus size={13} className="mr-2" />
          Demote from moderator
        </Item>
      ) : (
        <Item
          onClick={() => { call('promote', post(`/promote/${identity}`)); onClose?.() }}
          disabled={loading === 'promote'}
          className="text-green-300/80 text-[13px] hover:bg-white/8"
        >
          <ShieldCheck size={13} className="mr-2" />
          Promote to moderator
        </Item>
      )}
    </>
  )

  // ── Section 5: Kick / Ban (admin only) ────────────────────────────────────

  const kickSection = isAdmin && !participant.isLocal && !isRoomAdmin && (
    <>
      <Separator className="bg-white/7 my-1" />
      <Item
        onClick={() => { call('kick', post(`/kick/${identity}`)); onClose?.() }}
        disabled={loading === 'kick'}
        className="text-red-400 text-[13px] hover:bg-red-500/10"
      >
        <UserX size={13} className="mr-2" />
        Kick
      </Item>
      <Item
        onClick={() => { call('ban', post(`/ban/${identity}`)); onClose?.() }}
        disabled={loading === 'ban'}
        className="text-red-400 text-[13px] hover:bg-red-500/10"
      >
        <Ban size={13} className="mr-2" />
        Ban
      </Item>
    </>
  )

  // ── Section 6: Stats ──────────────────────────────────────────────────────

  const statsSection = (
    <>
      <Separator className="bg-white/7 my-1" />
      <StatsRow participant={participant} Item={Item} isAdmin={isAdmin} />
    </>
  )

  return (
    <>
      {localSection}
      {pinSection}
      {modSection}
      {roleSection}
      {kickSection}
      {statsSection}
    </>
  )
}

// ─── Stats row ─────────────────────────────────────────────────────────────

function StatsRow({
  participant,
  Item,
  isAdmin,
}: {
  participant: Participant
  Item: ComponentType<MenuItemProps>
  isAdmin: boolean
}) {
  const [open, setOpen] = useState(false)
  const quality = participant.connectionQuality

  const qualityColor =
    quality === 'excellent' ? '#6ee7b7'
    : quality === 'good'    ? '#a5b4fc'
    : quality === 'poor'    ? '#fbbf24'
    : '#f87171'

  const audioTrack = participant.getTrackPublication(Track.Source.Microphone)
  const videoTrack = participant.getTrackPublication(Track.Source.Camera)
  const audioCodec = audioTrack?.codec ?? '—'
  const videoCodec = videoTrack?.codec ?? '—'

  return (
    <>
      <Item
        onClick={() => setOpen((v) => !v)}
        className="text-white/50 text-[13px] hover:bg-white/8"
      >
        <Activity size={13} className="mr-2" />
        Connection stats
      </Item>
      {open && (
        <div className="px-3 py-2 text-[11px] text-white/50 space-y-1 border-t border-white/5">
          <div className="flex justify-between">
            <span>Quality</span>
            <span style={{ color: qualityColor }}>{quality}</span>
          </div>
          <div className="flex justify-between">
            <span>Audio codec</span>
            <span className="text-white/70">{audioCodec}</span>
          </div>
          <div className="flex justify-between">
            <span>Video codec</span>
            <span className="text-white/70">{videoCodec}</span>
          </div>
          <div className="flex justify-between">
            <span>Server muted</span>
            <span className="text-white/70">{participant.isMicrophoneEnabled ? 'no' : 'yes'}</span>
          </div>
          {isAdmin && (
            <AdminStatsRows participantIdentity={participant.identity} />
          )}
        </div>
      )}
    </>
  )
}

function AdminStatsRows({ participantIdentity }: { participantIdentity: string }) {
  const { roomId } = useMeetingContext()
  const [info, setInfo] = useState<{ ip?: string; country?: string } | null>(null)

  const load = useCallback(async () => {
    if (info) return
    try {
      const data = await api.get<{ ip?: string; country?: string }>(
        `/api/room/${roomId}/participant/${participantIdentity}/info`
      )
      setInfo(data)
    } catch { setInfo({}) }
  }, [roomId, participantIdentity, info])

  // Load on mount
  useState(() => { load() })

  if (!info) return <div className="text-white/30 text-[11px]">Loading…</div>

  return (
    <>
      {info.ip && (
        <div className="flex justify-between">
          <span>IP</span>
          <span className="text-white/70 font-mono">{info.ip}</span>
        </div>
      )}
      {info.country && (
        <div className="flex justify-between">
          <span>Country</span>
          <span className="text-white/70">{info.country}</span>
        </div>
      )}
    </>
  )
}

// ─── ContextMenu surface (right-click + long-press wrapper) ──────────────────

interface ParticipantContextMenuProps {
  participant: Participant
  isPinned?: boolean
  onTogglePin?: () => void
  children: React.ReactNode
}

export function ParticipantContextMenu({
  participant,
  isPinned,
  onTogglePin,
  children,
}: ParticipantContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        style={{
          background: 'rgba(15,15,28,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          minWidth: 220,
        }}
      >
        <ParticipantMenuContent
          participant={participant}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
          Item={({ onClick, disabled, className, children }) => (
            <ContextMenuItem onClick={onClick} disabled={disabled} className={className}>
              {children}
            </ContextMenuItem>
          )}
          Separator={({ className }) => <ContextMenuSeparator className={className} />}
          Label={({ className, children }) => (
            <ContextMenuLabel className={className}>{children}</ContextMenuLabel>
          )}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ─── DropdownMenu 3-dot button surface ───────────────────────────────────────

interface ParticipantMenuButtonProps {
  participant: Participant
  isPinned?: boolean
  onTogglePin?: () => void
}

export function ParticipantMenuButton({ participant, isPinned, onTogglePin }: ParticipantMenuButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          }}
          aria-label="Participant options"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical size={12} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        style={{
          background: 'rgba(15,15,28,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          minWidth: 220,
        }}
      >
        <ParticipantMenuContent
          participant={participant}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
          onClose={() => setOpen(false)}
          Item={({ onClick, disabled, className, children }) => (
            <DropdownMenuItem onClick={onClick} disabled={disabled} className={className}>
              {children}
            </DropdownMenuItem>
          )}
          Separator={({ className }) => <DropdownMenuSeparator className={className} />}
          Label={({ className, children }) => (
            <div className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/30 ${className ?? ''}`}>
              {children}
            </div>
          )}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/meeting/ParticipantContextMenu.tsx && git commit -m "feat(meeting): add ParticipantContextMenu with role-gated actions"
```

---

## Task 5: Update ParticipantTile — right-click, long-press, 3-dot, volume effect

**Files:**
- Modify: `apps/web/src/components/meeting/ParticipantTile.tsx`

- [ ] **Step 1: Apply volume overrides via useEffect**

After the existing `useEffect` that tracks track changes, add:

```tsx
import type { RemoteParticipant } from 'livekit-client'
import { useParticipantOverridesStore } from '#/lib/participant-overrides.store'
import { useLongPress } from '#/lib/useLongPress'
import { ParticipantContextMenu, ParticipantMenuButton } from '@/components/meeting/ParticipantContextMenu'

// Inside the component, after existing hooks:
const volume = useParticipantOverridesStore((s) => s.getVolume(identity ?? ''))

useEffect(() => {
  if (participant.isLocal) return
  const rp = participant as RemoteParticipant
  rp.setVolume(volume)
}, [participant, volume])
```

- [ ] **Step 2: Add long-press handler**

```tsx
// Inside component, after volume effect:
const [contextMenuOpen, setContextMenuOpen] = useState(false)

const longPressHandlers = useLongPress(
  useCallback(() => setContextMenuOpen(true), []),
  500
)
```

- [ ] **Step 3: Wrap tile in ParticipantContextMenu and add 3-dot button**

Replace the outermost `<div className="meet-tile group ...">` wrapper to be:

```tsx
return (
  <ParticipantContextMenu
    participant={participant}
    isPinned={isPinned}
    onTogglePin={onTogglePin}
  >
    <div
      className={`meet-tile group${isSpeaking ? ' meet-speaking' : ''}`}
      {...longPressHandlers}
      style={{ ... /* existing styles */ }}
    >
      {/* existing content: video, avatar, badges, pin button */}

      {/* 3-dot button — top-left corner, visible on hover */}
      {!participant.isLocal && (
        <div
          className="group-hover:opacity-100 opacity-0 transition-opacity duration-150"
          style={{ position: 'absolute', top: 8, left: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <ParticipantMenuButton
            participant={participant}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
          />
        </div>
      )}
    </div>
  </ParticipantContextMenu>
)
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/meeting/ParticipantTile.tsx && git commit -m "feat(meeting): add context menu and volume control to ParticipantTile"
```

---

## Task 6: Update ParticipantsList — use ParticipantMenuButton

**Files:**
- Modify: `apps/web/src/components/meeting/ParticipantsList.tsx`

- [ ] **Step 1: Replace basic DropdownMenu with ParticipantMenuButton**

Remove the existing DropdownMenu import block and `handleMute`/`handleKick`/`handleBan` handler functions from `ParticipantsList` (they're now in the context menu component). Replace the `{canModerate && !p.isLocal && (<DropdownMenu>...</DropdownMenu>)}` block in `ParticipantRow` with:

```tsx
import { ParticipantMenuButton } from '@/components/meeting/ParticipantContextMenu'

// In ParticipantRow, replace the dropdown block:
{!p.isLocal && (
  <div
    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    onClick={(e) => e.stopPropagation()}
  >
    <ParticipantMenuButton participant={p} />
  </div>
)}
```

Remove unused imports: `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuTrigger`, `MicOff`, `UserX`, `Ban`, `MoreVertical`.

Remove `loadingIdentity` state and `handleMute`/`handleKick`/`handleBan` functions from `ParticipantsList` (they're now inside `ParticipantMenuContent`).

Remove the `loading`, `onMute`, `onKick`, `onBan` props from `RowProps` interface and from the `ParticipantRow` function signature.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/meeting/ParticipantsList.tsx && git commit -m "refactor(meeting): replace basic dropdown with ParticipantMenuButton in participants list"
```

---

## Task 7: Expand MeetingContext for new system message events

**Files:**
- Modify: `apps/web/src/components/meeting/MeetingContext.tsx`

- [ ] **Step 1: Expand known system events**

```tsx
// Change:
const KNOWN_SYSTEM_EVENTS = new Set(['kick', 'ban'])

// To:
const KNOWN_SYSTEM_EVENTS = new Set([
  'kick', 'ban', 'ask_unmute', 'ask_camera', 'spotlight', 'deafen', 'undeafen'
])

// Expand SystemMessage type:
export interface SystemMessage {
  type: 'system'
  event: 'kick' | 'ban' | 'ask_unmute' | 'ask_camera' | 'spotlight' | 'deafen' | 'undeafen'
  actor: string
  target: string
  ts: number
}
```

- [ ] **Step 2: Add deafen self-state and spotlight handler to context**

Add to `MeetingContextValue`:
```tsx
isServerDeafened: boolean
```

Inside `MeetingProvider`, add:
```tsx
const [isServerDeafened, setIsServerDeafened] = useState(false)
```

In the `DataReceived` handler, after the existing validation, add action dispatch:
```tsx
const parsed = raw as SystemMessage
// Auto-apply deafen to self
if (parsed.event === 'deafen' && parsed.target === currentUserId) {
  setIsServerDeafened(true)
}
if (parsed.event === 'undeafen' && parsed.target === currentUserId) {
  setIsServerDeafened(false)
}
```

Add `isServerDeafened` to the memoized context value.

- [ ] **Step 3: Apply server-deafen to all remote participants**

In the meeting page (`apps/web/src/routes/m.$meetId.tsx`), or in a new small component `DeafenApplier.tsx` placed inside the LiveKit room:

```tsx
// In a component inside <LiveKitRoom>:
function DeafenApplier() {
  const { isServerDeafened } = useMeetingContext()
  const participants = useParticipants()
  
  useEffect(() => {
    participants.forEach((p) => {
      if (!p.isLocal) {
        (p as RemoteParticipant).setVolume(isServerDeafened ? 0 : 1)
      }
    })
  }, [isServerDeafened, participants])
  
  return null
}
```

Note: the overrides store volume still applies for individual participant volume control. DeafenApplier should set volume to 0 regardless of per-participant overrides when deafened.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/meeting/MeetingContext.tsx && git commit -m "feat(meeting): expand system messages for deafen, spotlight, ask-unmute events"
```

---

## Task 8: Go backend — PromoteParticipant and DemoteParticipant

**Files:**
- Modify: `server/internal/handlers/room.go`

- [ ] **Step 1: Add PromoteParticipant handler**

Add after `BanParticipant`:

```go
func (h *RoomHandler) PromoteParticipant(c *fiber.Ctx) error {
	return h.setParticipantRole(c, "moderator", true)
}

func (h *RoomHandler) DemoteParticipant(c *fiber.Ctx) error {
	return h.setParticipantRole(c, "moderator", false)
}

func (h *RoomHandler) setParticipantRole(c *fiber.Ctx, role string, add bool) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)

	room, err := h.roomRepo.GetRoom(roomID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to look up room"})
	}
	if room == nil {
		return c.SendStatus(404)
	}
	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}
	if claims.UserID != adminId && !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}

	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	p, err := h.client.GetParticipant(ctx, &livekit.RoomParticipantIdentity{Room: room.Name, Identity: identity})
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Participant not found"})
	}

	// Parse current metadata
	var meta struct {
		Accesses []string `json:"accesses"`
	}
	if p.Metadata != "" {
		_ = json.Unmarshal([]byte(p.Metadata), &meta)
	}

	// Add or remove the role
	if add {
		if !containsAccess(meta.Accesses, role) {
			meta.Accesses = append(meta.Accesses, role)
		}
	} else {
		filtered := meta.Accesses[:0]
		for _, a := range meta.Accesses {
			if a != role {
				filtered = append(filtered, a)
			}
		}
		meta.Accesses = filtered
	}

	newMetaBytes, _ := json.Marshal(meta)
	_, err = h.client.UpdateParticipant(ctx, &livekit.UpdateParticipantRequest{
		Room:     room.Name,
		Identity: identity,
		Metadata: string(newMetaBytes),
	})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"status": "success"})
}
```

- [ ] **Step 2: Commit**

```bash
cd server && git add internal/handlers/room.go && git commit -m "feat(server): add PromoteParticipant and DemoteParticipant handlers"
```

---

## Task 9: Go backend — implement video disable, block chat, deafen, ask endpoints

**Files:**
- Modify: `server/internal/handlers/room.go`

- [ ] **Step 1: Implement DisableParticipantVideo (replace stub)**

```go
func (h *RoomHandler) DisableParticipantVideo(c *fiber.Ctx) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)
	room, err := h.roomRepo.GetRoom(roomID)
	if err != nil || room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}
	if claims.UserID != adminId && !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	p, err := h.client.GetParticipant(ctx, &livekit.RoomParticipantIdentity{Room: room.Name, Identity: identity})
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Participant not found"})
	}
	for _, track := range p.Tracks {
		if track.Type == livekit.TrackType_VIDEO {
			_, _ = h.client.MutePublishedTrack(ctx, &livekit.MuteRoomTrackRequest{
				Room: room.Name, Identity: identity, TrackSid: track.Sid, Muted: true,
			})
		}
	}
	return c.JSON(fiber.Map{"status": "success"})
}
```

- [ ] **Step 2: Add BlockChat handler**

```go
func (h *RoomHandler) BlockChat(c *fiber.Ctx) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)
	room, err := h.roomRepo.GetRoom(roomID)
	if err != nil || room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}
	if claims.UserID != adminId && !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
	if err := h.roomRepo.BlockParticipantChat(roomID, identity); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to block chat"})
	}
	h.sendSystemMessage(c.Context(), room.Name, "chat_blocked", claims.UserID, identity)
	return c.JSON(fiber.Map{"status": "success"})
}
```

Note: `h.roomRepo.BlockParticipantChat` needs to be added to the repository (see Task 9 Step 4).

- [ ] **Step 3: Add DeafenParticipant handler**

```go
func (h *RoomHandler) DeafenParticipant(c *fiber.Ctx) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)
	room, err := h.roomRepo.GetRoom(roomID)
	if err != nil || room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}
	if claims.UserID != adminId && !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	h.sendTargetedSystemMessage(ctx, room.Name, "deafen", claims.UserID, identity)
	return c.JSON(fiber.Map{"status": "success"})
}
```

- [ ] **Step 4: Add AskAction handler (for ask_unmute and ask_camera)**

```go
func (h *RoomHandler) AskParticipantAction(c *fiber.Ctx) error {
	roomID, identity, action := c.Params("roomId"), c.Params("identity"), c.Params("action")
	if action != "unmute" && action != "camera" {
		return c.Status(400).JSON(fiber.Map{"error": "Unknown action"})
	}
	claims := c.Locals("user").(*auth.Claims)
	room, err := h.roomRepo.GetRoom(roomID)
	if err != nil || room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}
	if claims.UserID != adminId && !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	event := "ask_unmute"
	if action == "camera" {
		event = "ask_camera"
	}
	h.sendTargetedSystemMessage(ctx, room.Name, event, claims.UserID, identity)
	return c.JSON(fiber.Map{"status": "success"})
}
```

- [ ] **Step 5: Add SpotlightParticipant handler (broadcast to all)**

```go
func (h *RoomHandler) SpotlightParticipant(c *fiber.Ctx) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)
	room, err := h.roomRepo.GetRoom(roomID)
	if err != nil || room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}
	if claims.UserID != adminId && !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	// Broadcast to all (no DestinationIdentities = everyone)
	h.sendSystemMessage(ctx, room.Name, "spotlight", claims.UserID, identity)
	return c.JSON(fiber.Map{"status": "success"})
}
```

- [ ] **Step 6: Add StopScreenShare handler**

```go
func (h *RoomHandler) StopScreenShare(c *fiber.Ctx) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)
	room, err := h.roomRepo.GetRoom(roomID)
	if err != nil || room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}
	if claims.UserID != adminId && !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	p, err := h.client.GetParticipant(ctx, &livekit.RoomParticipantIdentity{Room: room.Name, Identity: identity})
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Participant not found"})
	}
	for _, track := range p.Tracks {
		if track.Source == livekit.TrackSource_SCREEN_SHARE || track.Source == livekit.TrackSource_SCREEN_SHARE_AUDIO {
			_, _ = h.client.MutePublishedTrack(ctx, &livekit.MuteRoomTrackRequest{
				Room: room.Name, Identity: identity, TrackSid: track.Sid, Muted: true,
			})
		}
	}
	return c.JSON(fiber.Map{"status": "success"})
}
```

- [ ] **Step 7: Add sendTargetedSystemMessage helper**

```go
func (h *RoomHandler) sendTargetedSystemMessage(ctx context.Context, roomName, event, actor, target string) {
	type sysMsg struct {
		Type   string `json:"type"`
		Event  string `json:"event"`
		Actor  string `json:"actor"`
		Target string `json:"target"`
	}
	b, _ := json.Marshal(sysMsg{Type: "system", Event: event, Actor: actor, Target: target})
	topic := "system"
	_, _ = h.client.SendData(ctx, &livekit.SendDataRequest{
		Room:                  roomName,
		Data:                  b,
		Kind:                  livekit.DataPacket_RELIABLE,
		Topic:                 &topic,
		DestinationIdentities: []string{target},
	})
}
```

- [ ] **Step 8: Add BlockParticipantChat to repository**

In `server/internal/repository/room_repository.go`, add:

```go
func (r *RoomRepository) BlockParticipantChat(roomID, userID string) error {
	return r.db.Model(&models.RoomParticipant{}).
		Where("room_id = ? AND user_id = ?", roomID, userID).
		Update("is_chat_blocked", true).Error
}
```

- [ ] **Step 9: Add GetParticipantInfo handler (for admin stats)**

```go
func (h *RoomHandler) GetParticipantInfo(c *fiber.Ctx) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)
	room, err := h.roomRepo.GetRoom(roomID)
	if err != nil || room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}
	if claims.UserID != adminId && !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	p, err := h.client.GetParticipant(ctx, &livekit.RoomParticipantIdentity{Room: room.Name, Identity: identity})
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Participant not found"})
	}
	return c.JSON(fiber.Map{
		"identity":          p.Identity,
		"connectionQuality": p.ConnectionQuality.String(),
		"joinedAt":          p.JoinedAt,
		// IP is not available from LiveKit; future enhancement
	})
}
```

- [ ] **Step 10: Commit**

```bash
cd server && git add internal/handlers/room.go internal/repository/room_repository.go && git commit -m "feat(server): implement video disable, block chat, deafen, spotlight, ask, screen share stop handlers"
```

---

## Task 10: Register new routes in server.go

**Files:**
- Modify: `server/internal/server/server.go`

- [ ] **Step 1: Add new route registrations**

After the existing room routes (around line 190 where `/ban` is registered), add:

```go
api.Post("/room/:roomId/promote/:identity",         middleware.Protected(), roomHandler.PromoteParticipant)
api.Post("/room/:roomId/demote/:identity",           middleware.Protected(), roomHandler.DemoteParticipant)
api.Post("/room/:roomId/video/:identity/off",        middleware.Protected(), roomHandler.DisableParticipantVideo)
api.Post("/room/:roomId/chat/:identity/block",       middleware.Protected(), roomHandler.BlockChat)
api.Post("/room/:roomId/deafen/:identity",           middleware.Protected(), roomHandler.DeafenParticipant)
api.Post("/room/:roomId/ask/:identity/:action",      middleware.Protected(), roomHandler.AskParticipantAction)
api.Post("/room/:roomId/spotlight/:identity",        middleware.Protected(), roomHandler.SpotlightParticipant)
api.Post("/room/:roomId/screenshare/:identity/stop", middleware.Protected(), roomHandler.StopScreenShare)
api.Get("/room/:roomId/participant/:identity/info",  middleware.Protected(), roomHandler.GetParticipantInfo)
```

Note: the existing `/room:roomId/video/:identity/off` route (line 191) has a typo — it's missing the `/` before `:roomId`. Fix it at the same time:
```go
// Remove the broken line:
// api.Post("/room:roomId/video/:identity/off", ...)
// It's now replaced by the fixed route above.
```

- [ ] **Step 2: Build to check for errors**

```bash
cd server && go build ./...
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add internal/server/server.go && git commit -m "feat(server): register new participant action routes"
```

---

## Task 11: Handle spotlight system message in the frontend

**Files:**
- Modify: `apps/web/src/routes/m.$meetId.tsx`

- [ ] **Step 1: Listen for spotlight event and pin the target**

In `MeetingLayout` (or wherever `usePinnedParticipants` is used), add a useEffect that listens to `systemMessages` and pins the spotlight target:

```tsx
// Inside MeetingLayout or the component that owns pinned state:
const { systemMessages } = useMeetingContext()
const { toggle } = pinned // usePinnedParticipants result

useEffect(() => {
  const last = systemMessages[systemMessages.length - 1]
  if (!last) return
  if (last.event === 'spotlight') {
    // Pin the spotlighted participant for everyone
    toggle(last.target)
  }
}, [systemMessages])
```

- [ ] **Step 2: Show ask_unmute / ask_camera as a visible notification**

In `m.$meetId.tsx`, add a toast-style overlay that appears when you receive these events targeting `currentUserId`:

```tsx
const { systemMessages, currentUserId } = useMeetingContext()
const [askNotice, setAskNotice] = useState<'unmute' | 'camera' | null>(null)

useEffect(() => {
  const last = systemMessages[systemMessages.length - 1]
  if (!last) return
  if (last.target !== currentUserId) return
  if (last.event === 'ask_unmute') setAskNotice('unmute')
  if (last.event === 'ask_camera') setAskNotice('camera')
}, [systemMessages, currentUserId])

// Render a dismissable banner (inside MeetingLayout, z-index 50):
{askNotice && (
  <div style={{
    position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(99,102,241,0.9)', backdropFilter: 'blur(12px)',
    borderRadius: 12, padding: '10px 20px',
    color: 'white', fontSize: 13, fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: 12,
    zIndex: 50,
  }}>
    <BellRing size={14} />
    {askNotice === 'unmute' ? 'You have been asked to unmute' : 'You have been asked to turn on your camera'}
    <button
      onClick={() => setAskNotice(null)}
      style={{ marginLeft: 8, opacity: 0.6, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
    >
      ✕
    </button>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/m.\$meetId.tsx && git commit -m "feat(meeting): handle spotlight and ask-action system messages"
```

---

## Verification

- [ ] Right-click any participant tile → context menu appears with role-appropriate items
- [ ] Long-press on mobile (pointer type = touch) → same menu opens
- [ ] 3-dot button on tile (hover) → dropdown opens with same items
- [ ] 3-dot button in participants list → same menu
- [ ] Volume slider changes audio level for that participant only
- [ ] Client mute silences that participant locally; other users still hear them
- [ ] Admin can promote/demote → participant's role badge updates in real-time for all users
- [ ] Server mute silences the participant's mic for everyone
- [ ] Disable camera turns off their video track
- [ ] Kick and Ban work as before
- [ ] Admin sees "Ask to unmute" → target participant sees the banner
- [ ] Spotlight → all participants auto-pin that person
- [ ] Server deafen → target participant hears nobody

```bash
# Build server
cd server && go build ./...

# Build frontend
cd apps/web && bun run build
```
