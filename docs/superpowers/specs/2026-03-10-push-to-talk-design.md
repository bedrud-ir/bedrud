# Push to Talk (PTT) — Design Spec

**Date:** 2026-03-10
**Status:** Approved
**Platforms:** Web (Svelte), iOS (SwiftUI), Android (Jetpack Compose)

---

## Summary

Add a Push to Talk button to the meeting control bar on all three platforms. PTT coexists with the existing mic toggle. Holding PTT unmutes the microphone momentarily; releasing restores the previous toggle state. Modeled after Discord's PTT behavior.

---

## Architecture

PTT is a **local mic gate** that sits above the existing mic toggle state. It is purely client-side — no server changes, no LiveKit metadata, no data messages.

```
┌──────────────────────────────────────────────┐
│  Mic Toggle State  (user's persistent intent)│
│  isMicEnabled = true | false                 │
├──────────────────────────────────────────────┤
│  PTT Gate  (transient override)              │
│  isPttActive = true → force mic ON           │
│  isPttActive = false → restore toggle state  │
└──────────────────────────────────────────────┘
              │
              ▼
  setMicrophone(isMicEnabled || isPttActive)
```

### Mic gate rule
- PTT **hold** → `setMicrophone(true)` immediately
- PTT **release** → 250ms delay → `setMicrophone(isMicEnabled)`
- `isMicEnabled` (toggle state) is never modified by PTT

---

## UI Behavior

### Control bar
- A small PTT button is added alongside the existing mic/camera buttons
- Icon: microphone with a lock/hold indicator (e.g., `walkie-talkie` or `mic + hold` style)
- Tapping/clicking does nothing — only hold activates PTT

### Floating overlay (while held)
- A large, prominent button appears at the bottom-center of the meeting view
- Shows "🔴 Transmitting..." or similar label
- Disappears after the release delay

### Remote participants
- See only the **normal speaking ring** (existing audio level indicator) when PTT is active
- No PTT-specific badge — identical to regular mic-on behavior (Discord pattern)

---

## Web-specific: Keyboard Shortcut

- **Default key:** Space bar
- **Configurable:** Yes — user can set a custom key in room settings
- Stored in `localStorage` under `ptt_key`
- Only active when the meeting view is focused (not when typing in chat)
- `keydown` (not repeat) → PTT hold; `keyup` → PTT release

---

## Per-platform Implementation Points

### Web (Svelte — `/m/[meetId]/+page.svelte`)
- Add `isPttActive = $state(false)` and `pttKey = $state('Space')`
- PTT button: `pointerdown` → start PTT, `pointerup`/`pointerleave` → end PTT
- Keyboard: `keydown`/`keyup` listener on `window`, guarded by focus (skip if `activeElement` is input/textarea)
- Floating overlay: conditionally rendered `<div>` with fixed positioning, visible when `isPttActive`

### iOS (SwiftUI — `ControlBar.swift` + `RoomManager.swift`)
- Add `@Published var isPttActive: Bool = false` to `RoomManager`
- PTT button uses `.simultaneousGesture(DragGesture(minimumDistance: 0))` for hold detection
- `onChanged` → `startPtt()`, `onEnded` → `stopPtt()`
- Floating overlay: conditional `VStack` overlay in `MeetingView`

### Android (Compose — `MeetingScreen.kt` + `RoomManager.kt`)
- Add `private val _isPttActive = MutableStateFlow(false)` to `RoomManager`
- PTT button uses `pointerInput` with `awaitPointerEventScope` for press/release
- `PointerEventType.Press` → `startPtt()`, `PointerEventType.Release` → `stopPtt()`
- Floating overlay: `Box` with `align(Alignment.BottomCenter)` inside the meeting `Box`

---

## PTT Helper Methods (all platforms)

```
fun startPtt():
  isPttActive = true
  setMicrophone(enabled: true)

fun stopPtt():
  delay(250ms)
  isPttActive = false
  setMicrophone(enabled: isMicEnabled)  // restore toggle state
```

---

## Out of Scope (v1)

- Configurable release delay
- PTT-specific remote badge (Discord doesn't have this either)
- PTT mode as a room-level setting (admin enforced)
- Haptic feedback (can be added in v2)
