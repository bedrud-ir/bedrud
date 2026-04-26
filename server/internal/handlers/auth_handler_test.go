package handlers

import (
	"bedrud/config"
	"bedrud/internal/auth"
	"bedrud/internal/repository"
	"bedrud/internal/testutil"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

const bearerPrefix = "Bearer "

func setupAuthTestApp(t *testing.T) (*fiber.App, *auth.AuthService, *config.Config) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	passkeyRepo := repository.NewPasskeyRepository(db)
	settingsRepo := repository.NewSettingsRepository(db)
	inviteTokenRepo := repository.NewInviteTokenRepository(db)
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
	authHandler := NewAuthHandler(authService, cfg, settingsRepo, inviteTokenRepo)

	app := fiber.New()

	app.Post("/api/auth/register", authHandler.Register)
	app.Post("/api/auth/login", authHandler.Login)
	app.Post("/api/auth/guest-login", authHandler.GuestLogin)
	app.Get("/api/auth/me", func(c *fiber.Ctx) error {
		// Inline middleware for testing
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "missing"})
		}
		tokenStr := authHeader
		if len(authHeader) > 7 && authHeader[:7] == bearerPrefix {
			tokenStr = authHeader[7:]
		}
		claims, err := auth.ValidateToken(tokenStr, cfg)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid"})
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
	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(respBody))
	}

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(respBody, &result)
	tokens, _ := result["tokens"].(map[string]interface{})
	if tokens == nil || tokens["accessToken"] == nil || tokens["accessToken"] == "" {
		t.Fatal("expected tokens.accessToken in response")
	}
	if tokens["refreshToken"] == nil || tokens["refreshToken"] == "" {
		t.Fatal("expected tokens.refreshToken in response")
	}
	if result["user"] == nil {
		t.Fatal("expected user in response")
	}
}

func TestAuthHandler_Register_InvalidBody(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

func TestAuthHandler_Register_DuplicateEmail(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	body, _ := json.Marshal(map[string]string{
		"email":    "dup@example.com",
		"password": "pass123",
		"name":     "First User",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	resp.Body.Close()

	// Try again
	req2 := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
	req2.Header.Set("Content-Type", "application/json")
	resp2, _ := app.Test(req2, -1)
	defer resp2.Body.Close()
	if resp2.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected %d for duplicate, got %d", http.StatusBadRequest, resp2.StatusCode)
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
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(respBody))
	}
}

func TestAuthHandler_Login_InvalidCredentials(t *testing.T) {
	app, authService, _ := setupAuthTestApp(t)

	_, _ = authService.Register("wrong@example.com", "correctpass", "User")

	body, _ := json.Marshal(map[string]string{
		"email":    "wrong@example.com",
		"password": "wrongpassword",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected %d, got %d", http.StatusUnauthorized, resp.StatusCode)
	}
}

func TestAuthHandler_Login_NonexistentUser(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	body, _ := json.Marshal(map[string]string{
		"email":    "ghost@example.com",
		"password": "pass",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected %d, got %d", http.StatusUnauthorized, resp.StatusCode)
	}
}

func TestAuthHandler_Login_InvalidBody(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

func TestAuthHandler_GuestLogin_Success(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	body, _ := json.Marshal(map[string]string{"name": "Guest Player"})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/guest-login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(respBody))
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
	req := httptest.NewRequest(http.MethodPost, "/api/auth/guest-login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

func TestAuthHandler_GuestLogin_InvalidBody(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/guest-login", bytes.NewReader([]byte("{")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

func TestAuthHandler_GetMe_Success(t *testing.T) {
	app, authService, cfg := setupAuthTestApp(t)

	user, _ := authService.Register("me@example.com", "pass", "Me User")
	token, _ := auth.GenerateToken(user.ID, user.Email, user.Name, "local", user.Accesses, cfg)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", http.NoBody)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(respBody))
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

	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected %d, got %d", http.StatusUnauthorized, resp.StatusCode)
	}
}

func TestAuthHandler_GetMe_InvalidToken(t *testing.T) {
	app, _, _ := setupAuthTestApp(t)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", http.NoBody)
	req.Header.Set("Authorization", "Bearer invalid-jwt-token")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected %d, got %d", http.StatusUnauthorized, resp.StatusCode)
	}
}

// --- setupAuthTestAppFull wires RefreshToken, UpdateProfile, ChangePassword, Logout ---

func setupAuthTestAppFull(t *testing.T) (*fiber.App, *auth.AuthService, *config.Config) {
	t.Helper()
	app, authService, cfg := setupAuthTestApp(t)
	authHandler := NewAuthHandler(authService, cfg, nil, nil)

	// Helper: add auth-required routes to the existing app
	app.Post("/api/auth/refresh", authHandler.RefreshToken)
	app.Put("/api/auth/profile", func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "missing"})
		}
		tokenStr := authHeader
		if len(authHeader) > 7 && authHeader[:7] == bearerPrefix {
			tokenStr = authHeader[7:]
		}
		claims, err := auth.ValidateToken(tokenStr, cfg)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid"})
		}
		c.Locals("user", claims)
		return c.Next()
	}, authHandler.UpdateProfile)
	app.Post("/api/auth/change-password", func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "missing"})
		}
		tokenStr := authHeader
		if len(authHeader) > 7 && authHeader[:7] == bearerPrefix {
			tokenStr = authHeader[7:]
		}
		claims, err := auth.ValidateToken(tokenStr, cfg)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid"})
		}
		c.Locals("user", claims)
		return c.Next()
	}, authHandler.ChangePassword)
	app.Post("/api/auth/logout", func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "missing"})
		}
		tokenStr := authHeader
		if len(authHeader) > 7 && authHeader[:7] == bearerPrefix {
			tokenStr = authHeader[7:]
		}
		claims, err := auth.ValidateToken(tokenStr, cfg)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid"})
		}
		c.Locals("user", claims)
		return c.Next()
	}, authHandler.Logout)

	return app, authService, cfg
}

