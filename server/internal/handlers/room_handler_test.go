package handlers

import (
	"bedrud/config"
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

// setupRoomTestApp builds a Fiber app wired to the RoomHandler with an in-memory DB.
// The LiveKit client points at a non-existent host so calls fail gracefully.
func setupRoomTestApp(t *testing.T) (*fiber.App, *repository.RoomRepository, *auth.Claims) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	roomRepo := repository.NewRoomRepository(db)

	lkCfg := config.LiveKitConfig{
		Host:      "http://localhost:9999", // nothing running here
		APIKey:    "test-key",
		APISecret: "test-secret",
	}
	handler := NewRoomHandler(lkCfg, config.ChatConfig{}, roomRepo)

	claims := &auth.Claims{
		UserID:   "creator-user",
		Email:    "creator@ex.com",
		Name:     "Creator",
		Accesses: []string{"user"},
	}

	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user", claims)
		return c.Next()
	})

	app.Get("/rooms", handler.ListRooms)
	app.Post("/rooms/guest-join", handler.GuestJoinRoom)
	app.Delete("/rooms/:roomId", handler.DeleteRoom)
	app.Get("/rooms/:roomId/participants", handler.AdminGetRoomParticipants)
	app.Get("/admin/rooms", handler.AdminListRooms)
	app.Put("/admin/rooms/:roomId", handler.AdminUpdateRoom)
	app.Post("/admin/rooms/:roomId/close", handler.AdminCloseRoom)
	app.Get("/online-count", handler.GetOnlineCount)

	// Seed a user so room creation via repo doesn't violate FK
	db.Create(&models.User{ID: "creator-user", Email: "creator@ex.com", Name: "Creator", Provider: "local", IsActive: true, Accesses: models.StringArray{"user"}})

	return app, roomRepo, claims
}

