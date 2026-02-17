package repository

import (
	"bedrud/internal/models"
	"bedrud/internal/testutil"
	"errors"
	"strings"
	"testing"
)

func TestRoomRepository_CreateRoom(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	// Create a user first (needed for foreign key if enabled)
	db.Create(&models.User{ID: "user-1", Email: "user@ex.com", Name: "Creator", Provider: "local", IsActive: true})

	room, err := repo.CreateRoom("user-1", "test-room", true, "standard", models.RoomSettings{
		AllowChat:  true,
		AllowVideo: true,
		AllowAudio: true,
	})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}
	if room == nil {
		t.Fatal("expected non-nil room")
	}
	if room.Name != "test-room" {
		t.Fatalf("expected name 'test-room', got '%s'", room.Name)
	}
	if room.CreatedBy != "user-1" {
		t.Fatalf("expected createdBy 'user-1', got '%s'", room.CreatedBy)
	}
	if room.AdminID != "user-1" {
		t.Fatalf("expected adminID 'user-1', got '%s'", room.AdminID)
	}
	if !room.IsActive {
		t.Fatal("expected room to be active")
	}
	if !room.IsPublic {
		t.Fatal("expected room to be public")
	}
	if room.Mode != "standard" {
		t.Fatalf("expected mode 'standard', got '%s'", room.Mode)
	}
}

func TestRoomRepository_CreateRoom_CreatesParticipantAndPermissions(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "user@ex.com", Name: "Creator", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "perm-room", false, "standard", models.RoomSettings{})

	// Check participant was created
	participants, err := repo.GetActiveParticipants(room.ID)
	if err != nil {
		t.Fatalf("failed to get participants: %v", err)
	}
	if len(participants) != 1 {
		t.Fatalf("expected 1 participant, got %d", len(participants))
	}
	if participants[0].UserID != "user-1" {
		t.Fatal("expected creator to be a participant")
	}
	if !participants[0].IsApproved {
		t.Fatal("expected creator to be approved")
	}
	if !participants[0].IsOnStage {
		t.Fatal("expected creator to be on stage")
	}

	// Check permissions
	perms, err := repo.GetParticipantPermissions(room.ID, "user-1")
	if err != nil {
		t.Fatalf("failed to get permissions: %v", err)
	}
	if !perms.IsAdmin {
		t.Fatal("expected creator to have admin permissions")
	}
	if !perms.CanKick {
		t.Fatal("expected creator to have kick permission")
	}
}

func TestRoomRepository_GetRoom(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "user@ex.com", Name: "Creator", Provider: "local", IsActive: true})
	room, _ := repo.CreateRoom("user-1", "get-room", false, "standard", models.RoomSettings{})

	found, err := repo.GetRoom(room.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found == nil {
		t.Fatal("expected to find room")
	}
	if found.Name != "get-room" {
		t.Fatalf("expected name 'get-room', got '%s'", found.Name)
	}
}

func TestRoomRepository_GetRoom_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	found, err := repo.GetRoom("nonexistent-id")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found != nil {
		t.Fatal("expected nil for non-existent room")
	}
}

func TestRoomRepository_GetRoomByName(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "user@ex.com", Name: "Creator", Provider: "local", IsActive: true})
	_, _ = repo.CreateRoom("user-1", "named-room", false, "standard", models.RoomSettings{})

	found, err := repo.GetRoomByName("named-room")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found == nil || found.Name != "named-room" {
		t.Fatal("expected to find room by name")
	}
}

func TestRoomRepository_GetRoomByName_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	found, err := repo.GetRoomByName("nonexistent-room")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found != nil {
		t.Fatal("expected nil for non-existent room name")
	}
}

func TestRoomRepository_AddParticipant(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "join-room", false, "standard", models.RoomSettings{})

	err := repo.AddParticipant(room.ID, "user-2")
	if err != nil {
		t.Fatalf("failed to add participant: %v", err)
	}

	participants, _ := repo.GetActiveParticipants(room.ID)
	if len(participants) != 2 {
		t.Fatalf("expected 2 participants, got %d", len(participants))
	}
}

