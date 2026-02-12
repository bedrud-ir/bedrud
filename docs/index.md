# Bedrud Documentation

Bedrud is a **self-hosted video meeting platform** that packages a web UI, REST API, and WebRTC media server into a single deployable binary. It supports native Android and iOS apps, multiple authentication methods, and bot agents for streaming media into rooms.

---

## What is Bedrud?

Bedrud lets you run your own video conferencing service. Unlike hosted solutions, you own the infrastructure — meetings stay on your server, and there are no per-user fees or usage limits.

A single `bedrud` binary contains:

- A **Go REST API** for authentication, room management, and admin operations
- An **embedded Svelte 5 web frontend** compiled into the binary
- An **embedded LiveKit media server** for WebRTC audio/video
- An **SQLite database** (or PostgreSQL for production)
- A **built-in installer** that configures systemd services and TLS certificates

## Platform Support

| Platform | Technology | Status |
|----------|-----------|--------|
| Web | SvelteKit 2, Svelte 5, TailwindCSS | Production |
| Android | Jetpack Compose, Koin, LiveKit SDK | Production |
| iOS | SwiftUI, KeychainAccess, LiveKit SDK | Production |
| Server | Go 1.24, Fiber, GORM, LiveKit | Production |
| Bots | Python, LiveKit SDK | Production |

## Quick Links

- **[Quick Start](getting-started/quickstart.md)** — Set up your development environment and run Bedrud locally
- **[Installation Guide](getting-started/installation.md)** — Deploy to a production server with TLS and systemd
- **[Architecture Overview](architecture/overview.md)** — Understand how the server, clients, and media layer fit together
- **[API Reference](api/authentication.md)** — REST API endpoints for authentication, rooms, and administration
- **[Contributing](contributing.md)** — How to contribute to the project

## Repository Structure

```
bedrud/
├── server/            Go backend with embedded LiveKit
├── apps/
│   ├── web/           SvelteKit frontend
│   ├── android/       Jetpack Compose app
│   └── ios/           SwiftUI app
├── agents/            Python bot agents
├── packages/          Shared TypeScript types
├── tools/cli/         Deployment CLI
├── docs/              This documentation
├── Makefile           Build orchestration
├── Dockerfile         Multi-stage container build
└── mkdocs.yml         Documentation site config
```

## License

Bedrud is licensed under the [Apache License 2.0](https://github.com/bedrud-ir/bedrud/blob/main/LICENSE).
