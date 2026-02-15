package handlers

import (
	"bedrud/internal/auth"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"bedrud/internal/testutil"
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

// --- Helper ---

func setupUsersTestApp(t *testing.T) (*fiber.App, *repository.UserRepository) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	usersHandler := NewUsersHandler(userRepo)

	app := fiber.New()
	// Simulate Protected middleware by injecting claims
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user", &auth.Claims{
			UserID:   "admin-user",
			Email:    "admin@ex.com",
			Name:     "Admin",
			Accesses: []string{"superadmin"},
		})
		return c.Next()
	})

	app.Get("/admin/users", usersHandler.ListUsers)
	app.Put("/admin/users/:id/status", usersHandler.UpdateUserStatus)

	return app, userRepo
}

// --- ListUsers Tests ---

func TestUsersHandler_ListUsers_Empty(t *testing.T) {
	app, _ := setupUsersTestApp(t)

	req := httptest.NewRequest("GET", "/admin/users", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var result UserListResponse
	_ = json.Unmarshal(body, &result)
	// Users list should be empty (or nil since no users exist)
	if len(result.Users) > 0 {
		t.Fatalf("expected empty users, got %d", len(result.Users))
	}
}

func TestUsersHandler_ListUsers_WithUsers(t *testing.T) {
	app, userRepo := setupUsersTestApp(t)

	// Create some users
	_ = userRepo.CreateUser(&models.User{ID: "u1", Email: "u1@ex.com", Name: "User 1", Provider: "local", IsActive: true, Accesses: models.StringArray{"user"}})
	_ = userRepo.CreateUser(&models.User{ID: "u2", Email: "u2@ex.com", Name: "User 2", Provider: "google", IsActive: false, Accesses: models.StringArray{"admin"}})

	req := httptest.NewRequest("GET", "/admin/users", nil)
	resp, _ := app.Test(req)
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var result UserListResponse
	_ = json.Unmarshal(body, &result)
	if len(result.Users) != 2 {
		t.Fatalf("expected 2 users, got %d", len(result.Users))
	}

	// Verify user details
	foundU1 := false
	for _, u := range result.Users {
		if u.ID == "u1" {
			foundU1 = true
			if u.Email != "u1@ex.com" {
				t.Fatalf("expected email 'u1@ex.com', got '%s'", u.Email)
			}
			if u.Provider != "local" {
				t.Fatalf("expected provider 'local', got '%s'", u.Provider)
			}
			if !u.IsActive {
				t.Fatal("expected u1 to be active")
			}
		}
	}
	if !foundU1 {
		t.Fatal("expected to find u1 in response")
	}
}

// --- UpdateUserStatus Tests ---

func TestUsersHandler_UpdateUserStatus_Success(t *testing.T) {
	app, userRepo := setupUsersTestApp(t)

	_ = userRepo.CreateUser(&models.User{ID: "target-user", Email: "target@ex.com", Name: "Target", Provider: "local", IsActive: true})

	body, _ := json.Marshal(UserStatusUpdateRequest{Active: false})
	req := httptest.NewRequest("PUT", "/admin/users/target-user/status", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)

	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	// Verify user was deactivated
	user, _ := userRepo.GetUserByID("target-user")
	if user.IsActive {
		t.Fatal("expected user to be deactivated")
	}
}

func TestUsersHandler_UpdateUserStatus_Reactivate(t *testing.T) {
	app, userRepo := setupUsersTestApp(t)

	_ = userRepo.CreateUser(&models.User{ID: "inactive-user", Email: "inactive@ex.com", Name: "Inactive", Provider: "local", IsActive: false})

	body, _ := json.Marshal(UserStatusUpdateRequest{Active: true})
	req := httptest.NewRequest("PUT", "/admin/users/inactive-user/status", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)

	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	user, _ := userRepo.GetUserByID("inactive-user")
	if !user.IsActive {
		t.Fatal("expected user to be reactivated")
	}
}

func TestUsersHandler_UpdateUserStatus_NotFound(t *testing.T) {
	app, _ := setupUsersTestApp(t)

	body, _ := json.Marshal(UserStatusUpdateRequest{Active: false})
	req := httptest.NewRequest("PUT", "/admin/users/nonexistent-id/status", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)

	if resp.StatusCode != 404 {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestUsersHandler_UpdateUserStatus_InvalidBody(t *testing.T) {
	app, _ := setupUsersTestApp(t)

	req := httptest.NewRequest("PUT", "/admin/users/some-id/status", bytes.NewReader([]byte("not json")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)

	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

// --- Handler model struct tests ---

func TestErrorResponse_Structure(t *testing.T) {
	e := ErrorResponse{Error: "test error"}
	b, _ := json.Marshal(e)
	var decoded map[string]string
	_ = json.Unmarshal(b, &decoded)
	if decoded["error"] != "test error" {
		t.Fatal("unexpected JSON representation")
	}
}

func TestAuthResponse_Structure(t *testing.T) {
	a := AuthResponse{
		User: UserResponse{
			ID:        "123",
			Email:     "test@ex.com",
			Name:      "Test",
			Provider:  "google",
			AvatarURL: "https://avatar.com/pic.jpg",
		},
		Token: "some-jwt-token",
	}
	if a.User.ID != "123" {
		t.Fatal("unexpected user ID")
	}
	if a.Token != "some-jwt-token" {
		t.Fatal("unexpected token")
	}
}

func TestUserResponse_JSONTags(t *testing.T) {
	u := UserResponse{
		ID:        "id",
		Email:     "e",
		Name:      "n",
		Provider:  "p",
		AvatarURL: "url",
	}
	b, _ := json.Marshal(u)
	var m map[string]interface{}
	_ = json.Unmarshal(b, &m)

	// Check JSON keys
	if _, ok := m["id"]; !ok {
		t.Fatal("expected 'id' key in JSON")
	}
	if _, ok := m["avatarUrl"]; !ok {
		t.Fatal("expected 'avatarUrl' key in JSON")
	}
}

func TestUserDetails_Structure(t *testing.T) {
	d := UserDetails{
		ID:        "u1",
		Email:     "e@e.com",
		Name:      "N",
		Provider:  "local",
		IsActive:  true,
		Accesses:  []string{"user"},
		CreatedAt: "2025-01-01 12:00:00",
	}
	if d.ID != "u1" || d.CreatedAt != "2025-01-01 12:00:00" {
		t.Fatal("unexpected UserDetails values")
	}
}