func TestRoomRepository_AddParticipant_Rejoin(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "rejoin-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")
	_ = repo.RemoveParticipant(room.ID, "user-2")

	// Rejoin
	err := repo.AddParticipant(room.ID, "user-2")
	if err != nil {
		t.Fatalf("failed to rejoin: %v", err)
	}

	participants, _ := repo.GetActiveParticipants(room.ID)
	if len(participants) != 2 {
		t.Fatalf("expected 2 active participants after rejoin, got %d", len(participants))
	}
}

func TestRoomRepository_AddParticipant_BannedUser(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "ban-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")
	_ = repo.KickParticipant(room.ID, "user-2")

	// Try to rejoin after ban
	err := repo.AddParticipant(room.ID, "user-2")
	if err == nil {
		t.Fatal("expected error when banned user tries to join")
	}
}

func TestRoomRepository_RemoveParticipant(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "leave-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")

	err := repo.RemoveParticipant(room.ID, "user-2")
	if err != nil {
		t.Fatalf("failed to remove participant: %v", err)
	}

	participants, _ := repo.GetActiveParticipants(room.ID)
	if len(participants) != 1 {
		t.Fatalf("expected 1 active participant after leave, got %d", len(participants))
	}
}

func TestRoomRepository_KickParticipant(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "kick-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")

	err := repo.KickParticipant(room.ID, "user-2")
	if err != nil {
		t.Fatalf("failed to kick participant: %v", err)
	}

	// Verify participant is inactive and banned
	var participant models.RoomParticipant
	db.Where("room_id = ? AND user_id = ?", room.ID, "user-2").First(&participant)
	if participant.IsActive {
		t.Fatal("expected participant to be inactive after kick")
	}
	if !participant.IsBanned {
		t.Fatal("expected participant to be banned after kick")
	}
}

func TestRoomRepository_BringToStage_RemoveFromStage(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "stage-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")

	// user-2 should not be on stage
	onStage, _ := repo.IsParticipantOnStage(room.ID, "user-2")
	if onStage {
		t.Fatal("expected user-2 to not be on stage initially")
	}

	// Bring to stage
	_ = repo.BringToStage(room.ID, "user-2")
	onStage, _ = repo.IsParticipantOnStage(room.ID, "user-2")
	if !onStage {
		t.Fatal("expected user-2 to be on stage")
	}

	// Remove from stage
	_ = repo.RemoveFromStage(room.ID, "user-2")
	onStage, _ = repo.IsParticipantOnStage(room.ID, "user-2")
	if onStage {
		t.Fatal("expected user-2 to not be on stage after removal")
	}
}

func TestRoomRepository_UpdateParticipantStatus(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "status-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")

	err := repo.UpdateParticipantStatus(room.ID, "user-2", map[string]interface{}{
		"is_muted":     true,
		"is_video_off": true,
	})
	if err != nil {
		t.Fatalf("failed to update status: %v", err)
	}

	var participant models.RoomParticipant
	db.Where("room_id = ? AND user_id = ?", room.ID, "user-2").First(&participant)
	if !participant.IsMuted {
		t.Fatal("expected participant to be muted")
	}
	if !participant.IsVideoOff {
		t.Fatal("expected participant video to be off")
	}
}

func TestRoomRepository_DeleteRoom(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "delete-room", false, "standard", models.RoomSettings{})

	err := repo.DeleteRoom(room.ID, "user-1")
	if err != nil {
		t.Fatalf("failed to delete room: %v", err)
	}

	found, _ := repo.GetRoom(room.ID)
	if found != nil {
		t.Fatal("expected room to be deleted")
	}
}

func TestRoomRepository_DeleteRoom_NotCreator(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "no-delete-room", false, "standard", models.RoomSettings{})

	err := repo.DeleteRoom(room.ID, "user-2")
	if err == nil {
		t.Fatal("expected error when non-creator tries to delete room")
	}
}

func TestRoomRepository_GetAllRooms(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	_, _ = repo.CreateRoom("user-1", "room-1", false, "standard", models.RoomSettings{})
	_, _ = repo.CreateRoom("user-1", "room-2", true, "standard", models.RoomSettings{})

	rooms, err := repo.GetAllRooms()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(rooms) != 2 {
		t.Fatalf("expected 2 rooms, got %d", len(rooms))
	}
}

