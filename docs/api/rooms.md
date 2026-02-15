# Rooms API

Room management endpoints are under `/api/room/`. All endpoints require authentication.

## Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/room/create` | POST | Create a new room |
| `/api/room/join` | POST | Join a room and get a LiveKit token |
| `/api/room/list` | GET | List available rooms |
| `/api/room/:roomId/kick/:identity` | POST | Kick a participant (admin) |
| `/api/room/:roomId/mute/:identity` | POST | Mute a participant (admin) |
| `/api/room/:roomId/video/:identity/off` | POST | Disable participant video (admin) |

---

## Endpoints

### Create Room

Create a new meeting room. The authenticated user becomes the room admin.

```
POST /api/room/create
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "name": "team-standup",
  "isPublic": true,
  "mode": "standard",
  "settings": {
    "allowChat": true,
    "allowVideo": true,
    "allowAudio": true,
    "requireApproval": false,
    "e2ee": false
  }
}
```

> **Note:** The `name` field is **optional**. If omitted or empty, the server will
> auto-generate a random URL-safe name in the format `xxx-xxxx-xxx` (e.g. `bkf-qmzl-rja`).

**Room Name Rules:**

Room names appear in the URL as `https://bedrud.xyz/m/NAME`, so they must be URL-safe:

| Rule | Description |
|------|-------------|
| **Allowed characters** | Lowercase letters (`a-z`), digits (`0-9`), and hyphens (`-`) |
| **Minimum length** | 3 characters |
| **Maximum length** | 63 characters |
| **No special characters** | `#`, `@`, `_`, `.`, `/`, `\`, `<`, `>`, `&`, `%`, `+`, `=`, `;`, `:`, `'`, `"`, `?`, `!`, spaces, etc. are **not allowed** |
| **No leading/trailing hyphens** | `-room` and `room-` are invalid |
| **No consecutive hyphens** | `room--name` is invalid |
| **Lowercase only** | Uppercase letters are rejected; input is auto-lowercased |
| **Unique** | Each room name must be unique |

**Response (200):**

```json
{
  "id": "uuid",
  "name": "team-standup",
  "createdBy": "user-uuid",
  "isActive": true,
  "isPublic": true,
  "maxParticipants": 0,
  "settings": {
    "allowChat": true,
    "allowVideo": true,
    "allowAudio": true,
    "requireApproval": false,
    "e2ee": false
  },
  "livekitHost": "wss://lk.bedrud.xyz",
  "mode": "standard"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | URL-safe room name (auto-generated if omitted) |
| `isPublic` | boolean | No | Whether the room appears in public listings |
| `mode` | string | No | `"standard"` (video) or `"clubhouse"` (audio-only) |
| `maxParticipants` | number | No | Maximum number of participants |
| `settings.allowChat` | boolean | No | Whether text chat is enabled |
| `settings.allowVideo` | boolean | No | Whether video is enabled |
| `settings.allowAudio` | boolean | No | Whether audio is enabled |
| `settings.requireApproval` | boolean | No | Whether participants need admin approval |
| `settings.e2ee` | boolean | No | Whether end-to-end encryption is enabled |

---

### Join Room

Join an existing room and receive a LiveKit token for media connection.

```
POST /api/room/join
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "roomName": "team-standup"
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "team-standup",
  "token": "eyJ...",
  "createdBy": "user-uuid",
  "adminId": "user-uuid",
  "isActive": true,
  "isPublic": true,
  "maxParticipants": 20,
  "expiresAt": "2026-02-16T12:00:00Z",
  "settings": { ... },
  "livekitHost": "wss://lk.bedrud.xyz",
  "mode": "standard"
}
```

The `token` is a signed LiveKit access token. Use it to connect to the LiveKit server via WebSocket:

```javascript
import { Room } from 'livekit-client';

const room = new Room();
await room.connect(livekitUrl, token);
```

---

### List Rooms

Get a list of rooms the user has created.

```
GET /api/room/list
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**

```json
[
  {
    "id": "uuid",
    "name": "team-standup",
    "createdBy": "user-uuid",
    "isActive": true,
    "maxParticipants": 20,
    "expiresAt": "2026-02-16T12:00:00Z",
    "settings": { ... },
    "mode": "standard",
    "relationship": "creator"
  }
]
```

---

### Kick Participant

Remove a participant from the room. Only the room admin can do this.

```
POST /api/room/:roomId/kick/:identity
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**

```json
{
  "status": "success"
}
```

---

### Mute Participant

Mute a participant's microphone. Only the room admin can do this.

```
POST /api/room/:roomId/mute/:identity
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**

```json
{
  "status": "success"
}
```

---

### Disable Participant Video

Turn off a participant's camera. Only the room admin can do this.

```
POST /api/room/:roomId/video/:identity/off
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**

```json
{
  "status": "success"
}
```

---

## Admin Controls

Room admin actions (kick, mute, video off) are only available to the user who created the room (`adminId`). Attempting these actions as a non-admin returns a 403 error.

### Permissions Matrix

| Action | Room Admin | Super Admin | Regular User | Guest |
|--------|-----------|-------------|-------------|-------|
| Create room | Yes | Yes | Yes | No |
| Join room | Yes | Yes | Yes | Yes |
| List rooms | Yes | Yes | Yes | Yes |
| Kick | Yes | Yes | No | No |
| Mute | Yes | Yes | No | No |
| Video off | Yes | Yes | No | No |

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "human-readable error message"
}
```

### Create Room Errors

| Status | Error Message | Description |
|--------|---------------|-------------|
| 400 | `"Invalid request body"` | Malformed JSON |
| 400 | `"room name must contain only lowercase letters, numbers, and hyphens"` | Name contains special characters (`#`, `@`, `_`, etc.) |
| 400 | `"room name must be at least 3 characters"` | Name too short |
| 400 | `"room name must be at most 63 characters"` | Name too long |
| 409 | `"a room with this name already exists"` | Duplicate name |
| 500 | `"Failed to create media room"` | LiveKit server error |
| 500 | `"Failed to create room"` | Database error |

### General Errors

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing/invalid data) |
| 401 | Not authenticated |
| 403 | Not authorized (non-admin trying admin action) |
| 404 | Room not found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal server error |
