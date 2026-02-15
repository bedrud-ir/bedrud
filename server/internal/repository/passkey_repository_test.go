package repository

import (
	"bedrud/internal/models"
	"bedrud/internal/testutil"
	"testing"
)

func TestPasskeyRepository_CreatePasskey(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewPasskeyRepository(db)

	passkey := &models.Passkey{
		ID:           "pk-1",
		UserID:       "user-1",
		CredentialID: []byte("cred-123"),
		PublicKey:    []byte("pub-key-data"),
		Algorithm:    -7,
		Counter:      0,
		Name:         "My Passkey",
	}

	err := repo.CreatePasskey(passkey)
	if err != nil {
		t.Fatalf("failed to create passkey: %v", err)
	}
}

func TestPasskeyRepository_GetPasskeyByCredentialID(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewPasskeyRepository(db)

	credID := []byte("unique-cred-id")
	_ = repo.CreatePasskey(&models.Passkey{
		ID:           "pk-1",
		UserID:       "user-1",
		CredentialID: credID,
		PublicKey:    []byte("pub-key"),
		Algorithm:    -7,
		Name:         "Test Key",
	})

	found, err := repo.GetPasskeyByCredentialID(credID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found == nil {
		t.Fatal("expected to find passkey")
	}
	if found.UserID != "user-1" {
		t.Fatalf("expected userID 'user-1', got '%s'", found.UserID)
	}
}

func TestPasskeyRepository_GetPasskeyByCredentialID_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewPasskeyRepository(db)

	found, err := repo.GetPasskeyByCredentialID([]byte("nonexistent"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found != nil {
		t.Fatal("expected nil for non-existent credential ID")
	}
}

func TestPasskeyRepository_GetPasskeysByUserID(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewPasskeyRepository(db)

	_ = repo.CreatePasskey(&models.Passkey{ID: "pk-1", UserID: "user-1", CredentialID: []byte("c1"), PublicKey: []byte("k1"), Algorithm: -7, Name: "Key 1"})
	_ = repo.CreatePasskey(&models.Passkey{ID: "pk-2", UserID: "user-1", CredentialID: []byte("c2"), PublicKey: []byte("k2"), Algorithm: -7, Name: "Key 2"})
	_ = repo.CreatePasskey(&models.Passkey{ID: "pk-3", UserID: "user-2", CredentialID: []byte("c3"), PublicKey: []byte("k3"), Algorithm: -7, Name: "Key 3"})

	passkeys, err := repo.GetPasskeysByUserID("user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(passkeys) != 2 {
		t.Fatalf("expected 2 passkeys for user-1, got %d", len(passkeys))
	}
}

func TestPasskeyRepository_GetPasskeysByUserID_Empty(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewPasskeyRepository(db)

	passkeys, err := repo.GetPasskeysByUserID("nonexistent-user")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(passkeys) != 0 {
		t.Fatalf("expected 0 passkeys, got %d", len(passkeys))
	}
}

func TestPasskeyRepository_UpdatePasskeyCounter(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewPasskeyRepository(db)

	credID := []byte("counter-cred")
	_ = repo.CreatePasskey(&models.Passkey{
		ID:           "pk-1",
		UserID:       "user-1",
		CredentialID: credID,
		PublicKey:    []byte("k"),
		Algorithm:    -7,
		Counter:      0,
		Name:         "Counter Key",
	})

	err := repo.UpdatePasskeyCounter(credID, 5)
	if err != nil {
		t.Fatalf("failed to update counter: %v", err)
	}

	found, _ := repo.GetPasskeyByCredentialID(credID)
	if found.Counter != 5 {
		t.Fatalf("expected counter 5, got %d", found.Counter)
	}
}

func TestPasskeyRepository_DeletePasskey(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewPasskeyRepository(db)

	_ = repo.CreatePasskey(&models.Passkey{
		ID:           "pk-to-delete",
		UserID:       "user-1",
		CredentialID: []byte("del-cred"),
		PublicKey:    []byte("k"),
		Algorithm:    -7,
		Name:         "Delete Me",
	})

	err := repo.DeletePasskey("pk-to-delete")
	if err != nil {
		t.Fatalf("failed to delete passkey: %v", err)
	}

	passkeys, _ := repo.GetPasskeysByUserID("user-1")
	if len(passkeys) != 0 {
		t.Fatalf("expected 0 passkeys after delete, got %d", len(passkeys))
	}
}