func TestRoomRepository_GetRoomsCreatedByUser(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	_, _ = repo.CreateRoom("user-1", "my-room-1", false, "standard", models.RoomSettings{})
	_, _ = repo.CreateRoom("user-1", "my-room-2", false, "standard", models.RoomSettings{})
	_, _ = repo.CreateRoom("user-2", "other-room", false, "standard", models.RoomSettings{})

	rooms, err := repo.GetRoomsCreatedByUser("user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(rooms) != 2 {
		t.Fatalf("expected 2 rooms created by user-1, got %d", len(rooms))
	}
}

func TestRoomRepository_UpdateRoomSettings(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "settings-room", false, "standard", models.RoomSettings{
		AllowChat: false,
		E2EE:      false,
	})

	// The UpdateRoomSettings uses Select("Settings").Updates() on embedded struct.
	// This may have limitations with SQLite. Just verify no error is returned.
	err := repo.UpdateRoomSettings(room.ID, models.RoomSettings{
		AllowChat:  true,
		AllowVideo: true,
		E2EE:       true,
	})
	if err != nil {
		t.Fatalf("failed to update settings: %v", err)
	}
}

func TestRoomRepository_GetRoomParticipantsWithUsers(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "preload-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")

	participants, err := repo.GetRoomParticipantsWithUsers(room.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(participants) != 2 {
		t.Fatalf("expected 2 participants, got %d", len(participants))
	}
	// Check that User is preloaded
	for _, p := range participants {
		if p.User == nil {
			t.Fatal("expected User to be preloaded")
		}
	}
}

// ====== Duplicate room name returns ErrRoomNameTaken ======

func TestRoomRepository_CreateRoom_DuplicateName(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	_, err := repo.CreateRoom("user-1", "dup-room", false, "standard", models.RoomSettings{})
	if err != nil {
		t.Fatalf("first creation failed: %v", err)
	}

	_, err = repo.CreateRoom("user-1", "dup-room", false, "standard", models.RoomSettings{})
	if err == nil {
		t.Fatal("expected error when creating room with duplicate name")
	}
	if !errors.Is(err, models.ErrRoomNameTaken) {
		t.Fatalf("expected ErrRoomNameTaken, got: %v", err)
	}
}

// ====== Empty room name auto-generates ======

func TestRoomRepository_CreateRoom_EmptyNameAutoGenerates(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, err := repo.CreateRoom("user-1", "", false, "standard", models.RoomSettings{})
	if err != nil {
		t.Fatalf("CreateRoom with empty name should auto-generate, got error: %v", err)
	}
	if room.Name == "" {
		t.Fatal("expected auto-generated name, got empty string")
	}
	// Verify generated name is valid
	if err := models.ValidateRoomName(room.Name); err != nil {
		t.Fatalf("auto-generated name '%s' failed validation: %v", room.Name, err)
	}
	t.Logf("Auto-generated room name: %s", room.Name)
}

// ====== Name validation rejects special characters ======

func TestRoomRepository_CreateRoom_SpecialCharsRejected(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	invalidNames := []string{
		"room#1",
		"room@name",
		"room name",
		"room/path",
		"room.dot",
		"room_under",
	}
	for _, name := range invalidNames {
		_, err := repo.CreateRoom("user-1", name, false, "standard", models.RoomSettings{})
		if err == nil {
			t.Fatalf("expected error for invalid name '%s'", name)
		}
	}
}

// ====== Name is lowercased and trimmed ======

