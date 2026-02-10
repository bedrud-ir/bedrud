# Passkey Support for Bedrud

This update adds support for FIDO2/WebAuthn Passkeys to the Bedrud meeting platform, allowing users to register and log in using biometrics or security keys.

## Backend Changes (Go)

- **New Dependency**: Added `github.com/go-passkeys/go-passkeys/webauthn` for pure Go, zero-dependency WebAuthn verification.
- **Models**:
    - Created `Passkey` model to store credential IDs, public keys, and counters.
    - Added `Passkey` to GORM migrations.
- **Repository**:
    - Implemented `PasskeyRepository` for database operations (GORM).
- **Service Layer**:
    - Updated `AuthService` with passkey registration and login logic.
    - Added `BeginRegisterPasskey`, `FinishRegisterPasskey`, `BeginLoginPasskey`, and `FinishLoginPasskey`.
- **Handlers**:
    - Added endpoints for passkey flows in `AuthHandler`.
    - Integrated with Gorilla sessions (via `gothic.Store`) to securely store WebAuthn challenges.
- **Routing**:
    - Registered `/api/auth/passkey/*` routes in `server.go` and `main.go`.

## Frontend Changes (Svelte 5)

- **API Client**:
    - Added passkey-related endpoints to `frontend/src/lib/api/auth.ts`.
- **Auth Library**:
    - Implemented `passkeyLogin()` and `passkeyRegister()` in `frontend/src/lib/auth.ts`.
    - Added robust base64 (URL-safe) and buffer conversion helpers.
- **Login Page**:
    - Added a "Sign in with Passkey" button with smooth animations and biometric prompt integration.
- **Dashboard**:
    - Added a passkey registration button to the user profile area for quick setup after initial login.

## Security Best Practices Implemented

- **Challenge/Response**: Server-generated random challenges stored in session.
- **Origin Verification**: Strict origin and RP ID validation using configured domain.
- **Counter Validation**: Protects against cloned authenticators by tracking the sign-in counter.
- **Secure Transport**: Designed for HTTPS deployment with URL-safe base64 encoding.

## How to Test

1. **Build Backend**: Run `make build-back`.
2. **Login**: Go to the login page.
3. **Register Passkey**: Log in with an existing account, click the Fingerprint icon in the header/dashboard to add a passkey.
4. **Login with Passkey**: Logout and click "Sign in with Passkey" on the login page.
