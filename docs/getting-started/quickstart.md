# Quick Start

Get Bedrud running locally for development in under 5 minutes.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Go](https://go.dev/dl/) | 1.24+ | Backend server |
| [Bun](https://bun.sh/) | Latest | Frontend package manager |
| [LiveKit Server](https://docs.livekit.io/home/self-hosting/local/) | Latest | Local media server |

!!! tip "Installing LiveKit locally"
    On macOS: `brew install livekit`. On Linux, download the binary from
    [LiveKit releases](https://github.com/livekit/livekit/releases).

## 1. Clone the Repository

```bash
git clone https://github.com/niceda/bedrud.git
cd bedrud
```

## 2. Install Dependencies

```bash
make init
```

This runs `bun install` for the web frontend and `go mod tidy && go mod download` for the server.

## 3. Start Development

```bash
make dev
```

This starts three processes concurrently:

| Process | URL | Description |
|---------|-----|-------------|
| LiveKit | `localhost:7880` | WebRTC media server |
| Server | `localhost:8090` | Go REST API |
| Web | `localhost:5173` | Svelte dev server (with HMR) |

Press `Ctrl+C` to stop all processes.

## 4. Open the App

Navigate to [http://localhost:5173](http://localhost:5173) in your browser. You can:

1. **Register** a new account
2. **Create** a meeting room
3. **Join** the room to test video/audio

## Running Individual Services

If you only need to work on one part:

```bash
make dev-web       # Frontend only (Svelte dev server)
make dev-server    # Backend only (Go server)
make dev-livekit   # LiveKit only (media server)
```

## Mobile Development

### Android

```bash
make dev-android   # Opens project in Android Studio
```

Requires Android Studio with JDK 17. The app connects to `localhost:8090` by default.

### iOS

```bash
make dev-ios       # Opens project in Xcode
```

Requires Xcode. Deployment target is iOS 18.0.

## Building for Production

```bash
# Build the single binary (frontend embedded in Go server)
make build

# Build a compressed linux/amd64 tarball
make build-dist
```

The production binary is at `server/dist/bedrud`. See the [Deployment Guide](../guides/deployment.md) for server setup.

## Next Steps

- [Configuration Reference](configuration.md) — customize ports, database, auth providers
- [Architecture Overview](../architecture/overview.md) — understand how the pieces fit together
- [Development Workflow](../guides/development.md) — day-to-day development patterns