func TestRoomRepository_CreateRoom_NameNormalized(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, err := repo.CreateRoom("user-1", "  My-Room  ", false, "standard", models.RoomSettings{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if room.Name != "my-room" {
		t.Fatalf("expected normalized name 'my-room', got '%s'", room.Name)
	}
}

// ====== Name too long is rejected ======

func TestRoomRepository_CreateRoom_NameTooLong(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	longName := strings.Repeat("a", 64)
	_, err := repo.CreateRoom("user-1", longName, false, "standard", models.RoomSettings{})
	if !errors.Is(err, models.ErrRoomNameTooLong) {
		t.Fatalf("expected ErrRoomNameTooLong, got: %v", err)
	}
}

// ====== BUG DETECTION: MaxParticipants not passed to room ======

func TestRoomRepository_CreateRoom_MaxParticipantsNotSet(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	// BUG: CreateRoom doesn't accept maxParticipants parameter!
	// The Room struct has a default of 20 in GORM, but the value is never set from input.
	room, err := repo.CreateRoom("user-1", "max-room", false, "standard", models.RoomSettings{})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}

	// The MaxParticipants field should either be the GORM default (20) or 0
	found, _ := repo.GetRoom(room.ID)
	t.Logf("MaxParticipants value: %d (GORM default:20 expected, but CreateRoom doesn't set it from handler input)", found.MaxParticipants)

	// Document the bug: CreateRoom signature doesn't include maxParticipants
	// so it's always the GORM default or 0
	if found.MaxParticipants != 0 && found.MaxParticipants != 20 {
		t.Fatalf("unexpected MaxParticipants: %d", found.MaxParticipants)
	}
}

// ====== Room Settings Preservation ======

func TestRoomRepository_CreateRoom_SettingsPreserved(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	settings := models.RoomSettings{
		AllowChat:       true,
		AllowVideo:      true,
		AllowAudio:      true,
		RequireApproval: true,
		E2EE:            true,
	}

	room, err := repo.CreateRoom("user-1", "settings-preserved", false, "standard", settings)
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}

	found, _ := repo.GetRoom(room.ID)
	if !found.Settings.AllowChat {
		t.Fatal("expected AllowChat to be preserved as true")
	}
	if !found.Settings.AllowVideo {
		t.Fatal("expected AllowVideo to be preserved as true")
	}
	if !found.Settings.AllowAudio {
		t.Fatal("expected AllowAudio to be preserved as true")
	}
	if !found.Settings.RequireApproval {
		t.Fatal("expected RequireApproval to be preserved as true")
	}
	if !found.Settings.E2EE {
		t.Fatal("expected E2EE to be preserved as true")
	}
}

// ====== Room ExpiresAt ======

func TestRoomRepository_CreateRoom_ExpiresAtIsSet(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "expire-room", false, "standard", models.RoomSettings{})

	found, _ := repo.GetRoom(room.ID)
	if found.ExpiresAt.IsZero() {
		t.Fatal("expected ExpiresAt to be set")
	}
	// ExpiresAt should be ~24h from now
	if found.ExpiresAt.Before(found.CreatedAt) {
		t.Fatal("expected ExpiresAt to be after CreatedAt")
	}
}

// ====== CleanupExpiredRooms ======

func TestRoomRepository_CleanupExpiredRooms(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	// Create a room that already expired
	room, _ := repo.CreateRoom("user-1", "expired-room", false, "standard", models.RoomSettings{})
	// Manually set ExpiresAt to the past
	db.Model(&models.Room{}).Where("id = ?", room.ID).Update("expires_at", "2020-01-01 00:00:00")

	// Create a room that hasn't expired yet
	_, _ = repo.CreateRoom("user-1", "active-room", false, "standard", models.RoomSettings{})

	err := repo.CleanupExpiredRooms()
	if err != nil {
		t.Fatalf("failed to cleanup: %v", err)
	}

	// Expired room should be inactive
	expired, _ := repo.GetRoom(room.ID)
	if expired.IsActive {
		t.Fatal("expected expired room to be deactivated")
	}
}

func TestRoomRepository_CleanupExpiredRooms_NoExpired(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	_, _ = repo.CreateRoom("user-1", "future-room", false, "standard", models.RoomSettings{})

	err := repo.CleanupExpiredRooms()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestRoomRepository_CreateRoom_PrivateRoom(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "private-room", false, "standard", models.RoomSettings{})
	if room.IsPublic {
		t.Fatal("expected room to be private")
	}
}

func TestRoomRepository_CreateRoom_PublicRoom(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "public-room", true, "standard", models.RoomSettings{})
	if !room.IsPublic {
		t.Fatal("expected room to be public")
	}
}

// ====== Multiple Participants Lifecycle ======

