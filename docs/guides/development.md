# Development Workflow

This guide covers the day-to-day development workflow for contributing to Bedrud.

## Repository Layout

```
bedrud/
├── server/          # Go backend
├── apps/
│   ├── web/         # React frontend (TanStack Start)
│   ├── android/     # Android app
│   ├── ios/         # iOS app
│   └── desktop/     # Desktop app (Rust + Slint)
├── agents/          # Python bot agents
├── packages/        # Shared TypeScript types
├── tools/cli/       # Deployment CLI
├── docs/            # Documentation (MkDocs)
├── Cargo.toml       # Rust workspace root
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
| Rust (stable) | Desktop app |
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

This starts LiveKit, the Go server, and the React dev server concurrently. Press `Ctrl+C` to stop all processes.

### Running Services Individually

=== "Web Frontend"

    ```bash
    make dev-web
    ```
    Runs at `http://localhost:3000` with hot module replacement.

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

The frontend is at `apps/web/` and uses React 19 with TanStack Start.

### Adding a Page

Create a new file under `src/routes/` following TanStack Router's file naming convention (e.g. `src/routes/settings.tsx`). Export a `Route` created with `createFileRoute`.

### Adding an API Client Function

1. Add the function in `src/lib/api.ts` using `authFetch`
2. Define TypeScript types inline or in a shared types file
3. Use the function from your route component, typically via a TanStack Query `useQuery` hook

### Type Checking

```bash
cd apps/web
bun run check    # runs tsc --noEmit
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

## Desktop Development

The desktop app lives in `apps/desktop/` and is a Rust crate in the workspace.

### Prerequisites (Linux)

```bash
sudo apt-get install -y \
  libfontconfig1-dev libxkbcommon-dev libxkbcommon-x11-dev \
  libwayland-dev libgles2-mesa-dev libegl1-mesa-dev \
  libdbus-1-dev libsecret-1-dev
```

Windows requires Visual Studio Build Tools with the C++ workload (MSVC).

### Running

```bash
make dev-desktop    # cargo run -p bedrud-desktop
```

### Building

```bash
make build-desktop           # optimised binary for the current platform
```

### Key Patterns

- All UI is defined in `.slint` files under `apps/desktop/ui/`; compiled to Rust at build time by `build.rs`
- `apps/desktop/src/ui/bridge.rs` is the only place where Slint callbacks are wired to Rust logic — keep business logic out of the `.slint` files
- Use `Weak<AppWindow>` when spawning background tasks that need to update the UI

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
| Android | Lint, unit tests, debug APK |
| iOS | Build + test (simulator, with coverage) |
| Desktop | `cargo build`, `cargo test` |

Release builds are triggered by version tags (`v*`).

## Code Style

- **Go:** Standard `gofmt` formatting
- **TypeScript/React:** Prettier (configured in the web project)
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
