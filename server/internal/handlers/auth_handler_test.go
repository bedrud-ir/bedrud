package handlers

import (
	"bedrud/config"
	"bedrud/internal/auth"
	"bedrud/internal/repository"
	"bedrud/internal/testutil"
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func setupAuthTestApp(t *testing.T) (*fiber.App, *auth.AuthService, *config.Config) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	authService := auth.NewAuthService(userRepo, passkeyRepo)
	cfg := &config.Config{
		Auth: config.AuthConfig{
			JWTSecret:     "handler-auth-test-secret-key-32b",
			TokenDuration: 1,
			SessionSecret: "session-secret-for-testing",
		},
		Server: config.ServerConfig{
			Domain: "localhost",
		},
	}
	// Set global config so Login/GuestLogin (which call config.Get()) don't panic
	config.SetForTest(cfg)
	authHandler := NewAuthHandler(authService, cfg)

	app := fiber.New()

	app.Post("/api/auth/register", authHandler.Register)
	app.Post("/api/auth/login", authHandler.Login)
	app.Post("/api/auth/guest-login", authHandler.GuestLogin)
	app.Get("/api/auth/me", func(c *fiber.Ctx) error {
		// Inline middleware for testing
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{"error": "missing"})
		}
		tokenStr := authHeader
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenStr = authHeader[7:]
		}
		claims, err := auth.ValidateToken(tokenStr, cfg)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "invalid"})
		}
		c.Locals("user", claims)
		return c.Next()
	}, authHandler.GetMe)

	return app, authService, cfg
}

func TestAuthHandler_Register_Success(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	body, _ := json.Marshal(map[string]string{
		"email":    "new@example.com",
		"password": "securepass123",
		"name":     "New User",
	})
	req := httptest.NewRequest("POST", "/api/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, string(respBody))
	}

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(respBody, &result)
	if result["access_token"] == nil || result["access_token"] == "" {
		t.Fatal("expected access_token in response")
	}
	if result["refresh_token"] == nil || result["refresh_token"] == "" {
		t.Fatal("expected refresh_token in response")
	}
}

func TestAuthHandler_Register_InvalidBody(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	req := httptest.NewRequest("POST", "/api/auth/register", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestAuthHandler_Register_DuplicateEmail(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	body, _ := json.Marshal(map[string]string{
		"email":    "dup@example.com",
		"password": "pass123",
		"name":     "First User",
	})
	req := httptest.NewRequest("POST", "/api/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	app.Test(req)

	// Try again
	req2 := httptest.NewRequest("POST", "/api/auth/register", bytes.NewReader(body))
	req2.Header.Set("Content-Type", "application/json")
	resp2, _ := app.Test(req2)
	if resp2.StatusCode != 400 {
		t.Fatalf("expected 400 for duplicate, got %d", resp2.StatusCode)
	}
}

func TestAuthHandler_Login_Success(t *testing.T) {
	app, authService, _ := setupAuthTestApp(t)

	// First register a user
	_, _ = authService.Register("login@example.com", "mypassword", "Login User")

	// Now login
	body, _ := json.Marshal(map[string]string{
		"email":    "login@example.com",
		"password": "mypassword",
	})
	req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, string(respBody))
	}
}

func TestAuthHandler_Login_InvalidCredentials(t *testing.T) {
	app, authService, _ := setupAuthTestApp(t)

	_, _ = authService.Register("wrong@example.com", "correctpass", "User")

	body, _ := json.Marshal(map[string]string{
		"email":    "wrong@example.com",
		"password": "wrongpassword",
	})
	req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	if resp.StatusCode != 401 {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestAuthHandler_Login_NonexistentUser(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	body, _ := json.Marshal(map[string]string{
		"email":    "ghost@example.com",
		"password": "pass",
	})
	req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	if resp.StatusCode != 401 {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestAuthHandler_Login_InvalidBody(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestAuthHandler_GuestLogin_Success(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	body, _ := json.Marshal(map[string]string{"name": "Guest Player"})
	req := httptest.NewRequest("POST", "/api/auth/guest-login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, string(respBody))
	}

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(respBody, &result)

	user := result["user"].(map[string]interface{})
	if user["name"] != "Guest Player" {
		t.Fatalf("expected name 'Guest Player', got '%v'", user["name"])
	}
}

func TestAuthHandler_GuestLogin_EmptyName(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	body, _ := json.Marshal(map[string]string{"name": ""})
	req := httptest.NewRequest("POST", "/api/auth/guest-login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestAuthHandler_GuestLogin_InvalidBody(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	req := httptest.NewRequest("POST", "/api/auth/guest-login", bytes.NewReader([]byte("{")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)
	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestAuthHandler_GetMe_Success(t *testing.T) {
	app, authService, cfg := setupAuthTestApp(t)

	user, _ := authService.Register("me@example.com", "pass", "Me User")
	token, _ := auth.GenerateToken(user.ID, user.Email, user.Name, "local", user.Accesses, cfg)

	req := httptest.NewRequest("GET", "/api/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := app.Test(req)
	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected 200, got %d: %s", resp.StatusCode, string(respBody))
	}

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(respBody, &result)
	if result["email"] != "me@example.com" {
		t.Fatalf("expected email 'me@example.com', got '%v'", result["email"])
	}
}

func TestAuthHandler_GetMe_NoToken(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	req := httptest.NewRequest("GET", "/api/auth/me", nil)
	resp, _ := app.Test(req)
	if resp.StatusCode != 401 {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestAuthHandler_GetMe_InvalidToken(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	req := httptest.NewRequest("GET", "/api/auth/me", nil)
	req.Header.Set("Authorization", "Bearer invalid-jwt-token")
	resp, _ := app.Test(req)
	if resp.StatusCode != 401 {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}