// --- RefreshToken tests ---

func TestAuthHandler_RefreshToken_Success(t *testing.T) {
	app, authService, cfg := setupAuthTestApp(t)

	_, _ = authService.Register("refresh@example.com", "pass", "Refresh User")
	loginResp, _ := authService.Login("refresh@example.com", "pass")

	authHandler := NewAuthHandler(authService, cfg, nil, nil)
	app.Post("/api/auth/refresh", authHandler.RefreshToken)

	body, _ := json.Marshal(map[string]string{
		"refresh_token": loginResp.Token.RefreshToken,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(respBody))
	}

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(respBody, &result)
	if result["access_token"] == nil || result["access_token"] == "" {
		t.Fatal("expected access_token in response")
	}
}

func TestAuthHandler_RefreshToken_InvalidToken(t *testing.T) {
	app, authService, cfg := setupAuthTestApp(t)
	authHandler := NewAuthHandler(authService, cfg, nil, nil)
	app.Post("/api/auth/refresh", authHandler.RefreshToken)

	body, _ := json.Marshal(map[string]string{"refresh_token": "not-a-real-token"})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected %d, got %d", http.StatusUnauthorized, resp.StatusCode)
	}
}

func TestAuthHandler_RefreshToken_InvalidBody(t *testing.T) {
	app, authService, cfg := setupAuthTestApp(t)
	authHandler := NewAuthHandler(authService, cfg, nil, nil)
	app.Post("/api/auth/refresh", authHandler.RefreshToken)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

// --- UpdateProfile tests ---

func TestAuthHandler_UpdateProfile_Success(t *testing.T) {
	app, authService, cfg := setupAuthTestAppFull(t)

	user, _ := authService.Register("upprof@example.com", "pass", "Old Name")
	token, _ := auth.GenerateToken(user.ID, user.Email, user.Name, "local", user.Accesses, cfg)

	body, _ := json.Marshal(map[string]string{"name": "New Name"})
	req := httptest.NewRequest(http.MethodPut, "/api/auth/profile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(respBody))
	}
}

func TestAuthHandler_UpdateProfile_ShortName(t *testing.T) {
	app, authService, cfg := setupAuthTestAppFull(t)

	user, _ := authService.Register("shortname@example.com", "pass", "User")
	token, _ := auth.GenerateToken(user.ID, user.Email, user.Name, "local", user.Accesses, cfg)

	body, _ := json.Marshal(map[string]string{"name": "X"})
	req := httptest.NewRequest(http.MethodPut, "/api/auth/profile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

// --- ChangePassword tests ---

func TestAuthHandler_ChangePassword_Success(t *testing.T) {
	app, authService, cfg := setupAuthTestAppFull(t)

	user, _ := authService.Register("chpass@example.com", "oldpass123", "User")
	token, _ := auth.GenerateToken(user.ID, user.Email, user.Name, "local", user.Accesses, cfg)

	body, _ := json.Marshal(map[string]string{
		"currentPassword": "oldpass123",
		"newPassword":     "newpass456",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/change-password", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(respBody))
	}
}

func TestAuthHandler_ChangePassword_TooShortNewPassword(t *testing.T) {
	app, authService, cfg := setupAuthTestAppFull(t)

	user, _ := authService.Register("shortpw@example.com", "oldpass123", "User")
	token, _ := auth.GenerateToken(user.ID, user.Email, user.Name, "local", user.Accesses, cfg)

	body, _ := json.Marshal(map[string]string{
		"currentPassword": "oldpass123",
		"newPassword":     "abc",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/change-password", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

// --- Logout tests ---

func TestAuthHandler_Logout_Success(t *testing.T) {
	app, authService, cfg := setupAuthTestAppFull(t)

	user, _ := authService.Register("logoutha@example.com", "pass", "Logout User")
	loginResp, _ := authService.Login("logoutha@example.com", "pass")
	token, _ := auth.GenerateToken(user.ID, user.Email, user.Name, "local", user.Accesses, cfg)

	body, _ := json.Marshal(map[string]string{"refresh_token": loginResp.Token.RefreshToken})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(respBody))
	}
}

func TestAuthHandler_Logout_InvalidBody(t *testing.T) {
	app, authService, cfg := setupAuthTestAppFull(t)

	user, _ := authService.Register("logoutbad@example.com", "pass", "Logout Bad")
	token, _ := auth.GenerateToken(user.ID, user.Email, user.Name, "local", user.Accesses, cfg)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}
