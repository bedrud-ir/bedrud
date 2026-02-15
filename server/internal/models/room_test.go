package models

import "testing"

func TestRoom_TableName(t *testing.T) {
	r := Room{}
	if r.TableName() != "rooms" {
		t.Fatalf("expected 'rooms', got '%s'", r.TableName())
	}
}

func TestRoomParticipant_TableName(t *testing.T) {
	rp := RoomParticipant{}
	if rp.TableName() != "room_participants" {
		t.Fatalf("expected 'room_participants', got '%s'", rp.TableName())
	}
}

func TestRoomPermissions_TableName(t *testing.T) {
	rp := RoomPermissions{}
	if rp.TableName() != "room_permissions" {
		t.Fatalf("expected 'room_permissions', got '%s'", rp.TableName())
	}
}

func TestRoom_DefaultValues(t *testing.T) {
	r := Room{}
	// When created without explicit values, Go zero values apply
	if r.IsActive {
		t.Fatal("expected IsActive default to be false (Go zero value)")
	}
	if r.IsPublic {
		t.Fatal("expected IsPublic default to be false")
	}
	if r.MaxParticipants != 0 {
		t.Fatal("expected MaxParticipants Go zero value to be 0")
	}
}

func TestRoomSettings_Defaults(t *testing.T) {
	s := RoomSettings{}
	if s.AllowChat || s.AllowVideo || s.AllowAudio || s.RequireApproval || s.E2EE {
		t.Fatal("expected all RoomSettings Go defaults to be false")
	}
}

func TestRoomParticipant_DefaultStates(t *testing.T) {
	rp := RoomParticipant{}
	if rp.IsActive || rp.IsApproved || rp.IsMuted || rp.IsVideoOff || rp.IsChatBlocked || rp.IsBanned || rp.IsOnStage {
		t.Fatal("expected all RoomParticipant boolean defaults to be false")
	}
	if rp.LeftAt != nil {
		t.Fatal("expected LeftAt to be nil")
	}
}

func TestRoomPermissions_DefaultFlags(t *testing.T) {
	rp := RoomPermissions{}
	if rp.IsAdmin || rp.CanKick || rp.CanMuteAudio || rp.CanDisableVideo {
		t.Fatal("expected all permission flags to be false by default")
	}
	// CanChat is not explicitly true in Go zero value
	if rp.CanChat {
		t.Fatal("expected CanChat Go zero value to be false")
	}
}
