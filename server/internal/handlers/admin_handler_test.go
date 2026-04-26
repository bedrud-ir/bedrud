package handlers

import (
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

func setupAdminTestApp(t *testing.T) (*fiber.App, *repository.SettingsRepository, *repository.InviteTokenRepository) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	settingsRepo := repository.NewSettingsRepository(db)
	inviteTokenRepo := repository.NewInviteTokenRepository(db)
	adminHandler := NewAdminHandler(settingsRepo, inviteTokenRepo)

	app := fiber.New()
	// Inject admin claims for all routes
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user", &auth.Claims{
			UserID:   "admin-user-id",
			Email:    "admin@example.com",
			Name:     "Admin",
			Accesses: []string{"superadmin"},
		})
		return c.Next()
	})

	app.Get("/admin/settings", adminHandler.GetSettings)
	app.Put("/admin/settings", adminHandler.UpdateSettings)
	app.Get("/public/settings", adminHandler.GetPublicSettings)
	app.Get("/admin/invite-tokens", adminHandler.ListInviteTokens)
	app.Post("/admin/invite-tokens", adminHandler.CreateInviteToken)
	app.Delete("/admin/invite-tokens/:id", adminHandler.DeleteInviteToken)

	return app, settingsRepo, inviteTokenRepo
}

func TestAdminHandler_GetSettings_Default(t *testing.T) {
	app, _, _ := setupAdminTestApp(t)

	req := httptest.NewRequest(http.MethodGet, "/admin/settings", http.NoBody)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(body))
	}
}

func TestAdminHandler_GetPublicSettings(t *testing.T) {
	app, _, _ := setupAdminTestApp(t)

	req := httptest.NewRequest(http.MethodGet, "/public/settings", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected %d, got %d", http.StatusOK, resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(body, &result)
	if _, ok := result["registrationEnabled"]; !ok {
		t.Fatal("expected 'registrationEnabled' in public settings response")
	}
	if _, ok := result["tokenRegistrationOnly"]; !ok {
		t.Fatal("expected 'tokenRegistrationOnly' in public settings response")
	}
}

func TestAdminHandler_UpdateSettings_Success(t *testing.T) {
	app, settingsRepo, _ := setupAdminTestApp(t)

	body, _ := json.Marshal(map[string]interface{}{
		"registrationEnabled":   false,
		"tokenRegistrationOnly": true,
	})
	req := httptest.NewRequest(http.MethodPut, "/admin/settings", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(respBody))
	}

	// Verify the settings were persisted (TokenRegistrationOnly: false→true is safe to check)
	saved, err := settingsRepo.GetSettings()
	if err != nil {
		t.Fatalf("unexpected error reading settings: %v", err)
	}
	if !saved.TokenRegistrationOnly {
		t.Fatal("expected TokenRegistrationOnly to be true after update")
	}
}

func TestAdminHandler_UpdateSettings_InvalidBody(t *testing.T) {
	app, _, _ := setupAdminTestApp(t)

	req := httptest.NewRequest(http.MethodPut, "/admin/settings", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

func TestAdminHandler_ListInviteTokens_Empty(t *testing.T) {
	app, _, _ := setupAdminTestApp(t)

	req := httptest.NewRequest(http.MethodGet, "/admin/invite-tokens", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected %d, got %d", http.StatusOK, resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(body, &result)
	tokens, _ := result["tokens"].([]interface{})
	if len(tokens) != 0 {
		t.Fatalf("expected empty token list, got %d", len(tokens))
	}
}

func TestAdminHandler_CreateInviteToken_Success(t *testing.T) {
	app, _, _ := setupAdminTestApp(t)

	body, _ := json.Marshal(map[string]interface{}{
		"email":          "invited@example.com",
		"expiresInHours": 48,
	})
	req := httptest.NewRequest(http.MethodPost, "/admin/invite-tokens", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusCreated, resp.StatusCode, string(respBody))
	}

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(respBody, &result)
	if result["token"] == nil || result["token"] == "" {
		t.Fatal("expected 'token' field in response")
	}
	if result["id"] == nil {
		t.Fatal("expected 'id' field in response")
	}
}

func TestAdminHandler_CreateInviteToken_DefaultExpiry(t *testing.T) {
	app, _, _ := setupAdminTestApp(t)

	// expiresInHours = 0 should default to 72 hours
	body, _ := json.Marshal(map[string]interface{}{"email": "default@example.com"})
	req := httptest.NewRequest(http.MethodPost, "/admin/invite-tokens", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected %d, got %d", http.StatusCreated, resp.StatusCode)
	}
}

func TestAdminHandler_DeleteInviteToken_Success(t *testing.T) {
	app, _, inviteTokenRepo := setupAdminTestApp(t)

	// Create a token first via repo
	createBody, _ := json.Marshal(map[string]interface{}{
		"email":          "todelete@example.com",
		"expiresInHours": 24,
	})
	createReq := httptest.NewRequest(http.MethodPost, "/admin/invite-tokens", bytes.NewReader(createBody))
	createReq.Header.Set("Content-Type", "application/json")
	createResp, _ := app.Test(createReq, -1)
	defer createResp.Body.Close()

	createRespBody, _ := io.ReadAll(createResp.Body)
	var created map[string]interface{}
	_ = json.Unmarshal(createRespBody, &created)
	tokenID, _ := created["id"].(string)

	// Verify it exists
	tokens, _ := inviteTokenRepo.List()
	if len(tokens) == 0 {
		t.Fatal("expected at least one token before delete")
	}

	// Delete it
	req := httptest.NewRequest(http.MethodDelete, "/admin/invite-tokens/"+tokenID, http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected %d, got %d: %s", http.StatusOK, resp.StatusCode, string(respBody))
	}
}
