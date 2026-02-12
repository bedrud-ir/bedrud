# Bedrud

**Self-hosted video meeting platform** — a single binary that packages the web UI, REST API, and media server into one deployable unit.

[![CI](https://github.com/bedrud-ir/bedrud/actions/workflows/ci.yml/badge.svg)](https://github.com/bedrud-ir/bedrud/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Features

- **Video & Audio Meetings** — WebRTC-powered rooms via an embedded LiveKit media server
- **Single Binary** — Go server with the Svelte frontend and LiveKit compiled in; no runtime dependencies
- **Native Mobile Apps** — Android (Jetpack Compose) and iOS (SwiftUI) with picture-in-picture, deep linking, and call management
- **Multiple Auth Methods** — Email/password, OAuth (Google, GitHub, Twitter), guest access, and FIDO2 passkeys
- **Room Controls** — Public/private rooms, admin kick/mute/video-off, participant management
- **Multi-Instance** — Mobile apps can connect to multiple Bedrud servers simultaneously
- **Bot Agents** — Python agents for streaming music, radio, and video into rooms
- **Built-in Installer** — `bedrud install` sets up systemd services, TLS certificates, and configuration on Debian/Ubuntu
- **Docker Support** — Multi-stage Dockerfile and GHCR image for containerized deployments

## Architecture

```
bedrud/
├── server/          Go backend (Fiber, GORM, embedded LiveKit)
├── apps/
│   ├── web/         SvelteKit frontend (Svelte 5, TailwindCSS)
│   ├── android/     Jetpack Compose app (Koin, Retrofit, LiveKit SDK)
│   └── ios/         SwiftUI app (KeychainAccess, LiveKit SDK)
├── agents/          Python bots (music, radio, video stream)
├── packages/        Shared TypeScript types (@bedrud/api-types)
├── tools/cli/       Deployment CLI (pyinfra, Click)
└── docs/            Project documentation (MkDocs)
```

## Quick Start

### Prerequisites

- **Go** 1.24+
- **Bun** (Node.js package manager)
- **LiveKit Server** (for local development)

### Development

```bash
# Install dependencies
make init

# Run everything (LiveKit + server + web frontend)
make dev
```

The web frontend runs at `http://localhost:5173` and the API at `http://localhost:8090`.

### Production Build

```bash
# Build frontend + backend into a single binary
make build

# Or build a compressed linux/amd64 tarball
make build-dist
```

### Docker

```bash
docker build -t bedrud .
docker run -p 8090:8090 -p 7880:7880 bedrud
```

### Install on a Server

```bash
# Automated remote deployment
cd tools/cli
uv run python bedrud.py --auto-config \
  --ip <server-ip> --user root --auth-key ~/.ssh/id_rsa \
  --domain meet.example.com --acme-email admin@example.com

# Or install directly on the server
sudo ./bedrud install --tls --domain meet.example.com --email admin@example.com
```

## Mobile Apps

### Android

```bash
make build-android-debug    # Debug APK
make build-android          # Release APK
make release-android        # Build + install on device
```

Requires Android Studio and JDK 17. Min SDK 28, target SDK 35.

### iOS

```bash
make dev-ios                # Open in Xcode
make build-ios              # Build archive
make build-ios-sim          # Build for simulator
```

Requires Xcode. Deployment target iOS 18.0.

## Bot Agents

Stream media into meeting rooms using Python agents:

```bash
cd agents/music_agent
pip install -r requirements.txt
python agent.py "https://meet.example.com/m/room-name"
```

Available agents: `music_agent`, `radio_agent`, `video_stream_agent`.

## Documentation

Full documentation is available at the [Bedrud Docs](https://bedrud-ir.github.io/bedrud/) site, or browse the `docs/` directory.

## Makefile Reference

| Command | Description |
|---------|-------------|
| `make help` | Show all available targets |
| `make init` | Install web + server dependencies |
| `make dev` | Run LiveKit + server + web concurrently |
| `make build` | Build frontend + backend (embedded) |
| `make build-dist` | Build production linux/amd64 tarball |
| `make build-android-debug` | Build Android debug APK |
| `make build-android` | Build Android release APK |
| `make build-ios` | Build iOS archive |
| `make build-ios-sim` | Build for iOS simulator |
| `make deploy ARGS=...` | Run deployment CLI |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go 1.24, Fiber, GORM, LiveKit Protocol |
| Web Frontend | SvelteKit 2, Svelte 5, TailwindCSS, Vite |
| Android | Kotlin, Jetpack Compose, Koin, Retrofit, LiveKit SDK |
| iOS | Swift, SwiftUI, KeychainAccess, LiveKit SDK |
| Auth | JWT, OAuth2 (Goth), WebAuthn Passkeys |
| Database | SQLite (default), PostgreSQL (production) |
| Media | LiveKit (embedded WebRTC server) |
| CI/CD | GitHub Actions, Docker, GHCR |
| Deployment | pyinfra, systemd, Traefik |

## License

[Apache License 2.0](LICENSE)
