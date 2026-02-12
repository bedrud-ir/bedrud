# Contributing

Contributions to Bedrud are welcome. This guide covers the process for submitting changes.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch from `main`
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
git clone https://github.com/<your-username>/bedrud.git
cd bedrud
make init
make dev
```

See the [Development Workflow](guides/development.md) for detailed setup instructions.

## Project Structure

| Directory | Language | Description |
|-----------|---------|-------------|
| `server/` | Go | Backend API and embedded services |
| `apps/web/` | TypeScript/Svelte | Web frontend |
| `apps/android/` | Kotlin | Android app |
| `apps/ios/` | Swift | iOS app |
| `agents/` | Python | Bot agents |
| `tools/cli/` | Python | Deployment CLI |
| `docs/` | Markdown | Documentation |

## Code Style

| Language | Standard |
|---------|---------|
| Go | `gofmt` |
| TypeScript/Svelte | Prettier |
| Kotlin | Android Studio defaults |
| Swift | Xcode defaults |

## Pull Request Process

1. **Branch naming:** `feature/description`, `fix/description`, or `docs/description`
2. **Commit messages:** Use conventional commits format (e.g., `feat:`, `fix:`, `docs:`)
3. **CI checks:** All GitHub Actions checks must pass
4. **Description:** Include what changed and why

### CI Checks

Every PR runs these checks automatically:

| Check | What it validates |
|-------|------------------|
| Server | `go vet`, build, tests |
| Web | TypeScript type check, build |
| Android | Lint, unit tests |
| iOS | Build, test (simulator) |

## Reporting Issues

File issues on [GitHub Issues](https://github.com/niceda/bedrud/issues) with:

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

Then open `http://localhost:8000`.

### Structure

Documentation pages are organized by topic. The navigation is defined in `mkdocs.yml` at the project root.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](https://github.com/niceda/bedrud/blob/main/LICENSE).
