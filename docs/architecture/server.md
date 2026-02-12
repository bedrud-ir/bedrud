# Server Architecture

The Bedrud server is a Go application that provides the REST API, serves the embedded web frontend, and manages the LiveKit media server.

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| Go 1.24 | Core language |
| Fiber v2 | Web framework (Express-like) |
| GORM | ORM for SQLite and PostgreSQL |
| LiveKit Protocol SDK | WebRTC room and token management |
| Zerolog | Structured JSON logging |
| Goth | Multi-provider OAuth2 |
| go-passkeys | FIDO2/WebAuthn support |
| golang-jwt | JWT token creation and validation |
| gocron | Background job scheduling |
| Swagger (swaggo) | API documentation generation |

## Directory Structure

```
server/
├── cmd/
│   ├── server/main.go        # Development entry point
│   └── bedrud/main.go        # Production entry point (with install/livekit flags)
├── internal/
│   ├── auth/                  # Authentication services
│   │   ├── auth.go            # Core auth service (register, login, OAuth)
│   │   ├── jwt.go             # JWT token creation and validation
│   │   └── session_store.go   # Gorilla session store for OAuth state
│   ├── database/              # Database initialization and migrations
│   ├── handlers/              # HTTP request handlers (controller layer)
│   │   ├── auth_handler.go    # Auth endpoints
│   │   ├── room.go            # Room endpoints
│   │   └── users.go           # User management endpoints
│   ├── middleware/             # Fiber middleware
│   │   └── auth.go            # JWT validation, permission checks
│   ├── models/                # GORM models (database schemas)
│   │   ├── user.go            # User model
│   │   ├── room.go            # Room model
│   │   └── passkey.go         # Passkey model
│   ├── repository/            # Data access layer (SQL via GORM)
│   │   ├── user_repository.go
│   │   ├── room_repository.go
│   │   └── passkey_repository.go
│   ├── livekit/               # Embedded LiveKit server management
│   ├── scheduler/             # Background job scheduling
│   └── utils/                 # TLS and other utilities
├── frontend/                  # Embedded web frontend (populated at build time)
├── config.yaml                # Development configuration
├── livekit.yaml               # Development LiveKit configuration
├── go.mod
└── go.sum
```

## Layered Architecture

The server follows a three-layer architecture:

```
HTTP Request
     │
     ▼
┌─────────────┐
│  Middleware  │  JWT validation, CORS, logging
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Handlers   │  Parse requests, call services, format responses
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │  Business logic (auth, room management)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repository  │  Database queries via GORM
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │  SQLite (dev) or PostgreSQL (production)
└─────────────┘
```

## Key Patterns

### Embedded Frontend

The web frontend is compiled to static files and embedded into the Go binary using `//go:embed`:

```go
//go:embed frontend/*
var frontendFS embed.FS
```

At build time, the Makefile copies the compiled Svelte output into `server/frontend/`, and the Go compiler bundles it into the binary. The Fiber server serves these files for any non-API route.

### JWT Authentication

The middleware extracts the JWT from the `Authorization: Bearer <token>` header, validates it, and attaches the user context to the request. Protected routes use `RequireAccess` middleware to check user roles.

### LiveKit Token Generation

When a user joins a room, the server:

1. Validates room permissions
2. Creates a LiveKit access token signed with the API secret
3. Returns the token to the client
4. The client connects directly to LiveKit using the token

### Swagger Documentation

API documentation is auto-generated from code annotations using swaggo. In development, it's available at `/api/swagger/`.

## Database

### SQLite (Default)

For development and small deployments, Bedrud uses SQLite. The database file is stored at the configured `database.path` (default: `data.db`).

### PostgreSQL

For production with higher concurrency requirements, configure a PostgreSQL connection string. GORM handles both dialects transparently.

### Migrations

GORM auto-migrates the schema on startup based on the model structs. The models are defined in `internal/models/`.

## Background Jobs

The `gocron` scheduler runs periodic tasks such as:

- Cleaning up expired refresh tokens
- Removing stale room participants
