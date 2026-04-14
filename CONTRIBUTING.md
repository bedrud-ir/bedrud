# Contributing

Contributions to Bedrud are welcome. This guide covers the process for submitting changes.

For documentation-specific contributions, see [docs/contributing.md](docs/contributing.md).

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch from `main`
4. Make your changes
5. Submit a pull request

## Prerequisites

- Go 1.22+
- Bun 1.0+ (for web frontend)
- Rust (for desktop app)
- GNU Make
- Git

## Development Setup

```bash
# After forking on GitHub, clone your fork
git clone https://github.com/<your-username>/bedrud.git
cd bedrud
make init
make dev
```

See the [Development Workflow](docs/guides/development.md) for detailed setup instructions.

## Project Structure

| Directory       | Language         | Description                      |
|-----------------|------------------|----------------------------------|
| `server/`       | Go               | Backend API and embedded LiveKit |
| `apps/web/`     | TypeScript/React | Web frontend                     |
| `apps/desktop/` | Rust + Slint     | Desktop app                      |
| `apps/android/` | Kotlin           | Android app                      |
| `apps/ios/`     | Swift            | iOS app                          |
| `agents/`       | Python           | Bot agents                       |
| `packages/`     | TypeScript       | Shared type definitions          |
| `tools/cli/`    | Python           | Deployment CLI                   |
| `docs/`         | Markdown         | Documentation                    |

## Code Style

| Language         | Standard                |
|------------------|-------------------------|
| Go               | `gofmt`                 |
| TypeScript/React | Biome                   |
| Kotlin           | Android Studio defaults |
| Swift            | Xcode defaults          |
| Python           | ruff                    |

## Pull Request Process

1. **Branch naming:** `feature/description`, `fix/description`, or `docs/description`
2. **Commit messages:** `<action> <what> for <why>` (e.g., `add user model for auth feature`, `fix login redirect for expired sessions`)
3. **CI checks:** All GitHub Actions checks must pass
4. **Description:** Include what changed and why

### CI Checks

Every PR runs these checks automatically:

| Check   | What it validates                    |
|---------|--------------------------------------|
| Server  | `go vet`, build, tests               |
| Web     | TypeScript type check, build (Biome) |
| Android | Lint, unit tests                     |
| iOS     | Build, test (simulator)              |

### Before Submitting

Run checks locally to catch issues before CI:

```bash
# Server
cd server && go vet ./... && go build ./... && go test -v -count=1 ./...

# Web
cd apps/web && bun run check && bun run build
```

## Reporting Issues

File issues on [GitHub Issues](https://github.com/bedrud-ir/bedrud/issues) with:

- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, app version)

## Documentation

Documentation lives in `docs/` and is built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

### Local Preview

```bash
pip install mkdocs-material
mkdocs serve
```

Then open `http://localhost:8000` in your browser.

## Related Documentation

- [Development Workflow](docs/guides/development.md) — Detailed dev setup
- [Architecture Overview](docs/architecture/overview.md) — How the pieces fit together
- [Configuration](docs/getting-started/configuration.md) — Server and LiveKit settings
- [API Reference](docs/api/authentication.md) — REST API endpoints
- [Makefile Guide](docs/guides/makefile.md) — All build and dev commands

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
