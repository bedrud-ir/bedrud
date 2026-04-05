# Architecture Overview

Bedrud is a monorepo containing a Go server, three client applications, Python bot agents, and shared packages. This page describes how the pieces fit together.

## High-Level Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                          Clients                             │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌───────────────┐   │
│  │  Web    │  │ Android  │  │  iOS   │  │ Desktop       │   │
│  │ React   │  │ Compose  │  │SwiftUI │  │ Rust + Slint  │   │
│  └────┬────┘  └────┬─────┘  └───┬────┘  └──────┬────────┘   │
│       │            │            │              │             │
│       └────────────┼────────────┼──────────────┘             │
│                    │                                         │
│               REST API + WebSocket                          │
└────────────────────┼────────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────┐
│                   Bedrud Server                         │
│                        │                                │
│  ┌─────────────────────┴──────────────────────────┐     │
│  │              Fiber HTTP Router                  │     │
│  │  /api/auth/*  /api/room/*  /api/admin/*        │     │
│  └──────────┬─────────────────────┬───────────────┘     │
│             │                     │                     │
│  ┌──────────┴──────────┐  ┌──────┴────────────────┐     │
│  │   GORM / SQLite     │  │  LiveKit Protocol SDK │     │
│  │   (or PostgreSQL)   │  │  (token generation,   │     │
│  │                     │  │   room management)    │     │
│  └─────────────────────┘  └──────────┬────────────┘     │
│                                      │                  │
│                           ┌──────────┴────────────┐     │
│                           │  Embedded LiveKit      │     │
│                           │  Media Server (WebRTC) │     │
│                           └───────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Components

### Server (`server/`)

The Go backend is the core of Bedrud. It handles:

- **REST API** — authentication, room management, admin operations
- **Static file serving** — the compiled web frontend is embedded via `//go:embed`
- **LiveKit integration** — generates tokens and manages rooms via the LiveKit Protocol SDK
- **Embedded LiveKit server** — the media server binary runs as a child process

The server uses the **Fiber** web framework (Express-like) and **GORM** as the ORM layer. It supports SQLite for development and PostgreSQL for production.

See [Server Architecture](server.md) for details.

### Web Frontend (`apps/web/`)

A **React** application built with TanStack Start, TailwindCSS v4, and shadcn/ui. In production, it is SSR pre-rendered and the client assets are embedded into the Go binary.

Key capabilities:

- Video meeting UI with LiveKit Client SDK
- JWT-based authentication with automatic token refresh
- Admin dashboard for user and room management
- Design system with consistent component library

See [Web Frontend](web.md) for details.

### Android App (`apps/android/`)

A native Android app built with **Jetpack Compose** and **Kotlin**. Uses Koin for dependency injection and Retrofit for HTTP.

Key capabilities:

- Full video meeting experience with LiveKit Android SDK
- Picture-in-picture mode
- Deep link handling (`bedrud.com/m/*` and `bedrud.com/c/*`)
- Call management with Android's ConnectionService
- Multi-instance support (connect to multiple servers)

See [Android App](android.md) for details.

### iOS App (`apps/ios/`)

A native iOS app built with **SwiftUI**. Uses KeychainAccess for secure credential storage and LiveKit Swift SDK for media.

Key capabilities:

- Full video meeting experience
- Multi-instance support
- Deep link handling
- Keychain-based secure storage

See [iOS App](ios.md) for details.

### Desktop App (`apps/desktop/`)

A native Windows and Linux desktop application built with **Rust** and the **Slint** UI toolkit. Compiles to a single binary with no runtime dependencies.

Key capabilities:

- Full video meeting experience via LiveKit Rust SDK
- Native Windows (Direct3D 11) and Linux (OpenGL/Vulkan) rendering
- Multi-instance support (connect to multiple Bedrud servers)
- OS keyring integration for secure credential storage

See [Desktop App](desktop.md) for details.

### Bot Agents (`agents/`)

Python scripts that join meeting rooms as bots and stream media content:

- **Music Agent** — plays audio files
- **Radio Agent** — streams internet radio stations
- **Video Stream Agent** — shares video content (HLS, MP4)

See [Bot Agents](agents.md) for details.

## Authentication Flow

```
Client                    Server                    Database
  │                         │                          │
  ├─POST /api/auth/login───►│                          │
  │                         ├──verify credentials─────►│
  │                         │◄─────────────────────────┤
  │◄──access + refresh JWT──┤                          │
  │                         │                          │
  ├─GET /api/room/list──────►│  (Authorization header)  │
  │  (Bearer <access_token>)│                          │
  │◄──room list─────────────┤                          │
```

All authenticated requests use JWT tokens in the `Authorization` header. The web frontend's `authFetch` wrapper handles token attachment and automatic refresh.

Supported auth methods:

| Method | Endpoint | Description |
|--------|----------|-------------|
| Email/Password | `POST /api/auth/login` | Traditional credentials |
| Registration | `POST /api/auth/register` | New account creation |
| Guest | `POST /api/auth/guest-login` | Temporary access with just a name |
| OAuth | `GET /api/auth/:provider/login` | Google, GitHub, Twitter |
| Passkeys | `POST /api/auth/passkey/*` | FIDO2/WebAuthn biometrics |

## Meeting Connection Flow

```
Client                    Server                    LiveKit
  │                         │                          │
  ├─POST /api/room/join────►│                          │
  │                         ├──generate LiveKit token──►│
  │                         │◄─────────────────────────┤
  │◄──LiveKit token─────────┤                          │
  │                         │                          │
  ├─WebSocket connect───────────────────────────────────►│
  │  (with LiveKit token)   │                          │
  │◄──────────────────audio/video tracks───────────────┤
```

1. The client requests to join a room via the REST API
2. The server validates permissions and generates a signed LiveKit token
3. The client connects directly to LiveKit via WebSocket using the token
4. Audio/video tracks flow peer-to-peer through LiveKit's SFU

## Data Model

```
┌──────────┐       ┌──────────────┐       ┌──────────────┐
│   User   │       │     Room     │       │   Passkey    │
├──────────┤       ├──────────────┤       ├──────────────┤
│ ID       │◄──┐   │ ID           │       │ ID           │
│ Email    │   ├───│ AdminID      │       │ UserID ──────┤──►User
│ Name     │   │   │ Name         │       │ CredentialID │
│ Password │   │   │ IsPublic     │       │ PublicKey    │
│ Avatar   │   │   │ ChatEnabled  │       │ Counter      │
│ Provider │   │   │ VideoEnabled │       └──────────────┘
│ Role     │   │   │ Participants │
└──────────┘   │   └──────────────┘
               │
               │   ┌──────────────┐
               └───│ RefreshToken │
                   ├──────────────┤
                   │ Token        │
                   │ UserID       │
                   │ ExpiresAt    │
                   └──────────────┘
```

## Deployment Architecture

In production, Bedrud runs as two systemd services:

| Service | Binary | Purpose |
|---------|--------|---------|
| `bedrud.service` | `bedrud --run` | API server + embedded web frontend |
| `livekit.service` | `bedrud --livekit` | WebRTC media server |

Both are managed by a single binary. Traefik or another reverse proxy handles TLS termination and routes traffic.

See [Deployment Guide](../guides/deployment.md) for setup instructions.
