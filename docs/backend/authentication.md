# Authentication Flow

Bedrud provides several ways for users to identify themselves.

## JWT (JSON Web Tokens)
We use JWT for session management. When a user logs in, the server gives them two tokens:

1.  **Access Token:** Short-lived (e.g., 1 hour). Used to access protected API endpoints.
2.  **Refresh Token:** Long-lived (e.g., 30 days). Used to get a new Access Token without logging in again.

The backend validates these tokens in the `internal/middleware/auth.go` file.

## Token Management & Security

### 1. Token Pair Strategy (Rotation)
Bedrud uses a secure token rotation strategy. When a user authenticates, they receive:

- **Access Token:** Signed with HS256, contains user ID, name, and permissions. Valid for a short duration (configured via `tokenDuration`).
- **Refresh Token:** A separate long-lived token.

**Rotation:** When the Access Token expires, the client sends the Refresh Token to `/api/auth/refresh`. The server then issues a **brand new pair** of tokens and updates the stored refresh token in the database. This limits the window of opportunity even if a token is stolen.

### 2. Token Revocation (Blacklisting)
To support secure logout, Bedrud implements a **Token Blacklist**.

- When a user logs out, their current Refresh Token is added to the `blocked_refresh_tokens` table.
- Before refreshing any session, the server checks this table. If a token is blocked, the request is rejected immediately.
- A background task (Scheduler) is designed to clean up these blocked tokens once they naturally expire.

### 3. JWT Claims Structure
The tokens carry metadata that allows the backend and frontend to make quick decisions without database hits:
```json
{
  "userId": "uuid-string",
  "email": "user@example.com",
  "name": "Display Name",
  "accesses": ["user", "admin"],
  "exp": 123456789,
  "iat": 123456780
}
```

## Authentication Methods

### 1. Local Email & Password

- Passwords are never stored as plain text. We hash them using **bcrypt**.
- When you register, a new User record is created in the database.

### 2. Social Login (OAuth2)
Bedrud uses the `Goth` library to support:

- **Google**
- **GitHub**
- **Twitter**

You can enable these by filling in the `auth:` section in your `config.yaml` with your Client ID and API Secret.

### 3. Passkeys (WebAuthn/FIDO2)
Bedrud provides a modern, passwordless experience using the FIDO2 standard.

- **Registration Ceremony:**
  1.  **Begin:** The server generates a cryptographically secure **Challenge** and stores it in the user's session.
  2.  **Finish:** The client's authenticator (e.g., TouchID, YubiKey) signs the challenge. The server verifies the attestation, extracts the **Public Key**, and saves it in the `passkeys` table.
- **Authentication Ceremony:**
  1.  **Begin:** The server issues a new challenge.
  2.  **Finish:** The client signs the challenge with their private key. The server retrieves the Public Key from the database, verifies the signature, and checks the **Sign Counter**.
- **Security:** The matching of the `Counter` field prevents **Replay Attacks**. If the authenticator's counter is not higher than the stored counter, the login is rejected.

### 4. Guest Login
Allows users to join a meeting instantly with just a name. The server creates a temporary user record with the role `guest`.

## Interoperability & CORS
Bedrud is designed to be accessible from multiple origins, which is crucial for development (Svelte dev server) and production (different subdomains).

- **CORS Policy:** Defined in `config.yaml`. It supports `AllowCredentials: true`, which is required for the session cookies used during OAuth and Passkey ceremonies.
- **Allowed Origins:** By default, it allows the server's own domain and `localhost:5173` (Vite's default port).

## User Roles (Access Control)
Each user has a list of "accesses" (roles).

- `user`: Standard user. Can join and create rooms.
- `guest`: Temporary user. Can join rooms.
- `superadmin`: Can manage all users and rooms through the `/admin` dashboard.

We use the `middleware.RequireAccess("superadmin")` to protect admin routes.