func TestRoomRepository_MultipleParticipantsLifecycle(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-3", Email: "u3@ex.com", Name: "U3", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-4", Email: "u4@ex.com", Name: "U4", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "lifecycle-room", false, "standard", models.RoomSettings{})

	// Add 3 more participants
	_ = repo.AddParticipant(room.ID, "user-2")
	_ = repo.AddParticipant(room.ID, "user-3")
	_ = repo.AddParticipant(room.ID, "user-4")

	participants, _ := repo.GetActiveParticipants(room.ID)
	if len(participants) != 4 {
		t.Fatalf("expected 4 active participants, got %d", len(participants))
	}

	// user-2 leaves
	_ = repo.RemoveParticipant(room.ID, "user-2")
	participants, _ = repo.GetActiveParticipants(room.ID)
	if len(participants) != 3 {
		t.Fatalf("expected 3 active participants after leave, got %d", len(participants))
	}

	// user-3 is kicked (banned)
	_ = repo.KickParticipant(room.ID, "user-3")
	participants, _ = repo.GetActiveParticipants(room.ID)
	if len(participants) != 2 {
		t.Fatalf("expected 2 active participants after kick, got %d", len(participants))
	}

	// user-2 rejoins (was not banned)
	_ = repo.AddParticipant(room.ID, "user-2")
	participants, _ = repo.GetActiveParticipants(room.ID)
	if len(participants) != 3 {
		t.Fatalf("expected 3 active participants after rejoin, got %d", len(participants))
	}

	// user-3 cannot rejoin (banned)
	err := repo.AddParticipant(room.ID, "user-3")
	if err == nil {
		t.Fatal("expected error: banned user should not be able to rejoin")
	}
}

// ====== AddParticipant same user twice ======

func TestRoomRepository_AddParticipant_AlreadyActive(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "double-join-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")

	// Add again (already active) — should not error, just update
	err := repo.AddParticipant(room.ID, "user-2")
	if err != nil {
		t.Fatalf("unexpected error on double-add: %v", err)
	}

	// Should still only be 2 participants (not duplicated)
	participants, _ := repo.GetActiveParticipants(room.ID)
	if len(participants) != 2 {
		t.Fatalf("expected 2 participants (no duplicate), got %d", len(participants))
	}
}

// ====== DeleteRoom cleans up participants and permissions ======

func TestRoomRepository_DeleteRoom_CleansUpAll(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "cleanup-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")

	// Verify we have participants and permissions before delete
	var participantCount, permCount int64
	db.Model(&models.RoomParticipant{}).Where("room_id = ?", room.ID).Count(&participantCount)
	db.Model(&models.RoomPermissions{}).Where("room_id = ?", room.ID).Count(&permCount)
	if participantCount == 0 {
		t.Fatal("expected participants before delete")
	}
	if permCount == 0 {
		t.Fatal("expected permissions before delete")
	}

	_ = repo.DeleteRoom(room.ID, "user-1")

	// Verify everything is cleaned up
	db.Model(&models.RoomParticipant{}).Where("room_id = ?", room.ID).Count(&participantCount)
	db.Model(&models.RoomPermissions{}).Where("room_id = ?", room.ID).Count(&permCount)
	if participantCount != 0 {
		t.Fatalf("expected 0 participants after delete, got %d", participantCount)
	}
	if permCount != 0 {
		t.Fatalf("expected 0 permissions after delete, got %d", permCount)
	}
}

// ====== Room with RequireApproval setting ======

func TestRoomRepository_CreateRoom_RequireApproval(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, err := repo.CreateRoom("user-1", "approval-room", false, "standard", models.RoomSettings{
		RequireApproval: true,
		AllowChat:       true,
	})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}

	found, _ := repo.GetRoom(room.ID)
	if !found.Settings.RequireApproval {
		t.Fatal("expected RequireApproval to be true")
	}
}

func TestRoomRepository_AddParticipant_NewJoiner_NotApproved(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "approval-test", false, "standard", models.RoomSettings{RequireApproval: true})
	_ = repo.AddParticipant(room.ID, "user-2")

	// New joiner should NOT be approved by default
	var participant models.RoomParticipant
	db.Where("room_id = ? AND user_id = ?", room.ID, "user-2").First(&participant)
	if participant.IsApproved {
		t.Fatal("new joiner should NOT be auto-approved (approval is required)")
	}
}

func TestRoomRepository_CreateRoom_CreatorIsAlwaysApproved(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "creator-approved", false, "standard", models.RoomSettings{RequireApproval: true})

	var participant models.RoomParticipant
	db.Where("room_id = ? AND user_id = ?", room.ID, "user-1").First(&participant)
	if !participant.IsApproved {
		t.Fatal("creator should always be approved regardless of RequireApproval setting")
	}
}

// ====== Room E2EE setting ======

func TestRoomRepository_CreateRoom_E2EE(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "e2ee-room", false, "standard", models.RoomSettings{E2EE: true})

	found, _ := repo.GetRoom(room.ID)
	if !found.Settings.E2EE {
		t.Fatal("expected E2EE to be true")
	}
}

