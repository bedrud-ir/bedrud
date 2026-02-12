# Admin API

Admin endpoints are under `/api/admin/`. These require **Super Admin** role.

## Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/:id/status` | PUT | Activate or deactivate a user |

---

## Endpoints

### List All Users

Retrieve a list of all registered users.

```
GET /api/admin/users
```

**Headers:** `Authorization: Bearer <accessToken>`

**Required Role:** Super Admin

**Response (200):**

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://...",
      "role": "user",
      "provider": "email",
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "provider": "email",
      "isActive": true,
      "createdAt": "2025-01-10T08:00:00Z"
    }
  ]
}
```

---

### Update User Status

Activate or deactivate a user account. Deactivated users cannot log in.

```
PUT /api/admin/users/:id/status
```

**Headers:** `Authorization: Bearer <accessToken>`

**Required Role:** Super Admin

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| `id` | User UUID |

**Request Body:**

```json
{
  "isActive": false
}
```

**Response (200):**

```json
{
  "message": "user status updated",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "isActive": false
  }
}
```

---

## User Roles

| Role | Description | Permissions |
|------|-------------|------------|
| `guest` | Temporary user | Join rooms only |
| `user` | Regular user | Create/join rooms, manage own profile |
| `admin` | Super Admin | All user permissions + manage users, view all rooms |

### Creating an Admin

Admin users are created via the CLI tool:

```bash
# Create a user
./bedrud-cli -create -email="admin@example.com" -password="securepassword" -name="Admin"

# Promote to admin
./bedrud-cli -make-admin -email="admin@example.com"
```

There is no API endpoint to promote users — this is intentional for security.

---

## Error Responses

```json
{
  "error": "forbidden"
}
```

| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 403 | Not a Super Admin |
| 404 | User not found |
| 500 | Internal server error |
