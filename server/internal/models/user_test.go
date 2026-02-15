package models

import (
	"testing"
)

// --- StringArray Tests ---

func TestStringArray_Scan_Nil(t *testing.T) {
	var sa StringArray
	if err := sa.Scan(nil); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(sa) != 0 {
		t.Fatalf("expected empty slice, got %v", sa)
	}
}

func TestStringArray_Scan_Bytes_NonEmpty(t *testing.T) {
	var sa StringArray
	if err := sa.Scan([]byte("{admin,user}")); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sa) != 2 || sa[0] != "admin" || sa[1] != "user" {
		t.Fatalf("expected [admin user], got %v", sa)
	}
}

func TestStringArray_Scan_Bytes_Empty(t *testing.T) {
	var sa StringArray
	if err := sa.Scan([]byte("{}")); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sa) != 0 {
		t.Fatalf("expected empty slice, got %v", sa)
	}
}

func TestStringArray_Scan_String_NonEmpty(t *testing.T) {
	var sa StringArray
	if err := sa.Scan("{admin,user,moderator}"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sa) != 3 {
		t.Fatalf("expected 3 elements, got %d", len(sa))
	}
	if sa[0] != "admin" || sa[1] != "user" || sa[2] != "moderator" {
		t.Fatalf("unexpected values: %v", sa)
	}
}

func TestStringArray_Scan_String_Empty(t *testing.T) {
	var sa StringArray
	if err := sa.Scan("{}"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sa) != 0 {
		t.Fatalf("expected empty, got %v", sa)
	}
}

func TestStringArray_Scan_UnsupportedType(t *testing.T) {
	var sa StringArray
	err := sa.Scan(12345)
	if err == nil {
		t.Fatal("expected error for unsupported type, got nil")
	}
}

func TestStringArray_Value_Nil(t *testing.T) {
	var sa StringArray // nil
	val, err := sa.Value()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if val != "{}" {
		t.Fatalf("expected '{}', got '%v'", val)
	}
}

func TestStringArray_Value_NonEmpty(t *testing.T) {
	sa := StringArray{"admin", "user"}
	val, err := sa.Value()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if val != "{admin,user}" {
		t.Fatalf("expected '{admin,user}', got '%v'", val)
	}
}

func TestStringArray_Value_Empty(t *testing.T) {
	sa := StringArray{}
	val, err := sa.Value()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if val != "{}" {
		t.Fatalf("expected '{}', got '%v'", val)
	}
}

func TestStringArray_GormDataType(t *testing.T) {
	sa := StringArray{}
	if sa.GormDataType() != "text[]" {
		t.Fatalf("expected 'text[]', got '%s'", sa.GormDataType())
	}
}

// --- User Model Tests ---

func TestUser_TableName(t *testing.T) {
	u := User{}
	if u.TableName() != "users" {
		t.Fatalf("expected 'users', got '%s'", u.TableName())
	}
}

func TestUser_HasAccess_Found(t *testing.T) {
	u := &User{Accesses: StringArray{"admin", "user"}}
	if !u.HasAccess(AccessAdmin) {
		t.Fatal("expected HasAccess(admin) to be true")
	}
	if !u.HasAccess(AccessUser) {
		t.Fatal("expected HasAccess(user) to be true")
	}
}

func TestUser_HasAccess_NotFound(t *testing.T) {
	u := &User{Accesses: StringArray{"user"}}
	if u.HasAccess(AccessAdmin) {
		t.Fatal("expected HasAccess(admin) to be false")
	}
	if u.HasAccess(AccessMod) {
		t.Fatal("expected HasAccess(moderator) to be false")
	}
}

func TestUser_HasAccess_EmptyAccesses(t *testing.T) {
	u := &User{Accesses: StringArray{}}
	if u.HasAccess(AccessUser) {
		t.Fatal("expected HasAccess to be false for empty accesses")
	}
}

func TestUser_IsAdmin_True(t *testing.T) {
	u := &User{Accesses: StringArray{"admin"}}
	if !u.IsAdmin() {
		t.Fatal("expected IsAdmin to be true")
	}
}

func TestUser_IsAdmin_False(t *testing.T) {
	u := &User{Accesses: StringArray{"user"}}
	if u.IsAdmin() {
		t.Fatal("expected IsAdmin to be false")
	}
}

// --- AccessLevel Constants ---

func TestAccessLevelConstants(t *testing.T) {
	if AccessAdmin != "admin" {
		t.Fatalf("expected 'admin', got '%s'", AccessAdmin)
	}
	if AccessMod != "moderator" {
		t.Fatalf("expected 'moderator', got '%s'", AccessMod)
	}
	if AccessUser != "user" {
		t.Fatalf("expected 'user', got '%s'", AccessUser)
	}
	if AccessGuest != "guest" {
		t.Fatalf("expected 'guest', got '%s'", AccessGuest)
	}
}
