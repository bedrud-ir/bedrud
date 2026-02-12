# Development Workflow

This guide covers the day-to-day development workflow for contributing to Bedrud.

## Repository Layout

```
bedrud/
├── server/          # Go backend
├── apps/
│   ├── web/         # SvelteKit frontend
│   ├── android/     # Android app
│   └── ios/         # iOS app
├── agents/          # Python bot agents
├── packages/        # Shared TypeScript types
├── tools/cli/       # Deployment CLI
├── docs/            # Documentation (MkDocs)
├── Makefile         # Build orchestration
└── Dockerfile       # Container build
```

## Prerequisites

| Tool | Required For |
|------|-------------|
| Go 1.24+ | Server |
| Bun | Web frontend |
| LiveKit Server | Local media server |
| Android Studio + JDK 17 | Android app |
| Xcode | iOS app |
| Python 3.10+ | Bot agents |
| FFmpeg | Radio and video agents |

## Initial Setup

```bash
git clone https://github.com/bedrud-ir/bedrud.git
cd bedrud
make init
```

## Full-Stack Development

To run the entire stack locally:

```bash
make dev
```

This starts LiveKit, the Go server, and the Svelte dev server concurrently. Press `Ctrl+C` to stop all processes.

### Running Services Individually

=== "Web Frontend"

    ```bash
    make dev-web
    ```
    Runs at `http://localhost:5173` with hot module replacement.

=== "Go Server"

    ```bash
    make dev-server
    ```
    Runs at `http://localhost:8090`. Restart manually after Go code changes.

=== "LiveKit"

    ```bash
    make dev-livekit
    ```
    Runs at `http://localhost:7880` with development credentials.

## Server Development

The Go server entry point is `server/cmd/server/main.go`.

### Adding an API Endpoint

1. **Define the handler** in `server/internal/handlers/`
2. **Add repository methods** in `server/internal/repository/` if new DB queries are needed
3. **Register the route** in the server setup (usually in `main.go` or a routes file)
4. **Add middleware** if the endpoint needs auth or admin checks

### Database Changes

Add or modify GORM model structs in `server/internal/models/`. GORM auto-migrates on startup.

### Swagger Docs

API documentation annotations use swaggo format. After changes, regenerate:

```bash
cd server
swag init -g cmd/server/main.go
```

## Web Frontend Development

The frontend is at `apps/web/` and uses SvelteKit with Svelte 5.

### Adding a Page

Create a new directory under `src/routes/` with a `+page.svelte` file. SvelteKit uses file-based routing.

### Adding an API Client Function

1. Add the function in `src/lib/api/` using `authFetch`
2. Define TypeScript types in `src/lib/models/`
3. Use the function from your page or component

### Type Checking

```bash
cd apps/web
bun run check
```

## Android Development

```bash
make dev-android    # Opens in Android Studio
```

### Key Patterns

- All screens are Composable functions
- Dependencies come from `InstanceManager` via `koinInject()`
- Use `collectAsState().value ?: return` for nullable `StateFlow` values
- Navigation is handled in `MainActivity.kt`

### Building

```bash
make build-android-debug    # Debug APK
make build-android          # Release APK (needs keystore)
make release-android        # Build + install on device
```

## iOS Development

```bash
make dev-ios    # Opens in Xcode
```

### Key Patterns

- Views are SwiftUI structs
- Dependencies come from `InstanceManager` via `@EnvironmentObject`
- Use optional binding for nullable published properties
- Navigation uses SwiftUI's native navigation stack

### Project Generation

If you modify `project.yml`, regenerate the Xcode project:

```bash
cd apps/ios
xcodegen generate
```

### Building

```bash
make build-ios          # Release archive
make build-ios-sim      # Simulator build
make export-ios         # Export IPA
```

## Bot Agent Development

Agents are in `agents/` with one directory per agent.

```bash
cd agents/music_agent
pip install -r requirements.txt
python agent.py "http://localhost:8090/m/test-room"
```

All agents need a running Bedrud server to authenticate against.

## CI/CD

GitHub Actions runs on every push to `main` and on pull requests:

| Job | What it checks |
|-----|---------------|
| Server | `go vet`, build, tests |
| Web | Type check, build |
| Android | Lint, unit tests |
| iOS | Build, test (simulator) |

Release builds are triggered by version tags (`v*`).

## Code Style

- **Go:** Standard `gofmt` formatting
- **TypeScript/Svelte:** Prettier (configured in the web project)
- **Kotlin:** Android Studio default formatting
- **Swift:** Xcode default formatting

## Testing

=== "Server"

    ```bash
    cd server
    go test ./...
    ```

=== "Web"

    ```bash
    cd apps/web
    bun run check
    ```

=== "Android"

    ```bash
    cd apps/android
    ./gradlew test
    ```

=== "iOS"

    ```bash
    make build-ios-sim   # Builds and runs tests
    ```
