package repository

import (
	"bedrud/internal/models"
	"bedrud/internal/testutil"
	"testing"
	"time"
)

func TestUserRepository_CreateUser(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{
		ID:       "user-1",
		Email:    "test@example.com",
		Name:     "Test User",
		Provider: "local",
		Accesses: models.StringArray{"user"},
		IsActive: true,
	}

	err := repo.CreateUser(user)
	if err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	// Verify user was created
	found, err := repo.GetUserByID("user-1")
	if err != nil {
		t.Fatalf("failed to get user: %v", err)
	}
	if found == nil {
		t.Fatal("expected to find user")
	}
	if found.Email != "test@example.com" {
		t.Fatalf("expected email 'test@example.com', got '%s'", found.Email)
	}
}

func TestUserRepository_CreateUser_DuplicateEmail(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user1 := &models.User{ID: "user-1", Email: "dup@example.com", Name: "User 1", Provider: "local", IsActive: true}
	user2 := &models.User{ID: "user-2", Email: "dup@example.com", Name: "User 2", Provider: "local", IsActive: true}

	_ = repo.CreateUser(user1)
	err := repo.CreateUser(user2)
	if err == nil {
		t.Fatal("expected error for duplicate email")
	}
}

func TestUserRepository_GetUserByEmail(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{ID: "user-1", Email: "find@example.com", Name: "Found", Provider: "local", IsActive: true}
	_ = repo.CreateUser(user)

	found, err := repo.GetUserByEmail("find@example.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found == nil {
		t.Fatal("expected to find user")
	}
	if found.Name != "Found" {
		t.Fatalf("expected name 'Found', got '%s'", found.Name)
	}
}

func TestUserRepository_GetUserByEmail_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	found, err := repo.GetUserByEmail("nonexistent@example.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found != nil {
		t.Fatal("expected nil for non-existent user")
	}
}

func TestUserRepository_GetUserByID(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{ID: "user-42", Email: "id@example.com", Name: "ID User", Provider: "local", IsActive: true}
	_ = repo.CreateUser(user)

	found, err := repo.GetUserByID("user-42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found == nil || found.ID != "user-42" {
		t.Fatal("expected to find user by ID")
	}
}

func TestUserRepository_GetUserByID_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	found, err := repo.GetUserByID("nonexistent-id")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found != nil {
		t.Fatal("expected nil for non-existent user")
	}
}

func TestUserRepository_UpdateRefreshToken(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{ID: "user-1", Email: "refresh@example.com", Name: "Refresh", Provider: "local", IsActive: true}
	_ = repo.CreateUser(user)

	err := repo.UpdateRefreshToken("user-1", "new-refresh-token")
	if err != nil {
		t.Fatalf("failed to update refresh token: %v", err)
	}

	found, _ := repo.GetUserByID("user-1")
	if found.RefreshToken != "new-refresh-token" {
		t.Fatalf("expected refresh token 'new-refresh-token', got '%s'", found.RefreshToken)
	}
}

func TestUserRepository_UpdateUser(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{ID: "user-1", Email: "update@example.com", Name: "Original", Provider: "local", IsActive: true}
	_ = repo.CreateUser(user)

	user.Name = "Updated Name"
	err := repo.UpdateUser(user)
	if err != nil {
		t.Fatalf("failed to update user: %v", err)
	}

	found, _ := repo.GetUserByID("user-1")
	if found.Name != "Updated Name" {
		t.Fatalf("expected name 'Updated Name', got '%s'", found.Name)
	}
}

func TestUserRepository_DeleteUser(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{ID: "user-to-delete", Email: "delete@example.com", Name: "Delete Me", Provider: "local", IsActive: true}
	_ = repo.CreateUser(user)

	err := repo.DeleteUser("user-to-delete")
	if err != nil {
		t.Fatalf("failed to delete user: %v", err)
	}

	found, _ := repo.GetUserByID("user-to-delete")
	if found != nil {
		t.Fatal("expected user to be deleted")
	}
}

func TestUserRepository_GetAllUsers(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	_ = repo.CreateUser(&models.User{ID: "u1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	_ = repo.CreateUser(&models.User{ID: "u2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})
	_ = repo.CreateUser(&models.User{ID: "u3", Email: "u3@ex.com", Name: "U3", Provider: "google", IsActive: true})

	users, err := repo.GetAllUsers()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(users) != 3 {
		t.Fatalf("expected 3 users, got %d", len(users))
	}
}

func TestUserRepository_GetAllUsers_Empty(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	users, err := repo.GetAllUsers()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(users) != 0 {
		t.Fatalf("expected 0 users, got %d", len(users))
	}
}

