package models

import (
	"strings"
	"testing"
)

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

// ====== ValidateRoomName ======

func TestValidateRoomName_ValidNames(t *testing.T) {
	validNames := []string{
		"abc",                   // minimum length
		"my-room",               // simple hyphenated
		"team-standup",          // typical room name
		"abc-defg-hij",          // xxx-xxxx-xxx format
		"room123",               // letters and digits
		"a1b-c2d",               // mixed alphanumeric with hyphens
		"meeting-2026",          // year suffix
		strings.Repeat("a", 63), // maximum length
	}
	for _, name := range validNames {
		if err := ValidateRoomName(name); err != nil {
			t.Errorf("expected name '%s' to be valid, got error: %v", name, err)
		}
	}
}

func TestValidateRoomName_SpecialCharacters(t *testing.T) {
	invalidNames := []string{
		"room#1",      // hash
		"room@name",   // at sign
		"room name",   // space
		"room.name",   // dot
		"room_name",   // underscore
		"room!",       // exclamation
		"room?name",   // question mark
		"room/name",   // forward slash (path traversal)
		"room\\name",  // backslash
		"room<name>",  // angle brackets (XSS)
		"room&name",   // ampersand
		"room%20name", // percent encoding
		"room+name",   // plus
		"room=name",   // equals
		"room;name",   // semicolon
		"room:name",   // colon
		"room'name",   // single quote (SQL injection)
		"room\"name",  // double quote
	}
	for _, name := range invalidNames {
		err := ValidateRoomName(name)
		if err == nil {
			t.Errorf("expected name '%s' to be INVALID (contains special characters)", name)
		}
		if err != nil && err != ErrRoomNameInvalid {
			// It's okay if it's caught by length check too, but special chars should be caught
			t.Logf("name '%s' rejected with: %v", name, err)
		}
	}
}

func TestValidateRoomName_TooShort(t *testing.T) {
	shortNames := []string{"", "a", "ab"}
	for _, name := range shortNames {
		err := ValidateRoomName(name)
		if err != ErrRoomNameTooShort {
			t.Errorf("expected ErrRoomNameTooShort for '%s', got: %v", name, err)
		}
	}
}

func TestValidateRoomName_TooLong(t *testing.T) {
	longName := strings.Repeat("a", 64)
	err := ValidateRoomName(longName)
	if err != ErrRoomNameTooLong {
		t.Errorf("expected ErrRoomNameTooLong, got: %v", err)
	}
}

func TestValidateRoomName_LeadingTrailingHyphens(t *testing.T) {
	names := []string{"-room", "room-", "-room-", "--room"}
	for _, name := range names {
		err := ValidateRoomName(name)
		if err == nil {
			t.Errorf("expected name '%s' to be invalid (leading/trailing hyphens)", name)
		}
	}
}

func TestValidateRoomName_ConsecutiveHyphens(t *testing.T) {
	err := ValidateRoomName("room--name")
	if err == nil {
		t.Error("expected name 'room--name' to be invalid (consecutive hyphens)")
	}
}

func TestValidateRoomName_UppercaseRejected(t *testing.T) {
	names := []string{"MyRoom", "ROOM", "Room-Name"}
	for _, name := range names {
		err := ValidateRoomName(name)
		if err == nil {
			t.Errorf("expected name '%s' to be invalid (uppercase not allowed)", name)
		}
	}
}

// ====== GenerateRandomRoomName ======

func TestGenerateRandomRoomName_Format(t *testing.T) {
	name, err := GenerateRandomRoomName()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should match xxx-xxxx-xxx format (12 chars total)
	if len(name) != 12 {
		t.Fatalf("expected length 12, got %d for name '%s'", len(name), name)
	}

	parts := strings.Split(name, "-")
	if len(parts) != 3 {
		t.Fatalf("expected 3 parts, got %d for name '%s'", len(parts), name)
	}
	if len(parts[0]) != 3 || len(parts[1]) != 4 || len(parts[2]) != 3 {
		t.Fatalf("expected 3-4-3 part lengths, got %d-%d-%d for name '%s'",
			len(parts[0]), len(parts[1]), len(parts[2]), name)
	}
}

func TestGenerateRandomRoomName_PassesValidation(t *testing.T) {
	for i := 0; i < 100; i++ {
		name, err := GenerateRandomRoomName()
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if err := ValidateRoomName(name); err != nil {
			t.Fatalf("generated name '%s' failed validation: %v", name, err)
		}
	}
}

func TestGenerateRandomRoomName_Uniqueness(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 50; i++ {
		name, err := GenerateRandomRoomName()
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if seen[name] {
			t.Fatalf("duplicate name generated: '%s'", name)
		}
		seen[name] = true
	}
}
