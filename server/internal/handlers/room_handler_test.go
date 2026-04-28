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
	"net/http"
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
	handler := NewRoomHandler(&lkCfg, &config.ChatConfig{}, roomRepo)

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

	req := httptest.NewRequest(http.MethodGet, "/rooms", http.NoBody)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_ListRooms_WithRooms(t *testing.T) {
	app, roomRepo, _ := setupRoomTestApp(t)

	_, _ = roomRepo.CreateRoom("creator-user", "my-room", false, "standard", &models.RoomSettings{})

	req := httptest.NewRequest(http.MethodGet, "/rooms", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
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
	req := httptest.NewRequest(http.MethodPost, "/rooms/guest-join", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_GuestJoinRoom_EmptyName(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	body, _ := json.Marshal(map[string]string{
		"roomName":  "some-room",
		"guestName": "   ", // whitespace only
	})
	req := httptest.NewRequest(http.MethodPost, "/rooms/guest-join", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_DeleteRoom_NotFound(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	req := httptest.NewRequest(http.MethodDelete, "/rooms/nonexistent-room-id", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_DeleteRoom_Forbidden(t *testing.T) {
	_, roomRepo, _ := setupRoomTestApp(t)

	// Creator is "creator-user", but set claims to a different user
	room, _ := roomRepo.CreateRoom("creator-user", "owner-room", false, "standard", &models.RoomSettings{})

	// Swap claims to a different non-superadmin user
	otherClaims := &auth.Claims{UserID: "other-user", Email: "other@ex.com", Accesses: []string{"user"}}
	app2 := fiber.New()
	rr := roomRepo
	lkCfg := config.LiveKitConfig{Host: "http://localhost:9999", APIKey: "k", APISecret: "s"}
	handler := NewRoomHandler(&lkCfg, &config.ChatConfig{}, rr)
	app2.Use(func(c *fiber.Ctx) error { c.Locals("user", otherClaims); return c.Next() })
	app2.Delete("/rooms/:roomId", handler.DeleteRoom)

	req := httptest.NewRequest(http.MethodDelete, "/rooms/"+room.ID, http.NoBody)
	resp, _ := app2.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminListRooms_Empty(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	req := httptest.NewRequest(http.MethodGet, "/admin/rooms", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
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

	_, _ = roomRepo.CreateRoom("creator-user", "admin-room-1", true, "standard", &models.RoomSettings{})

	req := httptest.NewRequest(http.MethodGet, "/admin/rooms", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminUpdateRoom_NotFound(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	body, _ := json.Marshal(map[string]int{"maxParticipants": 50})
	req := httptest.NewRequest(http.MethodPut, "/admin/rooms/nonexistent", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminUpdateRoom_InvalidBody(t *testing.T) {
	app, roomRepo, _ := setupRoomTestApp(t)

	room, _ := roomRepo.CreateRoom("creator-user", "upd-room", false, "standard", &models.RoomSettings{})

	req := httptest.NewRequest(http.MethodPut, "/admin/rooms/"+room.ID, bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminUpdateRoom_Success(t *testing.T) {
	app, roomRepo, _ := setupRoomTestApp(t)

	room, _ := roomRepo.CreateRoom("creator-user", "update-me", false, "standard", &models.RoomSettings{})

	maxP := 75
	body, _ := json.Marshal(map[string]int{"maxParticipants": maxP})
	req := httptest.NewRequest(http.MethodPut, "/admin/rooms/"+room.ID, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminCloseRoom_NotFound(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	req := httptest.NewRequest(http.MethodPost, "/admin/rooms/nonexistent/close", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_GetOnlineCount(t *testing.T) {
	app, _, _ := setupRoomTestApp(t)

	req := httptest.NewRequest(http.MethodGet, "/online-count", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
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

	req := httptest.NewRequest(http.MethodGet, "/rooms/nonexistent/participants", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", resp.StatusCode)
	}
}

func TestRoomHandler_AdminGetRoomParticipants_LiveKitUnavailable(t *testing.T) {
	app, roomRepo, _ := setupRoomTestApp(t)

	room, _ := roomRepo.CreateRoom("creator-user", "part-room", false, "standard", &models.RoomSettings{})

	req := httptest.NewRequest(http.MethodGet, "/rooms/"+room.ID+"/participants", http.NoBody)
	resp, _ := app.Test(req, -1)
	defer resp.Body.Close()
	// LiveKit is unavailable → returns empty participants list with 200
	if resp.StatusCode != http.StatusOK {
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
	handler := NewRoomHandler(&lkCfg, &config.ChatConfig{}, roomRepo)

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
	room, err := roomRepo.CreateRoom("banned-user", "ban-test-room", true, "standard", &models.RoomSettings{})
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

	_, err := roomRepo.CreateRoom("normal-user", "open-room", true, "standard", &models.RoomSettings{})
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

// setupModTestApp builds a Fiber app with moderation endpoints wired and
// an adjustable-claims middleware, returning the app, roomRepo, and a pointer
// that callers can swap to change who is "logged in".
func setupModTestApp(t *testing.T, claims *auth.Claims) (*fiber.App, *repository.RoomRepository) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	roomRepo := repository.NewRoomRepository(db)

	lkCfg := config.LiveKitConfig{
		Host:      "http://localhost:9999",
		APIKey:    "test-key",
		APISecret: "test-secret",
	}
	handler := NewRoomHandler(&lkCfg, &config.ChatConfig{}, roomRepo)

	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user", claims)
		return c.Next()
	})
	// Wire the endpoints that use the "moderator" check
	app.Post("/rooms/:roomId/participants/:identity/block-chat", handler.BlockChat)
	app.Post("/rooms/:roomId/participants/:identity/deafen", handler.DeafenParticipant)
	app.Post("/rooms/:roomId/participants/:identity/spotlight", handler.SpotlightParticipant)

	// Seed user records to satisfy FK constraints
	db.Create(&models.User{ID: "owner-user", Email: "owner@ex.com", Name: "Owner", Provider: "local", IsActive: true, Accesses: models.StringArray{"user"}})
	db.Create(&models.User{ID: "mod-user", Email: "mod@ex.com", Name: "Mod", Provider: "local", IsActive: true, Accesses: models.StringArray{"user"}})
	db.Create(&models.User{ID: "other-user", Email: "other@ex.com", Name: "Other", Provider: "local", IsActive: true, Accesses: models.StringArray{"user"}})

	return app, roomRepo
}

// TestModeratorCannotActInOtherRoom verifies that a JWT "moderator" claim does NOT
// grant moderation rights in a room where the user has not been promoted.
// Before the fix this returns 200 (wrong); after the fix it must return 403.
func TestModeratorCannotActInOtherRoom(t *testing.T) {
	// modUserClaims has the "moderator" JWT claim but is NOT the room owner
	// and has NOT been promoted in roomB via the DB.
	modClaims := &auth.Claims{
		UserID:   "mod-user",
		Email:    "mod@ex.com",
		Name:     "Mod",
		Accesses: []string{"user", "moderator"}, // global JWT claim
	}
	app, roomRepo := setupModTestApp(t, modClaims)

	// Create roomB owned by "owner-user".
	roomB, err := roomRepo.CreateRoom("owner-user", "room-b", true, "standard", &models.RoomSettings{})
	if err != nil {
		t.Fatalf("failed to create roomB: %v", err)
	}

	// mod-user tries to spotlight a participant in roomB (a room they don't own
	// and haven't been promoted in).
	req := httptest.NewRequest("POST", "/rooms/"+roomB.ID+"/participants/some-victim/spotlight", nil)
	resp, _ := app.Test(req, -1)

	// After the fix: must be 403. Before the fix: would be non-403 (LiveKit call
	// fails with 500 because the server is fake, but the auth check passes first).
	if resp.StatusCode != 403 {
		t.Fatalf("expected 403 (mod in other room), got %d — global moderator claim must not grant cross-room access", resp.StatusCode)
	}
}

// TestRoomModeratorCanActInOwnRoom verifies that a user promoted via the DB
// (is_moderator=true in room_participants) CAN moderate their assigned room.
func TestRoomModeratorCanActInOwnRoom(t *testing.T) {
	modClaims := &auth.Claims{
		UserID:   "mod-user",
		Email:    "mod@ex.com",
		Name:     "Mod",
		Accesses: []string{"user"}, // no global moderator JWT claim
	}
	app, roomRepo := setupModTestApp(t, modClaims)

	// Create roomA owned by "owner-user".
	roomA, err := roomRepo.CreateRoom("owner-user", "room-a", true, "standard", &models.RoomSettings{})
	if err != nil {
		t.Fatalf("failed to create roomA: %v", err)
	}

	// Add mod-user as a participant and promote them.
	if err := roomRepo.AddParticipant(roomA.ID, "mod-user"); err != nil {
		t.Fatalf("failed to add participant: %v", err)
	}
	if err := roomRepo.SetRoomModerator(roomA.ID, "mod-user", true); err != nil {
		t.Fatalf("failed to promote moderator: %v", err)
	}

	// mod-user tries to spotlight someone in roomA — should pass the auth gate.
	// The LiveKit call will fail (fake server), but we'll see 500 NOT 403.
	req := httptest.NewRequest("POST", "/rooms/"+roomA.ID+"/participants/some-user/spotlight", nil)
	resp, _ := app.Test(req, -1)

	// Auth passes → LiveKit call is attempted → fake server → 500 (not 403)
	if resp.StatusCode == 403 {
		t.Fatalf("room-scoped moderator should be allowed to act in their room, got 403")
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

	_, err := roomRepo.CreateRoom("room-creator", "private-room", false /* not public */, "standard", &models.RoomSettings{})
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