func TestRoomHandler_ListRooms_Empty(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	req := httptest.NewRequest("GET", "/rooms", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_ListRooms_WithRooms(t *testing.T) {
	app, roomRepo, _ := setupRoomTestApp(t)

	_, _ = roomRepo.CreateRoom("creator-user", "my-room", false, "standard", models.RoomSettings{})

	req := httptest.NewRequest("GET", "/rooms", nil)
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var rooms []map[string]interface{}
	_ = json.Unmarshal(body, &rooms)
	if len(rooms) != 1 {
		t.Fatalf("expected 1 room, got %d", len(rooms))
	}
}

func TestRoomHandler_GuestJoinRoom_NotFound(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	body, _ := json.Marshal(map[string]string{
		"roomName":  "nonexistent-room",
		"guestName": "Guest Bob",
	})
	req := httptest.NewRequest("POST", "/rooms/guest-join", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 404 {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_GuestJoinRoom_EmptyName(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	body, _ := json.Marshal(map[string]string{
		"roomName":  "some-room",
		"guestName": "   ", // whitespace only
	})
	req := httptest.NewRequest("POST", "/rooms/guest-join", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_DeleteRoom_NotFound(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	req := httptest.NewRequest("DELETE", "/rooms/nonexistent-room-id", nil)
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 404 {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_DeleteRoom_Forbidden(t *testing.T) {
	_, roomRepo, _ := setupRoomTestApp(t)

	// Creator is "creator-user", but set claims to a different user
	room, _ := roomRepo.CreateRoom("creator-user", "owner-room", false, "standard", models.RoomSettings{})

	// Swap claims to a different non-superadmin user
	otherClaims := &auth.Claims{UserID: "other-user", Email: "other@ex.com", Accesses: []string{"user"}}
	app2 := fiber.New()
	rr := roomRepo
	lkCfg := config.LiveKitConfig{Host: "http://localhost:9999", APIKey: "k", APISecret: "s"}
	h := NewRoomHandler(lkCfg, config.ChatConfig{}, rr)
	app2.Use(func(c *fiber.Ctx) error { c.Locals("user", otherClaims); return c.Next() })
	app2.Delete("/rooms/:roomId", h.DeleteRoom)

	req := httptest.NewRequest("DELETE", "/rooms/"+room.ID, nil)
	resp, _ := app2.Test(req, -1)
	if resp.StatusCode != 403 {
		t.Fatalf("expected 403, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminListRooms_Empty(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	req := httptest.NewRequest("GET", "/admin/rooms", nil)
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(body, &result)
	if result["rooms"] == nil {
		t.Fatal("expected 'rooms' key in response")
	}
}

func TestRoomHandler_AdminListRooms_WithRooms(t *testing.T) {
	app, roomRepo, _ := setupRoomTestApp(t)

	_, _ = roomRepo.CreateRoom("creator-user", "admin-room-1", true, "standard", models.RoomSettings{})

	req := httptest.NewRequest("GET", "/admin/rooms", nil)
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminUpdateRoom_NotFound(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	body, _ := json.Marshal(map[string]int{"maxParticipants": 50})
	req := httptest.NewRequest("PUT", "/admin/rooms/nonexistent", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 404 {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminUpdateRoom_InvalidBody(t *testing.T) {
	app, roomRepo, _ := setupRoomTestApp(t)

	room, _ := roomRepo.CreateRoom("creator-user", "upd-room", false, "standard", models.RoomSettings{})

	req := httptest.NewRequest("PUT", "/admin/rooms/"+room.ID, bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminUpdateRoom_Success(t *testing.T) {
	app, roomRepo, _ := setupRoomTestApp(t)

	room, _ := roomRepo.CreateRoom("creator-user", "update-me", false, "standard", models.RoomSettings{})

	maxP := 75
	body, _ := json.Marshal(map[string]int{"maxParticipants": maxP})
	req := httptest.NewRequest("PUT", "/admin/rooms/"+room.ID, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminCloseRoom_NotFound(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	req := httptest.NewRequest("POST", "/admin/rooms/nonexistent/close", nil)
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 404 {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_GetOnlineCount(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	req := httptest.NewRequest("GET", "/online-count", nil)
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(body, &result)
	if result["count"] == nil {
		t.Fatal("expected 'count' in response")
	}
}

func TestRoomHandler_AdminGetRoomParticipants_NotFound(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	req := httptest.NewRequest("GET", "/rooms/nonexistent/participants", nil)
	resp, _ := app.Test(req, -1)
	if resp.StatusCode != 404 {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminGetRoomParticipants_LiveKitUnavailable(t *testing.T) {
	app, roomRepo, _ := setupRoomTestApp(t)

	room, _ := roomRepo.CreateRoom("creator-user", "part-room", false, "standard", models.RoomSettings{})

	req := httptest.NewRequest("GET", "/rooms/"+room.ID+"/participants", nil)
	resp, _ := app.Test(req, -1)
	// LiveKit is unavailable → returns empty participants list with 200
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

// setupJoinTestApp creates a minimal Fiber app with JoinRoom and GuestJoinRoom wired
// and the authenticated user set to the given claims.
func setupJoinTestApp(t *testing.T, claims *auth.Claims) (*fiber.App, *repository.RoomRepository) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	roomRepo := repository.NewRoomRepository(db)

	lkCfg := config.LiveKitConfig{
		Host:      "http://localhost:9999",
		APIKey:    "test-key",
		APISecret: "test-secret",
	}
	handler := NewRoomHandler(lkCfg, config.ChatConfig{}, roomRepo)

	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user", claims)
		return c.Next()
	})
	app.Post("/rooms/join", handler.JoinRoom)
	app.Post("/rooms/guest-join", handler.GuestJoinRoom)

	// Seed the user record to satisfy FK constraints
	db.Create(&models.User{
		ID: claims.UserID, Email: claims.Email, Name: claims.Name,
		Provider: "local", IsActive: true, Accesses: models.StringArray{"user"},
	})

	return app, roomRepo
}

func TestJoinRoom_BannedUserRejected(t *testing.T) {
	bannedClaims := &auth.Claims{
		UserID:   "banned-user",
		Email:    "banned@ex.com",
		Name:     "Banned",
		Accesses: []string{"user"},
	}
	app, roomRepo := setupJoinTestApp(t, bannedClaims)

	// Create a room (seeded as a different creator so FK passes)
	room, err := roomRepo.CreateRoom("banned-user", "ban-test-room", true, "standard", models.RoomSettings{})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}

	// Ban the user by marking their participant record
	if err := roomRepo.KickParticipant(room.ID, "banned-user"); err != nil {
		t.Fatalf("failed to ban user: %v", err)
	}

	body, _ := json.Marshal(map[string]string{"roomName": "ban-test-room"})
	req := httptest.NewRequest("POST", "/rooms/join", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)

	if resp.StatusCode != 403 {
		t.Fatalf("expected 403 for banned user, got %d", resp.StatusCode)
	}
}

func TestJoinRoom_NotBannedAllowed(t *testing.T) {
	claims := &auth.Claims{
		UserID:   "normal-user",
		Email:    "normal@ex.com",
		Name:     "Normal",
		Accesses: []string{"user"},
	}
	app, roomRepo := setupJoinTestApp(t, claims)

	_, err := roomRepo.CreateRoom("normal-user", "open-room", true, "standard", models.RoomSettings{})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}

	body, _ := json.Marshal(map[string]string{"roomName": "open-room"})
	req := httptest.NewRequest("POST", "/rooms/join", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)

	// LiveKit token generation still works (no live server needed for signing)
	// so this should succeed with 200
	if resp.StatusCode != 200 {
		t.Fatalf("expected 200 for non-banned user, got %d", resp.StatusCode)
	}
}

func TestGuestJoinRoom_PrivateRoomBlocked(t *testing.T) {
	claims := &auth.Claims{
		UserID:   "room-creator",
		Email:    "creator@ex.com",
		Name:     "Creator",
		Accesses: []string{"user"},
	}
	app, roomRepo := setupJoinTestApp(t, claims)

	_, err := roomRepo.CreateRoom("room-creator", "private-room", false /* not public */, "standard", models.RoomSettings{})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}

	body, _ := json.Marshal(map[string]string{"roomName": "private-room", "guestName": "Visitor"})
	req := httptest.NewRequest("POST", "/rooms/guest-join", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)

	if resp.StatusCode != 403 {
		t.Fatalf("expected 403 for guest joining private room, got %d", resp.StatusCode)
	}
}
