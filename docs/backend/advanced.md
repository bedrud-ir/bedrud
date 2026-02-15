# Advanced Backend Architecture

This document covers the "under the hood" technical decisions that make Bedrud's high-performance, single-binary architecture possible.

## 1. The Fiber-to-Standard Bridge
Bedrud uses **Fiber** for its speed, but some dependencies like **Goth** (OAuth) and **LiveKit SDK** (Twirp) expect standard Go `http.ResponseWriter` and `http.Request`.

To bridge these two worlds, Bedrud implements an **Adapter Pattern** in `internal/handlers/auth.go`:

### `responseWriter` Adapter
```go
type responseWriter struct {
    ctx     *fiber.Ctx
    headers http.Header
    status  int
}
```
This struct implements the `http.ResponseWriter` interface. When a standard library function (like Goth) calls `Header().Add()`, the adapter stores it in a local `headers` map. When `WriteHeader()` is called, it manually copies all headers back into the **Fiber Context**.

### Why this is important:
It allows Bedrud to remain extremely fast (using Fiber) while maintaining full compatibility with the vast ecosystem of standard Go web libraries.

## 2. LiveKit Reverse Proxying
Bedrud avoids port management issues by routing all media signaling through its main port.

### How it works:

1.  **Detection:** If `LIVEKIT_INTERNAL_HOST` points to `127.0.0.1`, Bedrud starts the internal media engine.
2.  **Mounting:** It mounts a `httputil.NewSingleHostReverseProxy` on the `/livekit` route.
3.  **Path Stripping:** A custom **Director** function is used to strip the `/livekit` prefix so that the media server receives the request as if it were at root.
4.  **WebSocket Support:** Since the proxy operates on the underlying TCP stream via `adaptor.HTTPHandler`, it natively supports the WebSockets used by LiveKit for real-time signaling.

## 3. Storage Efficiency: Embedded Structs
Bedrud makes heavy use of GORM's `embedded` tag to keep the database schema flat and optimized.

**Example from `models/room.go`:**
```go
type Room struct {
    ID       string       `gorm:"primaryKey"`
    Settings RoomSettings `gorm:"embedded;embeddedPrefix:settings_"`
}
```
This causes GORM to create columns like `settings_allow_chat` directly in the `rooms` table. This is faster than a `JOIN` and more searchable than a `JSON` blob.

## 4. Testing Infrastructure
Bedrud follows a "DB-First" testing strategy using the `internal/testutil` package.

### `SetupTestDB` logic:

- Creates a unique **SQLite in-memory** database for every test.
- Automatically runs all migrations.
- Provides a clean slate, ensuring tests are deterministic and can run in parallel.

To run backend tests:
```bash
go test ./internal/...
```

## 5. Security: Token Rotation & Rotation
Unlike simple JWT implementations, Bedrud rotates **both** tokens on every refresh.

- **Refresh Token Reuse Detection:** Once a refresh token is used to get a new pair, it is blocked.
- **Cleanup:** The `BlockedRefreshToken` table ensures that even if a refresh token is stolen, it cannot be used after the user has cleanly logged out or refreshed their session.
