# Codebase Structure

This guide explains the technical structure of the Bedrud project. It is intended for developers who want to understand how the code is organized and how the different layers interact.

## 🛠 Tools & Technologies

### Backend
*   **Go (1.23+):** Core language.
*   **Fiber v2:** Modern web framework (Express-like).
*   **GORM:** ORM for PostgreSQL and SQLite.
*   **LiveKit SDK:** For WebRTC meeting management.
*   **Zerolog:** High-performance logging.
*   **Goth:** Multi-provider authentication (OAuth).

### Frontend
*   **SvelteKit (Svelte 5):** UI framework using the latest Runes (state management).
*   **TailwindCSS:** Utility-first styling.
*   **Lucide Svelte:** Icon library.
*   **LiveKit Client SDK:** For browser-side WebRTC.

---

## 📁 Directory Structure

### 🏗 Backend (`/backend`)
The backend follows a modular structure commonly used in Go projects.

*   `cmd/server/main.go`: The application entry point. It initializes the database, services, and defines the API routes using Fiber.
*   `internal/models/`: Contains the database schemas (Structs). These are used by GORM to create/update tables.
    *   `user.go`: User profiles and access levels.
    *   `room.go`: Meeting room configurations, participant states, and internal flags for `AdminID` and `IsPublic`.
*   `internal/handlers/`: The "Controller" layer. These files handle HTTP requests and responses.
    *   `auth_handler.go`: Logic for login, signup, and OAuth callbacks.
    *   `room.go`: Logic for creating/joining rooms, generating LiveKit tokens, and admin actions (Kick, Mute, Disable Video).
*   `internal/repository/`: The "Data Access" layer. These files contain SQL queries (via GORM).
    *   `user_repository.go`: DB operations for users.
    *   `room_repository.go`: DB operations for rooms.
*   `internal/middleware/`: Custom Fiber middleware.
    *   `auth.go`: Validates JWT tokens and checks user permissions (`RequireAccess`).
*   `internal/database/`: Initialization and migration logic for PostgreSQL.

### 🎨 Frontend (`/frontend`)
The frontend is a SvelteKit SPA (Single Page Application).

*   `src/routes/`: The file-based routing system.
    *   `+page.svelte`: The home page.
    *   `m/[meetId]/`: The meeting room page. This is the most complex part, handling video streams.
    *   `auth/`: Pages for login and registration.
*   `src/lib/`: Reusable code and components.
    *   `components/`: UI components (Buttons, Inputs, Video Tiles).
    *   `stores/`: Global state management.
        *   `user.store.ts`: Tracks if a user is logged in and their profile.
        *   `auth.store.ts`: Manages JWT tokens (Access/Refresh).
    *   `api/`: Specialized functions to call specific backend endpoints.
    *   `api.ts`: A custom `authFetch` wrapper that automatically handles token attachment and session expiration.
    *   `livekit.ts`: Helper functions for starting/stopping video and connecting to the LiveKit server.

---

## 🔄 Core Workflows

### 1. Authentication Flow
1.  **Request:** User logs in via `src/lib/auth.ts`.
2.  **API:** Calls `POST /api/auth/login`.
3.  **Backend:** `AuthHandler` verifies credentials and returns JWT tokens (Access + Refresh).
4.  **Guest Access:** For unauthenticated users, `POST /api/auth/guest-login` creates a temporary guest user with restricted permissions.
5.  **Frontend:** `authStore` saves tokens in `localStorage`.
6.  **Subsequent Requests:** `authFetch` adds the token to the `Authorization` header.

### 2. Meeting Connection Flow
1.  **Join:** User clicks "Join" in the UI.
2.  **Request:** Frontend calls `POST /api/room/join`.
3.  **Backend:** `RoomHandler` checks room permissions and creates a **LiveKit Token** signed with the `API_SECRET`.
4.  **Frontend:** Uses the returned token and `livekit-client` SDK to connect to the LiveKit server (WebSocket).
5.  **Tracks:** Once connected, the app listens for `TrackSubscribed` events to display video/audio streams.

---

## 🚀 Deployment & Build
*   The project uses a **Systemd** service for the backend binary and a **Reverse Proxy (Traefik)** for HTTPS.
*   Docker is used only for **Infrastructure** (Postgres, Redis, LiveKit).
*   The `Makefile` in the root is the "source of truth" for build commands.
