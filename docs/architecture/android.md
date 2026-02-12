# Android App

The Bedrud Android app is built with Jetpack Compose and Kotlin, providing a native video meeting experience with picture-in-picture, deep linking, and multi-instance support.

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Kotlin | 2.1.0 | Language |
| Jetpack Compose | Material 3 | UI toolkit |
| Koin | 4.0.0 | Dependency injection |
| Retrofit + OkHttp | Latest | HTTP client |
| LiveKit Android SDK | 2.23.3 | WebRTC media |
| Credentials API | Latest | Passkey support |
| Encrypted SharedPreferences | Latest | Secure storage |
| Coil | Latest | Image loading |

**Target:** Min SDK 28, Target SDK 35, JDK 17

## Directory Structure

```
apps/android/app/src/main/java/com/bedrud/app/
├── BedrudApplication.kt           # Application class (Koin init)
├── MainActivity.kt                # Single-activity entry point
├── core/
│   ├── api/                       # Retrofit API client
│   │   ├── ApiClient.kt           # Base HTTP client with auth interceptor
│   │   ├── AuthApi.kt             # Auth endpoint definitions
│   │   └── RoomApi.kt             # Room endpoint definitions
│   ├── auth/
│   │   └── AuthManager.kt         # Token management, login/logout
│   ├── call/
│   │   ├── CallService.kt         # Foreground service for calls
│   │   └── CallConnectionService.kt  # Android ConnectionService
│   ├── deeplink/
│   │   └── DeepLinkHandler.kt     # Handle bedrud.com deep links
│   ├── di/
│   │   └── AppModule.kt           # Koin module definitions
│   ├── instance/
│   │   ├── InstanceManager.kt     # Central multi-instance orchestrator
│   │   ├── InstanceStore.kt       # Persistent instance storage
│   │   └── InstanceDeps.kt        # Per-instance dependency container
│   ├── livekit/
│   │   └── RoomManager.kt         # LiveKit room connection manager
│   └── pip/
│       └── PipManager.kt          # Picture-in-Picture controller
├── models/
│   ├── User.kt                    # User data model
│   ├── Room.kt                    # Room data model
│   ├── Instance.kt                # Server instance model
│   └── ApiResponse.kt             # API response wrappers
└── ui/
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.kt     # Email/password + passkey login
    │   │   └── RegisterScreen.kt  # Account registration
    │   ├── dashboard/
    │   │   └── DashboardScreen.kt # Room list and management
    │   ├── meeting/
    │   │   └── MeetingScreen.kt   # Video call interface
    │   ├── instance/
    │   │   ├── AddInstanceScreen.kt    # Add server instance
    │   │   └── InstanceSwitcher.kt     # Switch between instances
    │   ├── profile/
    │   │   └── ProfileScreen.kt   # User profile
    │   └── settings/
    │       └── SettingsScreen.kt  # App settings
    ├── components/                 # Reusable Compose components
    └── theme/                      # Material 3 theme definition
```

## Multi-Instance Architecture

The Android app supports connecting to multiple Bedrud servers simultaneously.

```
┌──────────────────────────┐
│     InstanceManager      │  (Koin singleton)
│                          │
│  ┌────────────────────┐  │
│  │   InstanceStore    │  │  Persists list to SharedPreferences
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │  Active Instance   │──┼──► InstanceDeps
│  │  (StateFlow)       │  │    ├── AuthManager
│  └────────────────────┘  │    ├── ApiClient
│                          │    ├── AuthApi
│  instances: List<Instance>│    ├── RoomApi
│                          │    ├── PasskeyManager
└──────────────────────────┘    └── RoomManager
```

### Key Pattern

All per-instance dependencies are exposed as `StateFlow<T?>` on `InstanceManager`. Composables collect them:

```kotlin
val authManager = instanceManager.authManager.collectAsState().value ?: return
val roomApi = instanceManager.roomApi.collectAsState().value ?: return
```

The `?: return` pattern ensures the composable doesn't render until the instance is fully initialized.

### Navigation Flow

```
No instances ──► AddInstanceScreen
Has instances, not logged in ──► LoginScreen
Has instances, logged in ──► DashboardScreen
```

The instance switcher appears as a `ModalBottomSheet` triggered from the Dashboard toolbar.

## Features

### Deep Linking

The app handles URLs matching:

- `https://bedrud.com/m/*` — Direct room join
- `https://bedrud.com/c/*` — Room join by code

Configured via intent filters in `AndroidManifest.xml`.

### Call Management

- **CallService** — Foreground service that keeps the connection alive during calls
- **CallConnectionService** — Integrates with Android's telephony framework for proper call UI
- Required permissions: `MANAGE_OWN_CALLS`, `FOREGROUND_SERVICE_PHONE_CALL`, `FOREGROUND_SERVICE_CAMERA`, `FOREGROUND_SERVICE_MICROPHONE`

### Picture-in-Picture

The meeting screen supports PiP mode, allowing users to see the video feed while using other apps.

### Passkeys

Uses Android's Credentials API for FIDO2/WebAuthn passkey registration and login.

## Building

```bash
# Debug APK
make build-android-debug

# Release APK (requires keystore.properties)
make build-android

# Build + install on connected device
make release-android

# Open in Android Studio
make dev-android
```

### Release Signing

Release builds require a `keystore.properties` file in the android project root with your signing configuration.
