# API Handlers and Routing

Bedrud uses the **Fiber** web framework. Fiber is fast and has a simple API that looks like Express.js.

## Routing Logic

The routes are defined in `internal/server/server.go`. We group routes to apply middleware or prefixes easily.

### Main Groups:

- **`/api/auth`**: Public and protected routes for authentication.
- **`/api/room`**: Protected routes for room management.
- **`/api/admin`**: Routes restricted to users with the `superadmin` role.
- **`/livekit`**: A special proxy group that sends requests to the embedded LiveKit audio/video server.

## Specialized Handler Logic

### Room Management (`internal/handlers/room.go`)
The `RoomHandler` provides a bridge between Bedrud's metadata and LiveKit's media engine.

#### 1. Room Creation
When a room is created via `POST /api/room/create`:

- **Normalization:** Room names are trimmed and lowercased.
- **Auto-Generation:** If no name is provided, Bedrud generates a random URL-safe name (e.g., `fancy-blue-whale`).
- **Synchronized Creation:** The backend first calls the internal LiveKit API to create the media session, then saves the metadata in the local database.

#### 2. Joining and Tokens
When a user joins via `POST /api/room/join`:

- **Access Control:** The backend checks if the room exists and if the user is authorized.
- **Token Generation:** A signed JWT (Join Token) is generated with:
  - `Identity`: The User ID from Bedrud.
  - `Name`: The User's Display Name.
  - `Grants`: Specific permissions like `CanJoin`, `CanPublish`, `CanSubscribe`.
- **Client Handshake:** The frontend receives both the local room metadata and the LiveKit token to start the WebRTC connection.

## Admin & User Management (`internal/handlers/users.go`)
Routes under `/api/admin` are strictly guarded by the `RequireAccess("superadmin")` middleware.

### 1. User Control
The `UsersHandler` allows administrators to:

- **List All Users:** Fetch a complete directory of registered users including their auth provider and last login metadata.
- **Update Status:** Instantly activate or deactivate account access. Deactivating a user immediately blocks them from logging in or refreshing their tokens.

### 2. Room Overview
Admin routes allow for listing all active and historical rooms across the entire platform, regardless of who created them. This is intended for platform moderation.

## Request Lifecycle

1.  **Request arrives**: Fiber receives the HTTP request.
2.  **Middleware**:

    - `recover`: Prevents the server from crashing if there is an error.
    - `cors`: Handles Cross-Origin Resource Sharing.
    - `Protected`: (Optional) Checks for a valid JWT in the `Authorization` header.
3.  **Handler**: The function in `internal/handlers` is called.

    - It parses the JSON body (if any) using `c.BodyParser`.
    - It calls the necessary Service or Repository.
    - It returns a JSON response using `c.JSON`.

## Example: Create Room Handler

```go
func (h *RoomHandler) CreateRoom(c *fiber.Ctx) error {
    var input struct {
        Name string `json:"name"`
    }
    // 1. Parse Input
    if err := c.BodyParser(&input); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
    }
    
    // 2. Business Logic (via Repository)
    room := &models.Room{Name: input.Name}
    if err := h.roomRepo.Create(room); err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to create room"})
    }
    
    // 3. Response
    return c.Status(201).JSON(room)
}
```

## Static Files (Frontend)

One of Bedrud's best features is that the frontend is **embedded** in the backend binary. Fiber serves the Svelte files from the `frontend/` directory using `filesystem.New`.

Any route that doesn't start with `/api` is redirected to the Svelte app's `index.html`. This allows for "Single Page Application" (SPA) routing.
