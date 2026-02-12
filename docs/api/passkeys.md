# Passkeys API

FIDO2/WebAuthn passkey endpoints allow users to register and authenticate using biometrics or security keys.

## Overview

Passkey flows use a challenge-response protocol with two phases each:

| Flow | Phase 1 (Begin) | Phase 2 (Finish) |
|------|-----------------|-------------------|
| Registration | `POST /api/auth/passkey/register/begin` | `POST /api/auth/passkey/register/finish` |
| Login | `POST /api/auth/passkey/login/begin` | `POST /api/auth/passkey/login/finish` |

---

## Registration Flow

Users must be logged in to register a passkey (it's linked to their existing account).

### Step 1: Begin Registration

```
POST /api/auth/passkey/register/begin
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**

```json
{
  "publicKey": {
    "challenge": "base64url-encoded-challenge",
    "rp": {
      "name": "Bedrud",
      "id": "meet.example.com"
    },
    "user": {
      "id": "base64url-encoded-user-id",
      "name": "user@example.com",
      "displayName": "John Doe"
    },
    "pubKeyCredParams": [
      { "type": "public-key", "alg": -7 },
      { "type": "public-key", "alg": -257 }
    ],
    "authenticatorSelection": {
      "userVerification": "preferred"
    }
  }
}
```

Pass this to the browser's WebAuthn API:

```javascript
const credential = await navigator.credentials.create({
  publicKey: response.publicKey
});
```

### Step 2: Finish Registration

```
POST /api/auth/passkey/register/finish
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:** The credential response from the browser, base64url-encoded:

```json
{
  "id": "credential-id",
  "rawId": "base64url-raw-id",
  "response": {
    "attestationObject": "base64url-attestation",
    "clientDataJSON": "base64url-client-data"
  },
  "type": "public-key"
}
```

**Response (200):**

```json
{
  "message": "passkey registered"
}
```

---

## Login Flow

### Step 1: Begin Login

```
POST /api/auth/passkey/login/begin
```

No authentication required.

**Response (200):**

```json
{
  "publicKey": {
    "challenge": "base64url-encoded-challenge",
    "rpId": "meet.example.com",
    "userVerification": "preferred"
  }
}
```

Pass this to the browser's WebAuthn API:

```javascript
const assertion = await navigator.credentials.get({
  publicKey: response.publicKey
});
```

### Step 2: Finish Login

```
POST /api/auth/passkey/login/finish
```

**Request Body:** The assertion response from the browser:

```json
{
  "id": "credential-id",
  "rawId": "base64url-raw-id",
  "response": {
    "authenticatorData": "base64url-auth-data",
    "clientDataJSON": "base64url-client-data",
    "signature": "base64url-signature"
  },
  "type": "public-key"
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
    "name": "John Doe"
  }
}
```

---

## Security

| Measure | Description |
|---------|-------------|
| Challenge/Response | Server-generated random challenges stored in session |
| Origin Verification | Strict origin and Relying Party ID validation |
| Counter Validation | Protects against cloned authenticators |
| Secure Transport | Designed for HTTPS with URL-safe base64 encoding |

## Implementation Details

- **Backend:** Uses `go-passkeys/go-passkeys` for pure Go WebAuthn verification
- **Session Storage:** Challenges are stored in Gorilla sessions (via `gothic.Store`)
- **Database:** Passkey credentials stored in the `Passkey` model (credential ID, public key, counter)
- **Frontend (Web):** `navigator.credentials` API with base64url helpers in `src/lib/auth.ts`
- **Android:** Credentials API for native passkey support
- **iOS:** ASAuthorizationController for passkey support

## How to Test

1. Log in with an existing account
2. Click the passkey registration button (fingerprint icon in the header/dashboard)
3. Complete the biometric prompt
4. Log out
5. Click "Sign in with Passkey" on the login page
6. Complete the biometric prompt to authenticate
