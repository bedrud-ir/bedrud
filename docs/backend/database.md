# Database and Models

Bedrud uses **GORM** as its ORM (Object-Relational Mapper). This makes it easy to switch between different database types.

## Supported Databases
- **SQLite:** Used by default for easy development and small installations. The database is stored in a file (usually `bedrud.db`).
- **PostgreSQL:** Recommended for production environments with many users.

You can configure the database type and connection details in the `config.yaml` file under the `database:` section.

## Core Models

The models are located in `internal/models/`. Here are the most important ones:

### User (`user.go`)

Stores account information including credentials and roles.

### Room (`room.go`)
Represents a meeting session. It uses GORM's **Embedded Structs** to organize settings. 
Instead of a separate table or a JSON blob, the `RoomSettings` fields (like `allow_chat`, `allow_video`) are stored directly in the `rooms` table with a `settings_` prefix (e.g., `settings_allow_chat`). This provides a clean model in Go while maintaining a flat, performant database structure.

### Passkey (`passkey.go`)

Stores FIDO2/WebAuthn public keys for passwordless login.

### Custom Types: `StringArray`

Standard SQL databases handle arrays differently (PostgreSQL has native arrays, SQLite does not). To maintain compatibility, Bedrud defines a `StringArray` type in `internal/models/user.go`.

- It implements `sql.Scanner` and `driver.Valuer`.
- In **PostgreSQL**, it uses the native `text[]` type.
- In **SQLite**, it serializes the array into a string (e.g., `{admin,user}`) for storage.

### Foreign Key Management

While GORM's `AutoMigrate` is powerful, it sometimes struggles with complex composite primary keys (like those used in `room_participants`). 

In `internal/database/migrations.go`, Bedrud manually executes `ALTER TABLE` statements to ensure foreign key constraints (like `ON DELETE CASCADE`) are correctly applied in production (PostgreSQL).

## Repository Pattern

We use the **Repository Pattern** to interact with the database. This means handlers do not call GORM directly. Instead, they use a repository.

Example:
```go
// In handler:
user, err := h.userRepo.GetByEmail(email)

// In repository:
func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
    var user models.User
    err := r.db.Where("email = ?", email).First(&user).Error
    return &user, err
}
```

## Automatic Migrations

When the server starts, it automatically runs "AutoMigrate". This creates or updates database tables based on the Go structures in `internal/models`. You don't need to manually write `CREATE TABLE` statements for simple changes.
