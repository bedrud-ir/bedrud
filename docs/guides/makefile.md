# Makefile Reference

The root `Makefile` is the central build orchestration tool for the Bedrud monorepo. It provides commands for development, building, and deployment across all platforms.

## Usage

```bash
make <target>
make help       # Show all available targets
```

## Development Targets

| Target | Description |
|--------|-------------|
| `make init` | Install all dependencies (web + server) |
| `make dev` | Run LiveKit + server + web concurrently |
| `make dev-web` | Run frontend dev server only |
| `make dev-server` | Run backend server only |
| `make dev-livekit` | Run local LiveKit server |
| `make dev-ios` | Open iOS project in Xcode |
| `make dev-android` | Open Android project in Android Studio |

### `make init`

Installs dependencies for both the web frontend and Go server:

```bash
cd apps/web && bun install
cd server && go mod tidy && go mod download
```

### `make dev`

Starts all three development services concurrently. Press `Ctrl+C` to stop all:

- **LiveKit** at `localhost:7880`
- **Server** at `localhost:8090`
- **Web** at `localhost:5173`

## Build Targets

| Target | Description |
|--------|-------------|
| `make build` | Build frontend + backend (embedded) |
| `make build-front` | Build frontend only |
| `make build-back` | Build backend only |
| `make build-dist` | Build production linux/amd64 tarball |

### `make build`

Full production build:

1. Builds the Svelte frontend (`bun run build`)
2. Copies compiled output to `server/frontend/`
3. Builds the Go binary with embedded frontend

Output: `server/dist/bedrud`

### `make build-dist`

Creates a compressed, production-ready distribution:

1. Runs `make build`
2. Cross-compiles for `linux/amd64` with stripped debug symbols
3. Creates `dist/bedrud_linux_amd64.tar.xz`

## Android Targets

| Target | Description |
|--------|-------------|
| `make build-android-debug` | Build debug APK |
| `make build-android` | Build release APK (requires keystore) |
| `make install-android` | Install release APK on connected device |
| `make release-android` | Build + install release APK |

### APK Output Paths

- Debug: `apps/android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `apps/android/app/build/outputs/apk/release/app-release.apk`

## iOS Targets

| Target | Description |
|--------|-------------|
| `make build-ios` | Build iOS archive (Release) |
| `make export-ios` | Export IPA from archive |
| `make build-ios-sim` | Build for iOS Simulator (Debug) |

### Output Paths

- Archive: `apps/ios/build/Bedrud.xcarchive`
- IPA: `apps/ios/build/export/Bedrud.ipa`

## Deploy Target

| Target | Description |
|--------|-------------|
| `make deploy ARGS=...` | Run the deployment CLI tool |

### Example

```bash
make deploy ARGS="--auto-config --ip 1.2.3.4 --user root --domain meet.example.com"
```

This runs the Python CLI at `tools/cli/bedrud.py` with the provided arguments.
