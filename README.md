# Bedrud

**Self-hosted video meeting platform** — a single binary that packages the web UI, REST API, and WebRTC media server into one deployable unit.

[![CI](https://github.com/bedrud-ir/bedrud/actions/workflows/ci.yml/badge.svg)](https://github.com/bedrud-ir/bedrud/actions/workflows/ci.yml)
[![Release](https://github.com/bedrud-ir/bedrud/actions/workflows/release.yml/badge.svg)](https://github.com/bedrud-ir/bedrud/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/bedrud-ir/bedrud)](https://github.com/bedrud-ir/bedrud/releases/latest)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![Docker](https://img.shields.io/badge/Docker-ghcr.io-2496ED?logo=docker&logoColor=white)](https://github.com/bedrud-ir/bedrud/pkgs/container/bedrud)

[![Android](https://img.shields.io/badge/Android-API%2028+-3DDC84?logo=android&logoColor=white)](apps/android)
[![iOS](https://img.shields.io/badge/iOS-18.0+-000000?logo=apple&logoColor=white)](apps/ios)
[![Windows](https://img.shields.io/badge/Windows-10%2F11-0078D4?logo=windows&logoColor=white)](apps/desktop)
[![Linux](https://img.shields.io/badge/Linux-x86__64-FCC624?logo=linux&logoColor=black)](apps/desktop)
[![macOS](https://img.shields.io/badge/macOS-x86__64%2Farm64-000000?logo=apple&logoColor=white)](apps/desktop)

---

## Features

- **Video & Audio Meetings** — WebRTC-powered rooms via an embedded LiveKit media server
- **Single Binary** — Go server with the React frontend and LiveKit compiled in; no runtime dependencies
- **Native Client Apps** — Android (Jetpack Compose), iOS (SwiftUI), and desktop (Rust + Slint for Windows, Linux, and macOS) with picture-in-picture, deep linking, and call management
- **Multiple Auth Methods** — Email/password, OAuth (Google, GitHub, Twitter), guest access, and FIDO2 passkeys
- **Room Controls** — Public/private rooms, admin kick/mute/video-off, participant management
- **Multi-Instance** — Mobile and desktop apps can connect to multiple Bedrud servers simultaneously
- **Bot Agents** — Python agents for streaming music, radio, and video into rooms
- **Built-in Installer** — `bedrud install` sets up systemd services, TLS certificates, and configuration on Debian/Ubuntu
- **Docker Support** — Multi-stage Dockerfile and GHCR image for containerized deployments

## Architecture

```
bedrud/
├── server/          Go backend (Fiber, GORM, embedded LiveKit)
├── apps/
│   ├── web/         React frontend (TanStack Start, TailwindCSS v4)
│   ├── android/     Jetpack Compose app (Koin, Retrofit, LiveKit SDK)
│   ├── ios/         SwiftUI app (KeychainAccess, LiveKit SDK)
│   └── desktop/     Native desktop app (Rust, Slint, LiveKit SDK)
├── agents/          Python bots (music, radio, video stream)
├── packages/        Shared TypeScript types (@bedrud/api-types)
├── tools/cli/       Deployment CLI (pyinfra, Click)
├── Cargo.toml       Rust workspace root
└── docs/            Project documentation (MkDocs)
```

## Quick Start

### Prerequisites

- **Go** 1.24+
- **Bun** (JavaScript runtime / package manager)
- **LiveKit Server** (for local development)

### Development

```bash
git clone https://github.com/bedrud-ir/bedrud.git
cd bedrud
make init     # install all dependencies
make dev      # start LiveKit + server + web frontend
```

The web frontend runs at `http://localhost:3000` and the API at `http://localhost:8090`.

### Production Build

```bash
# Build frontend + backend into a single binary
make build

# Or build a compressed linux/amd64 tarball ready for deployment
make build-dist
```

### Docker

```bash
docker pull ghcr.io/bedrud-ir/bedrud:latest
docker run -p 8090:8090 -p 7880:7880 ghcr.io/bedrud-ir/bedrud:latest
```

Or build from source:

```bash
docker build -t bedrud .
docker run -p 8090:8090 -p 7880:7880 bedrud
```

### Install on a Server

```bash
# Automated remote deployment (sets up TLS, systemd, config)
cd tools/cli
uv run python bedrud.py --auto-config \
  --ip <server-ip> --user root --auth-key ~/.ssh/id_rsa \
  --domain meet.example.com --acme-email admin@example.com

# Or run the built binary directly on the target server
sudo ./bedrud install --tls --domain meet.example.com --email admin@example.com
```

## Installation

### Server

=== "Ubuntu/Debian (apt)"

```bash
curl -fsSL https://bedrud-ir.github.io/bedrud/bedrud.gpg.key \
  | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/bedrud.gpg
echo "deb https://bedrud-ir.github.io/bedrud stable main" \
  | sudo tee /etc/apt/sources.list.d/bedrud.list
sudo apt update && sudo apt install bedrud
```

=== "Arch Linux (AUR)"

```bash
yay -S bedrud-bin
```

=== "Binary download"

```bash
curl -L https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud_linux_amd64.tar.xz | tar xJ
sudo mv bedrud /usr/local/bin/
```

After installing, run the interactive setup:

```bash
sudo bedrud install
```

### Desktop Client

=== "Ubuntu/Debian (apt)"

```bash
# After adding the repo above:
sudo apt install bedrud-desktop
```

=== "Arch Linux (AUR)"

```bash
yay -S bedrud-desktop-bin
```

=== "AppImage (any Linux)"

```bash
wget https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-linux-x86_64.AppImage
chmod +x bedrud-desktop-linux-x86_64.AppImage
./bedrud-desktop-linux-x86_64.AppImage
```

=== "macOS (unsigned)"

```bash
# Apple Silicon
curl -L https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-macos-arm64.tar.gz | tar xz
# Intel
curl -L https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud-desktop-macos-x86_64.tar.gz | tar xz
```

The macOS builds are unsigned. If Gatekeeper blocks the app, run `xattr -d com.apple.quarantine bedrud-desktop` or allow it in **System Settings → Privacy & Security**.

=== "Windows"

Download the NSIS installer or portable `.zip` from the [latest release](https://github.com/bedrud-ir/bedrud/releases/latest) for x86_64 or ARM64.

See the [Package Installation guide](https://bedrud-ir.github.io/bedrud/guides/packages/) for full details on all platforms.

---

## Client Apps

### Android

Requires Android Studio and JDK 17. Min SDK 28, target SDK 35.

```bash
make dev-android            # Open in Android Studio
make build-android-debug    # Debug APK
make build-android          # Release APK (requires keystore)
make release-android        # Build + install on connected device
```

### iOS

Requires Xcode. Deployment target iOS 18.0.

```bash
make dev-ios          # Open in Xcode
make build-ios        # Build release archive
make build-ios-sim    # Build for simulator
make export-ios       # Export IPA (requires signing cert)
```

### Desktop (Windows / Linux)

Requires Rust stable. Windows requires Visual Studio Build Tools (MSVC).

On Linux, install native dependencies first:

```bash
sudo apt-get install -y \
  libfontconfig1-dev libxkbcommon-dev libxkbcommon-x11-dev \
  libwayland-dev libgles2-mesa-dev libegl1-mesa-dev \
  libdbus-1-dev libsecret-1-dev \
  libasound2-dev
```

```bash
make dev-desktop      # Build and run immediately
make build-desktop    # Optimised release binary
```

## Bot Agents

Stream media into meeting rooms using Python agents:

```bash
cd agents/music_agent
pip install -r requirements.txt
python agent.py "https://meet.example.com/m/room-name"
```

Available agents: `music_agent`, `radio_agent`, `video_stream_agent`.

## Documentation

Full documentation: [bedrud-ir.github.io/bedrud](https://bedrud-ir.github.io/bedrud/)

Key pages:
- [Quick Start](https://bedrud-ir.github.io/bedrud/getting-started/quickstart/)
- [Architecture Overview](https://bedrud-ir.github.io/bedrud/architecture/overview/)
- [Deployment Guide](https://bedrud-ir.github.io/bedrud/guides/deployment/)
- [API Reference](https://bedrud-ir.github.io/bedrud/api/authentication/)

## Makefile Reference

| Command | Description |
|---------|-------------|
| `make help` | Show all available targets |
| `make init` | Install all dependencies |
| `make dev` | Run LiveKit + server + web concurrently |
| `make build` | Build frontend + backend (embedded single binary) |
| `make build-dist` | Build production linux/amd64 tarball |
| `make build-android-debug` | Build Android debug APK |
| `make build-android` | Build Android release APK |
| `make build-ios` | Build iOS archive |
| `make build-ios-sim` | Build for iOS simulator |
| `make build-desktop` | Build desktop release binary |
| `make dev-desktop` | Run desktop app (debug) |
| `make test-back` | Run server tests |
| `make deploy ARGS=...` | Run deployment CLI |
| `make clean` | Remove build artifacts |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go 1.24, Fiber, GORM, LiveKit Protocol SDK |
| Web Frontend | React 19, TanStack Start, TanStack Router, TailwindCSS v4, Vite |
| Android | Kotlin, Jetpack Compose, Koin, Retrofit, LiveKit Android SDK |
| iOS | Swift, SwiftUI, KeychainAccess, LiveKit Swift SDK |
| Desktop | Rust, Slint, reqwest, LiveKit Rust SDK |
| Auth | JWT, OAuth2 (Goth), WebAuthn / FIDO2 Passkeys |
| Database | SQLite (default), PostgreSQL (production) |
| Media | LiveKit (embedded WebRTC SFU) |
| CI/CD | GitHub Actions, Docker, GHCR |
| Deployment | pyinfra, systemd, Traefik |

## Contributing

Contributions are welcome. Please open an issue first for significant changes.

See the [Development Workflow](https://bedrud-ir.github.io/bedrud/guides/development/) guide for setup instructions, code style, and testing conventions.

## License

[Apache License 2.0](LICENSE)