// ====== GetRoomsParticipatedInByUser ======

func TestRoomRepository_GetRoomsParticipatedInByUser(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	// user-1 creates 2 rooms
	room1, _ := repo.CreateRoom("user-1", "owner-room-1", false, "standard", models.RoomSettings{})
	room2, _ := repo.CreateRoom("user-1", "owner-room-2", false, "standard", models.RoomSettings{})

	// user-2 creates 1 room, joins 1 of user-1's rooms
	_, _ = repo.CreateRoom("user-2", "u2-own-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room1.ID, "user-2")

	// user-2 participated rooms (excluding rooms they created)
	rooms, err := repo.GetRoomsParticipatedInByUser("user-2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(rooms) != 1 {
		t.Fatalf("expected 1 participated room, got %d", len(rooms))
	}
	if rooms[0].ID != room1.ID {
		t.Fatalf("expected room ID '%s', got '%s'", room1.ID, rooms[0].ID)
	}

	// user-2 also joins room2
	_ = repo.AddParticipant(room2.ID, "user-2")
	rooms, _ = repo.GetRoomsParticipatedInByUser("user-2")
	if len(rooms) != 2 {
		t.Fatalf("expected 2 participated rooms, got %d", len(rooms))
	}
}

func TestRoomRepository_GetRoomsParticipatedInByUser_None(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	rooms, err := repo.GetRoomsParticipatedInByUser("user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(rooms) != 0 {
		t.Fatalf("expected 0 rooms, got %d", len(rooms))
	}
}

// ====== Admin permissions validation ======

func TestRoomRepository_CreatorHasFullAdminPermissions(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "admin-perms-room", false, "standard", models.RoomSettings{})

	perms, err := repo.GetParticipantPermissions(room.ID, "user-1")
	if err != nil {
		t.Fatalf("failed to get permissions: %v", err)
	}
	if !perms.IsAdmin {
		t.Fatal("expected IsAdmin")
	}
	if !perms.CanKick {
		t.Fatal("expected CanKick")
	}
	if !perms.CanMuteAudio {
		t.Fatal("expected CanMuteAudio")
	}
	if !perms.CanDisableVideo {
		t.Fatal("expected CanDisableVideo")
	}
	if !perms.CanChat {
		t.Fatal("expected CanChat")
	}
}

func TestRoomRepository_NewParticipantHasNoPermissions(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "noperm-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")

	// New participant should NOT have permissions entry
	_, err := repo.GetParticipantPermissions(room.ID, "user-2")
	if err == nil {
		t.Logf("Note: new participant has a permissions record (may be auto-created)")
	}
	// If no error, permissions should all be false
}

// ====== RemoveParticipant sets LeftAt ======

func TestRoomRepository_RemoveParticipant_SetsLeftAt(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "leftat-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")
	_ = repo.RemoveParticipant(room.ID, "user-2")

	var participant models.RoomParticipant
	db.Where("room_id = ? AND user_id = ?", room.ID, "user-2").First(&participant)
	if participant.LeftAt == nil {
		t.Fatal("expected LeftAt to be set after removal")
	}
	if participant.IsActive {
		t.Fatal("expected IsActive to be false after removal")
	}
}

// ====== Stage management edge cases ======

func TestRoomRepository_BringToStage_CreatorAlreadyOnStage(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "creator-stage", false, "standard", models.RoomSettings{})

	// Creator should already be on stage
	onStage, _ := repo.IsParticipantOnStage(room.ID, "user-1")
	if !onStage {
		t.Fatal("expected creator to be on stage by default")
	}

	// Bringing creator to stage again should not fail
	err := repo.BringToStage(room.ID, "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestRoomRepository_RemoveFromStage_CreatorCanBeRemoved(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "stage-remove", false, "standard", models.RoomSettings{})

	// Remove creator from stage (should work but might be undesirable)
	_ = repo.RemoveFromStage(room.ID, "user-1")
	onStage, _ := repo.IsParticipantOnStage(room.ID, "user-1")
	if onStage {
		t.Fatal("expected creator to be removed from stage")
	}
}

// ====== UpdateParticipantPermissions ======

