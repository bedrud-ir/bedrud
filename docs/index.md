# Bedrud Documentation

Bedrud is a **self-hosted video meeting platform** packaged as a single binary. Web UI, REST API, WebRTC media server — run it on your own server with no per-user fees or usage limits.

## What's in the Binary

A single `bedrud` binary contains:

- A **Go REST API** for authentication, room management, and admin operations
- An **embedded React web frontend** compiled and SSR pre-rendered into the binary
- An **embedded LiveKit media server** for WebRTC audio/video
- An **SQLite database** (or PostgreSQL for production)
- A **built-in installer** that configures systemd services and TLS certificates

## Quick Links

- **[Quick Start](getting-started/quickstart.md)** — Self-host Bedrud in under 5 minutes
- **[Server Installation](getting-started/installation.md)** — Deploy the server to production with TLS and systemd
- **[Client Installation](getting-started/clients.md)** — Install desktop and mobile apps for joining meetings
- **[Configuration](getting-started/configuration.md)** — Server, LiveKit, auth, and network settings
- **[Architecture Overview](architecture/overview.md)** — Understand how the server, clients, and media layer fit together
- **[API Reference](api/authentication.md)** — REST API endpoints for authentication, rooms, and administration
- **[Contributing](contributing.md)** — How to contribute to the project

## Platform Support

| Platform | Technology | Status |
|----------|-----------|--------|
| Web | React 19, TanStack Start, TailwindCSS v4 | Production |
| Android | Jetpack Compose, Koin, LiveKit SDK | Production |
| iOS | SwiftUI, KeychainAccess, LiveKit SDK | Production |
| Desktop | Rust, Slint | In Development |
| Server | Go 1.24, Fiber, GORM, LiveKit | Production |
| Bots | Python, LiveKit SDK | Production |

## Repository Structure

```
bedrud/
├── server/            Go backend with embedded LiveKit
├── apps/
│   ├── web/           React frontend (TanStack Start)
│   ├── android/       Jetpack Compose app
│   ├── desktop/       Rust + Slint desktop app
│   ├── ios/           SwiftUI app
│   └── server/        Server OS packaging (RPM, systemd)
├── agents/            Python bot agents
│   ├── music_agent/
│   ├── radio_agent/
│   └── video_stream_agent/
├── packages/
│   ├── api-types/     Shared TypeScript types
│   ├── aur/           Arch Linux package
│   ├── chocolatey/    Windows package
│   ├── flatpak/       Linux Flatpak
│   └── homebrew/      macOS Homebrew tap
├── tools/cli/         Deployment CLI (pyinfra)
├── docs/              Documentation (MkDocs)
├── Cargo.toml         Rust workspace config
├── Dockerfile         Multi-stage container build
├── Makefile           Build orchestration
├── LICENSE            Apache License 2.0
├── NOTICE             Legal notices
└── mkdocs.yml         Documentation site config
```

## License

Bedrud is licensed under the [Apache License 2.0](https://github.com/bedrud-ir/bedrud/blob/main/LICENSE).