func TestUserRepository_CreateOrUpdateUser(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{
		ID:       "user-1",
		Email:    "oauth@example.com",
		Name:     "OAuth User",
		Provider: "google",
		IsActive: true,
		Accesses: models.StringArray{"user"},
	}

	// First call should create
	err := repo.CreateOrUpdateUser(user)
	if err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	// Second call should update
	user.Name = "Updated OAuth User"
	err = repo.CreateOrUpdateUser(user)
	if err != nil {
		t.Fatalf("failed to update user: %v", err)
	}

	found, _ := repo.GetUserByEmail("oauth@example.com")
	if found == nil {
		t.Fatal("expected to find user")
	}
}

func TestUserRepository_GetUserByEmailAndProvider(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	_ = repo.CreateUser(&models.User{ID: "u1", Email: "local@ex.com", Name: "Local", Provider: "local", IsActive: true})
	_ = repo.CreateUser(&models.User{ID: "u2", Email: "google@ex.com", Name: "Google", Provider: "google", IsActive: true})

	found, err := repo.GetUserByEmailAndProvider("google@ex.com", "google")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found == nil {
		t.Fatal("expected to find user")
	}
	if found.Provider != "google" {
		t.Fatalf("expected provider 'google', got '%s'", found.Provider)
	}

	// Also verify provider mismatch returns nil
	notFound, err := repo.GetUserByEmailAndProvider("local@ex.com", "google")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if notFound != nil {
		t.Fatal("expected nil for email+provider mismatch")
	}
}

func TestUserRepository_GetUserByEmailAndProvider_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	found, err := repo.GetUserByEmailAndProvider("nonexist@ex.com", "local")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found != nil {
		t.Fatal("expected nil for non-existent user")
	}
}

func TestUserRepository_BlockRefreshToken(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{ID: "user-1", Email: "block@ex.com", Name: "Block", Provider: "local", IsActive: true}
	_ = repo.CreateUser(user)

	err := repo.BlockRefreshToken("user-1", "some-token", time.Now().Add(time.Hour))
	if err != nil {
		t.Fatalf("failed to block refresh token: %v", err)
	}

	if !repo.IsRefreshTokenBlocked("some-token") {
		t.Fatal("expected token to be blocked")
	}
}

func TestUserRepository_IsRefreshTokenBlocked_NotBlocked(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	if repo.IsRefreshTokenBlocked("nonexistent-token") {
		t.Fatal("expected token to not be blocked")
	}
}

func TestUserRepository_IsRefreshTokenBlocked_Expired(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{ID: "user-1", Email: "exp@ex.com", Name: "Exp", Provider: "local", IsActive: true}
	_ = repo.CreateUser(user)

	// Block with past expiration
	_ = repo.BlockRefreshToken("user-1", "expired-token", time.Now().Add(-1*time.Hour))

	if repo.IsRefreshTokenBlocked("expired-token") {
		t.Fatal("expected expired blocked token to not be considered blocked")
	}
}

func TestUserRepository_CleanupBlockedTokens(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)

	user := &models.User{ID: "user-1", Email: "cleanup@ex.com", Name: "Cleanup", Provider: "local", IsActive: true}
	_ = repo.CreateUser(user)

	_ = repo.BlockRefreshToken("user-1", "expired-1", time.Now().Add(-2*time.Hour))
	_ = repo.BlockRefreshToken("user-1", "expired-2", time.Now().Add(-1*time.Hour))
	_ = repo.BlockRefreshToken("user-1", "active-1", time.Now().Add(1*time.Hour))

	err := repo.CleanupBlockedTokens()
	if err != nil {
		t.Fatalf("failed to cleanup: %v", err)
	}

	// Only the active one should remain
	var count int64
	db.Model(&models.BlockedRefreshToken{}).Count(&count)
	if count != 1 {
		t.Fatalf("expected 1 remaining blocked token, got %d", count)
	}
}

func TestUserRepository_DeleteUser_CascadesCleanup(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewUserRepository(db)
	roomRepo := NewRoomRepository(db)

	// Create user
	user := &models.User{ID: "user-cascade", Email: "cascade@ex.com", Name: "Cascade", Provider: "local", IsActive: true}
	_ = repo.CreateUser(user)

	// Create room with this user
	_, _ = roomRepo.CreateRoom("user-cascade", "test-room", false, "standard", models.RoomSettings{})

	// Block a token
	_ = repo.BlockRefreshToken("user-cascade", "some-token", time.Now().Add(time.Hour))

	// Delete user should cascade
	err := repo.DeleteUser("user-cascade")
	if err != nil {
		t.Fatalf("failed to delete user: %v", err)
	}

	// Verify user is gone
	found, _ := repo.GetUserByID("user-cascade")
	if found != nil {
		t.Fatal("expected user to be deleted")
	}

	// Verify participants are cleaned up
	var participantCount int64
	db.Model(&models.RoomParticipant{}).Where("user_id = ?", "user-cascade").Count(&participantCount)
	if participantCount != 0 {
		t.Fatalf("expected 0 participant records, got %d", participantCount)
	}
}