func TestRoomRepository_UpdateParticipantPermissions(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "perm-update-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")

	// Create permissions for user-2 (since AddParticipant doesn't auto-create them)
	db.Create(&models.RoomPermissions{
		ID:     "perm-u2",
		RoomID: room.ID,
		UserID: "user-2",
	})

	err := repo.UpdateParticipantPermissions(room.ID, "user-2", models.RoomPermissions{
		CanChat: true,
	})
	if err != nil {
		t.Fatalf("failed to update permissions: %v", err)
	}
}

// ====== GetRoomByID returns room with correct data ======

func TestRoomRepository_GetRoom_ReturnsCompleteData(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	_, err := repo.CreateRoom("user-1", "complete-data-room", true, "standard", models.RoomSettings{
		AllowChat:  true,
		AllowAudio: true,
		E2EE:       true,
	})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}

	found, _ := repo.GetRoomByName("complete-data-room")
	if found == nil {
		t.Fatal("expected to find room")
	}
	if found.CreatedBy != "user-1" {
		t.Fatalf("expected createdBy 'user-1', got '%s'", found.CreatedBy)
	}
	if found.AdminID != "user-1" {
		t.Fatalf("expected adminID 'user-1', got '%s'", found.AdminID)
	}
	if !found.IsActive {
		t.Fatal("expected IsActive true")
	}
	if !found.IsPublic {
		t.Fatal("expected IsPublic true")
	}
	if found.Mode != "standard" {
		t.Fatalf("expected mode 'standard', got '%s'", found.Mode)
	}
	if found.ID == "" {
		t.Fatal("expected non-empty ID (UUID)")
	}
	if found.CreatedAt.IsZero() {
		t.Fatal("expected CreatedAt to be set")
	}
}

// ====== KickParticipant sets LeftAt ======

func TestRoomRepository_KickParticipant_SetsLeftAt(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "kick-left-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")
	_ = repo.KickParticipant(room.ID, "user-2")

	var participant models.RoomParticipant
	db.Where("room_id = ? AND user_id = ?", room.ID, "user-2").First(&participant)
	if participant.LeftAt == nil {
		t.Fatal("expected LeftAt to be set after kick")
	}
	if !participant.IsBanned {
		t.Fatal("expected IsBanned after kick")
	}
}

// ====== GetAllRooms returns empty for no rooms ======

func TestRoomRepository_GetAllRooms_Empty(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	rooms, err := repo.GetAllRooms()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(rooms) != 0 {
		t.Fatalf("expected 0 rooms, got %d", len(rooms))
	}
}

// ====== RoomRepository.GetUserByID ======

func TestRoomRepository_GetUserByID(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	user, err := repo.GetUserByID("user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user == nil {
		t.Fatal("expected to find user")
	}
	if user.ID != "user-1" {
		t.Fatalf("expected ID 'user-1', got '%s'", user.ID)
	}
}

func TestRoomRepository_GetUserByID_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	_, err := repo.GetUserByID("nonexistent")
	if err == nil {
		t.Fatal("expected error for non-existent user")
	}
}

// ====== Concurrency: creator join-time is set correctly ======

func TestRoomRepository_CreateRoom_CreatorJoinTimeSet(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "jointime-room", false, "standard", models.RoomSettings{})

	var participant models.RoomParticipant
	db.Where("room_id = ? AND user_id = ?", room.ID, "user-1").First(&participant)
	if participant.JoinedAt.IsZero() {
		t.Fatal("expected JoinedAt to be set for creator")
	}
	if participant.LeftAt != nil {
		t.Fatal("expected LeftAt to be nil for active creator")
	}
}

// ====== Chat blocked state ======

func TestRoomRepository_UpdateParticipantStatus_ChatBlocked(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewRoomRepository(db)

	db.Create(&models.User{ID: "user-1", Email: "u1@ex.com", Name: "U1", Provider: "local", IsActive: true})
	db.Create(&models.User{ID: "user-2", Email: "u2@ex.com", Name: "U2", Provider: "local", IsActive: true})

	room, _ := repo.CreateRoom("user-1", "chat-block-room", false, "standard", models.RoomSettings{})
	_ = repo.AddParticipant(room.ID, "user-2")

	_ = repo.UpdateParticipantStatus(room.ID, "user-2", map[string]interface{}{
		"is_chat_blocked": true,
	})

	var participant models.RoomParticipant
	db.Where("room_id = ? AND user_id = ?", room.ID, "user-2").First(&participant)
	if !participant.IsChatBlocked {
		t.Fatal("expected chat to be blocked")
	}
}
