package scheduler

import (
	"bedrud/config"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"bedrud/internal/testutil"
	"testing"
	"time"
)

func TestInitialize_DoesNotPanic(t *testing.T) {
	// Initialize should not panic with nil deps
	Initialize(nil, config.LiveKitConfig{})
	// Stop should not panic either
	Stop()
}

func TestStop_BeforeInitialize(t *testing.T) {
	// Should not panic if called before Initialize
	Stop()
}

func TestCheckIdleRooms_NilRepo(t *testing.T) {
	// Should return early without panic
	checkIdleRooms(nil, config.LiveKitConfig{})
}

func TestCheckIdleRooms_EmptyRooms(t *testing.T) {
	db := testutil.SetupTestDB(t)
	roomRepo := repository.NewRoomRepository(db)

	// No rooms in DB → should return without panic
	checkIdleRooms(roomRepo, config.LiveKitConfig{})
}

func TestCheckIdleRooms_RoomsWithinGracePeriod(t *testing.T) {
	db := testutil.SetupTestDB(t)
	roomRepo := repository.NewRoomRepository(db)

	// Create a room that is brand new (within 5-minute grace period)
	room := &models.Room{
		ID:        "grace-room-1",
		Name:      "grace-room",
		CreatedBy: "user-1",
		IsActive:  true,
		CreatedAt: time.Now(), // just now → within grace
	}
	db.Create(room)

	// Should NOT call LiveKit nor mark idle; exits early due to grace period
	checkIdleRooms(roomRepo, config.LiveKitConfig{Host: "http://localhost:9999"})

	// Room should still be active
	updated, _ := roomRepo.GetRoom("grace-room-1")
	if updated != nil && !updated.IsActive {
		t.Fatal("room within grace period should not be marked idle")
	}
}

func TestCheckIdleRooms_OldRoomLiveKitUnavailable(t *testing.T) {
	db := testutil.SetupTestDB(t)
	roomRepo := repository.NewRoomRepository(db)

	// Create a room older than 5 minutes
	room := &models.Room{
		ID:        "old-room-1",
		Name:      "old-room",
		CreatedBy: "user-1",
		IsActive:  true,
		CreatedAt: time.Now().Add(-10 * time.Minute),
	}
	db.Create(room)

	// LiveKit is unreachable — checkIdleRooms should handle this gracefully
	checkIdleRooms(roomRepo, config.LiveKitConfig{
		Host: "http://localhost:9999", // nothing listening here
	})

	// Room stays active since LiveKit reported an error
	updated, _ := roomRepo.GetRoom("old-room-1")
	if updated != nil && !updated.IsActive {
		t.Fatal("room should stay active when LiveKit call fails")
	}
}
