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
  "chatEnabled": true,
  "videoEnabled": true
}
```

**Response (200):**

```json
{
  "room": {
    "id": "uuid",
    "name": "team-standup",
    "adminId": "user-uuid",
    "isPublic": true,
    "chatEnabled": true,
    "videoEnabled": true,
    "participants": []
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique room name |
| `isPublic` | boolean | No | Whether the room appears in public listings |
| `chatEnabled` | boolean | No | Whether text chat is enabled |
| `videoEnabled` | boolean | No | Whether video is enabled |

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
  "token": "eyJ...",
  "room": {
    "id": "uuid",
    "name": "team-standup",
    "adminId": "user-uuid"
  }
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

Get a list of rooms the user can join.

```
GET /api/room/list
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**

```json
{
  "rooms": [
    {
      "id": "uuid",
      "name": "team-standup",
      "adminId": "user-uuid",
      "isPublic": true,
      "participantCount": 3
    }
  ]
}
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
  "message": "participant kicked"
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
  "message": "participant muted"
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
  "message": "participant video disabled"
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

```json
{
  "error": "room not found"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing room name, invalid data) |
| 401 | Not authenticated |
| 403 | Not authorized (non-admin trying admin action) |
| 404 | Room not found |
| 500 | Internal server error |
