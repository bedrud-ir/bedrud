# Chat UI Redesign

**Date:** 2026-04-14  
**Scope:** `apps/web/src/components/meeting/ChatPanel.tsx` and new sub-components  
**Status:** Approved

---

## Overview

Redesign the in-meeting chat panel to support Telegram-style message grouping, avatars, timestamps, a better input area, an improved scroll UX, and client-side session persistence — without any server-side storage.

---

## File Structure

```
apps/web/src/components/meeting/
  ChatPanel.tsx                  ← thin coordinator (shrink existing file)
  chat/
    ChatMessageList.tsx          ← scroll container + date separators + cluster list
    ChatMessageCluster.tsx       ← avatar + name + bubbles + last-bubble timestamp
    ChatInput.tsx                ← auto-grow textarea + expand button
    ChatScrollManager.tsx        ← floating ↓ button + "↑ N new messages" banner
    useChatPersistence.ts        ← sessionStorage read/write hook
    chatGrouping.ts              ← pure function: ChatMessage[] → DisplayItem[]
```

`ChatPanel` imports and wires these together. No logic lives in `ChatPanel` itself.

---

## Message Grouping

### Data model

`chatGrouping.ts` exports one pure function:

```ts
groupMessages(
  messages: ChatMessage[],
  systemMessages: SystemMessage[]
): DisplayItem[]
```

A `DisplayItem` is one of:

```ts
| { kind: 'date-separator'; label: string }
| { kind: 'cluster'; sender: string; identity: string; isLocal: boolean; messages: ChatMessage[] }
| { kind: 'system'; msg: SystemMessage }
```

### Cluster boundary rules

- New cluster when sender identity changes
- New cluster when >5 minutes have elapsed since the last message in the current cluster
- New cluster after a date separator
- System messages (kick/ban) are always standalone — they do not belong to a cluster

### Date separators

- `"Today"` for messages sent on the current calendar day
- `"Yesterday"` for the previous day
- `"April 12"` (locale format) for older messages
- Computed from `message.timestamp` in the user's local timezone

### Timestamp rendering

- The **last bubble** of each cluster shows a relative time: `"just now"`, `"2m ago"`, `"1h ago"`
- Hovering that timestamp reveals the absolute time via `title` attribute: `"2:34 PM"`
- Relative times update passively (re-render on message list change is sufficient; no interval timer needed)

---

## Avatar & Cluster Layout

### Remote messages (left-aligned)

```
[Avatar]  SenderName
          [bubble]
          [bubble]
          [bubble  2m ago]
```

### Local messages (right-aligned)

```
                    [bubble]
                    [bubble]
                    [bubble  2m ago]
```

No avatar for local messages.

### Avatar spec

- 28×28px circle
- Background color: deterministic hash of `senderIdentity` → one of 8 colors from the app palette (indigo, violet, teal, rose, amber, sky, emerald, fuchsia)
- Text: first 1–2 characters of `senderName`, uppercase
- Positioned left of the cluster's first bubble, top-aligned
- Subsequent bubbles get a 28px left spacer so text columns align

### Bubble border-radius (Telegram-style)

| Position | Remote | Local |
|----------|--------|-------|
| Only / First | `14px 14px 14px 4px` | `14px 14px 4px 14px` |
| Middle | `4px 14px 14px 4px` | `14px 4px 4px 14px` |
| Last | `4px 14px 14px 14px` | `14px 4px 14px 14px` |

---

## Input Area

**`ChatInput`** replaces the current `<input>`.

### Normal mode (auto-grow)

- `<textarea>` starting at 1 line (~36px), growing to max 4 lines (~120px)
- Beyond 4 lines: scrolls internally
- **Enter** → send; **Shift+Enter** → newline; **Ctrl+Enter** → send (useful in expanded mode)
- Small **⤢** expand icon in top-right corner of the textarea

### Expanded mode

- Triggered by clicking ⤢, or automatically when content exceeds 4 lines
- Grows to ~10 lines (~280px)
- Icon becomes **⤡** collapse
- Sending collapses back to normal mode

### Image attachment (unchanged)

- File picker button on the left
- Paste-to-upload (clipboard image items)
- Drag-and-drop onto message area

### Send button

- Disabled and dimmed when empty
- Active (indigo) when content is present

---

## Scroll Management & New Message Banner

**`ChatScrollManager`** renders two overlaid elements:

### Floating ↓ button (redesigned)

- 34px circle, bottom-right corner of the message area
- Unread count badge (same logic as current)
- Visible whenever user is not at the bottom

### Inline banner (new)

- Pill centered horizontally just above the input area
- Text: `"↑ 3 new messages"` / `"↑ 1 new message"`
- Fades in/out with CSS transition
- Clicking jumps to latest and clears unread
- Disappears (with the ↓ button) when user scrolls to bottom

### Scroll behavior (unchanged)

- Auto-follow when at bottom: new messages scroll smoothly into view
- Sending always snaps to bottom

---

## Persistence

**`useChatPersistence(roomId: string)`**

```ts
returns [initialMessages: ChatMessage[], persist: (msgs: ChatMessage[]) => void]
```

### Storage

- Backend: `sessionStorage`
- Key: `chat:{roomId}` — room-scoped, no cross-room collision
- Value: JSON-serialized `ChatMessage[]`
- Cleared automatically on tab close (sessionStorage semantics)
- No manual cleanup required

### Integration

`MeetingContext` calls:
1. `useChatPersistence(roomId)` to get `initialMessages` — seeds `useState<ChatMessage[]>`
2. `persist(chatMessages)` inside a `useEffect` on every `chatMessages` change

### What is stored

Full `ChatMessage` objects: `{ id, timestamp, senderName, senderIdentity, message, attachments, isLocal }` — no schema changes.

### E2EE guarantee

Plaintext is stored in the browser's sessionStorage only. The server receives no message content. This is consistent with the existing LiveKit data channel transport.

---

## What Is Not Changing

- `ChatMessage` and `ChatAttachment` interfaces in `MeetingContext.tsx` — unchanged
- `sendChat` and `markRead` API — unchanged
- Image upload endpoint `/api/room/{roomId}/chat/upload` — unchanged
- System message types (kick/ban) — rendered as standalone pills, same as current
- Overall panel positioning and dark-glass visual style — preserved
