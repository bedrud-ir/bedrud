# Screen Share + Participant Pin/Spotlight — Web Meeting

**Date:** 2026-04-06
**Scope:** Web app only (`apps/web`)
**Status:** Approved

---

## Overview

Add Google Meet–style screen sharing and participant pinning to the web meeting room. When a screen share is active or a participant is pinned, the layout switches from the existing tile grid to a new `FocusLayout`: a large main area showing focused content and a compact scrollable strip showing everyone else.

---

## Layout Switching

The meeting root (`m.$meetId.tsx`) controls which layout renders. Priority (highest wins):

1. **FocusLayout** — any `Track.Source.ScreenShare` track is live in the room, OR ≥1 participant identity is in the local pin set
2. **ParticipantGrid** — default; no active screen shares, no pins

`SpotlightView` is removed from the meeting root's layout switcher. It is no longer used in the main flow.

---

## New Components

### `FocusLayout.tsx`
`apps/web/src/components/meeting/FocusLayout.tsx`

Renders two regions:

**Main area** — large, fills available height:
- Screen share tracks shown first (one or more), rendered via `ScreenShareTile`
- Pinned camera participants shown after, rendered via `ParticipantTile`
- When multiple items: CSS grid, max 3 columns, equal width, wraps to additional rows beyond 3 items

**Strip** — fixed-height row (or column on narrow viewports) of compact thumbnails:
- All participants NOT in the main area
- Each thumbnail: 160×90 px, name label, muted indicator
- Horizontally scrollable

Props:
```ts
interface FocusLayoutProps {
  pinnedIdentities: Set<string>
  onUnpin: (identity: string) => void
}
```

The component reads screen share tracks internally via `useTracks([Track.Source.ScreenShare])`.

---

### `ScreenShareTile.tsx`
`apps/web/src/components/meeting/ScreenShareTile.tsx`

Renders a single `Track.Source.ScreenShare` track:
- `<VideoTrack>` with `object-fit: contain` (never crops)
- Thin indigo border to distinguish from camera tiles
- Name label bottom-left: "{name} is presenting"
- No avatar fallback (screen shares are always video)

Props:
```ts
interface ScreenShareTileProps {
  trackRef: TrackReferenceOrPlaceholder
}
```

---

### `usePinnedParticipants.ts`
`apps/web/src/lib/usePinnedParticipants.ts`

Local-only React hook (not synced to server or other clients).

```ts
interface UsePinnedParticipants {
  pinned: Set<string>           // participant identities
  toggle: (identity: string) => void
  unpin: (identity: string) => void
  clear: () => void
  isPinned: (identity: string) => boolean
}
```

Backed by `useState<Set<string>>`. `clear()` called on room disconnect.

---

## Modified Components

### `ControlsBar.tsx`

Add a screen share toggle button between the noise suppression dropdown and the divider before Leave:

- Icon: `MonitorUp` (sharing active: `MonitorOff`, colored red)
- Tooltip: "Share screen" / "Stop sharing"
- `onClick`: `localParticipant.setScreenShareEnabled(!isScreenShareEnabled)`
- `isScreenShareEnabled` read from `useLocalParticipant()`
- Only shown when not in a guest session (guests cannot share — enforce via disabled state with tooltip "Sign in to share screen")

### `ParticipantTile.tsx`

Add a pin button to the hover overlay:

- Appears on hover (already has hover state for other controls)
- Icon: `Pin` (filled when pinned, outline when not)
- Position: top-right corner of the tile
- `onClick`: calls `toggle(participant.identity)` from `usePinnedParticipants` passed as a prop
- Tooltip: "Pin" / "Unpin"

New prop added:
```ts
isPinned: boolean
onTogglePin: () => void
```

### `m.$meetId.tsx`

Add layout switching logic:

```ts
const { pinned, toggle, unpin, clear } = usePinnedParticipants()
const screenShareTracks = useTracks([Track.Source.ScreenShare])
const isFocusMode = screenShareTracks.length > 0 || pinned.size > 0

// On disconnect:
useEffect(() => { return () => clear() }, [])
```

Render:
```tsx
{isFocusMode
  ? <FocusLayout pinnedIdentities={pinned} onUnpin={unpin} />
  : <ParticipantGrid onTogglePin={toggle} pinnedIdentities={pinned} />
}
```

Pass `onTogglePin` and `isPinned` down through `ParticipantGrid` → `ParticipantTile`.

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Screen share starts while participants are pinned | Screen share joins main area alongside pinned tiles |
| Sharer leaves the room | LiveKit removes the track automatically; layout reverts to grid if no pins remain |
| Pinned participant leaves | Their identity is silently dropped from the pin set on next render (LiveKit participant list no longer includes them) |
| User shares screen on mobile browser | `getDisplayMedia()` may be unavailable; button disabled with tooltip "Not supported on this device" |
| Multiple people share simultaneously | All screen share tracks shown in main area (LiveKit allows this by default) |

---

## Out of Scope

- Server-side "admin pins for everyone" (each viewer pins locally, same as Google Meet)
- Annotation or drawing on screen share
- Remote control
- Screen share audio (can be added later — LiveKit supports it)
- Mobile app (separate effort)

---

## Files Changed

| File | Change |
|---|---|
| `apps/web/src/components/meeting/FocusLayout.tsx` | **New** |
| `apps/web/src/components/meeting/ScreenShareTile.tsx` | **New** |
| `apps/web/src/lib/usePinnedParticipants.ts` | **New** |
| `apps/web/src/components/meeting/ControlsBar.tsx` | Add screen share button |
| `apps/web/src/components/meeting/ParticipantTile.tsx` | Add pin button on hover |
| `apps/web/src/routes/m.$meetId.tsx` | Layout switching logic |
