# Authentication API

All authentication endpoints are under `/api/auth/`.

## Overview

Bedrud supports multiple authentication methods:

| Method | Endpoint | Description |
|--------|----------|-------------|
| Email/Password | `POST /api/auth/login` | Traditional login |
| Registration | `POST /api/auth/register` | Create account |
| Guest | `POST /api/auth/guest-login` | Temporary access |
| OAuth | `GET /api/auth/:provider/login` | Social login |
| Passkeys | `POST /api/auth/passkey/*` | FIDO2/WebAuthn |
| Token Refresh | `POST /api/auth/refresh` | Renew access token |

## Token Format

Successful authentication returns a pair of JWT tokens:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

- **Access Token** — Short-lived, used in the `Authorization` header
- **Refresh Token** — Long-lived, used to obtain new access tokens

### Using Tokens

Include the access token in all authenticated requests:

```
Authorization: Bearer <accessToken>
```

---

## Endpoints

### Register

Create a new user account.

```
POST /api/auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

### Login

Authenticate with email and password.

```
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

### Guest Login

Join as a guest without creating an account. Guests have limited permissions.

```
POST /api/auth/guest-login
```

**Request Body:**

```json
{
  "name": "Guest User"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "name": "Guest User",
    "role": "guest"
  }
}
```

---

### Get Current User

Retrieve the authenticated user's profile.

```
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://...",
  "role": "user",
  "provider": "email"
}
```

---

### Refresh Token

Exchange a refresh token for a new access token.

```
POST /api/auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### Logout

Invalidate the current refresh token.

```
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**

```json
{
  "message": "logged out"
}
```

---

### OAuth Login

Start an OAuth flow with a social provider.

```
GET /api/auth/:provider/login
```

**Supported Providers:**

| Provider | Path |
|----------|------|
| Google | `/api/auth/google/login` |
| GitHub | `/api/auth/github/login` |
| Twitter | `/api/auth/twitter/login` |

The server redirects the user to the provider's authorization page. After consent, the provider redirects back to the callback URL, and the server returns JWT tokens.

---

## Error Responses

All auth endpoints return errors in this format:

```json
{
  "error": "invalid credentials"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing fields, validation error) |
| 401 | Invalid credentials or expired token |
| 409 | Email already registered |
| 500 | Internal server error |
