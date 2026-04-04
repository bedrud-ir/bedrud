package repository

import (
	"bedrud/internal/models"
	"bedrud/internal/testutil"
	"testing"
	"time"

	"github.com/google/uuid"
)

func newTestToken(t *testing.T) *models.InviteToken {
	t.Helper()
	return &models.InviteToken{
		ID:        uuid.NewString(),
		Token:     uuid.NewString(),
		Email:     "invited@example.com",
		CreatedBy: "admin-user",
		ExpiresAt: time.Now().Add(72 * time.Hour),
	}
}

func TestInviteTokenRepository_Create(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewInviteTokenRepository(db)

	tok := newTestToken(t)
	err := repo.Create(tok)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if tok.ID == "" {
		t.Fatal("expected ID to be set")
	}
}

func TestInviteTokenRepository_List_Empty(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewInviteTokenRepository(db)

	tokens, err := repo.List()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tokens) != 0 {
		t.Fatalf("expected 0 tokens, got %d", len(tokens))
	}
}

func TestInviteTokenRepository_List_MultipleTokens(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewInviteTokenRepository(db)

	_ = repo.Create(newTestToken(t))
	_ = repo.Create(newTestToken(t))
	_ = repo.Create(newTestToken(t))

	tokens, err := repo.List()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tokens) != 3 {
		t.Fatalf("expected 3 tokens, got %d", len(tokens))
	}
}

func TestInviteTokenRepository_GetByToken_Found(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewInviteTokenRepository(db)

	tok := newTestToken(t)
	_ = repo.Create(tok)

	found, err := repo.GetByToken(tok.Token)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found == nil {
		t.Fatal("expected to find token")
	}
	if found.ID != tok.ID {
		t.Fatalf("expected ID '%s', got '%s'", tok.ID, found.ID)
	}
	if found.Email != "invited@example.com" {
		t.Fatalf("unexpected email: %s", found.Email)
	}
}

func TestInviteTokenRepository_GetByToken_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewInviteTokenRepository(db)

	_, err := repo.GetByToken("nonexistent-token-value")
	if err == nil {
		t.Fatal("expected error for missing token")
	}
}

func TestInviteTokenRepository_MarkUsed(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewInviteTokenRepository(db)

	tok := newTestToken(t)
	_ = repo.Create(tok)

	err := repo.MarkUsed(tok.ID, "registered-user-id")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify it was marked as used
	found, _ := repo.GetByToken(tok.Token)
	if found.UsedAt == nil {
		t.Fatal("expected UsedAt to be set after MarkUsed")
	}
	if found.UsedBy != "registered-user-id" {
		t.Fatalf("expected UsedBy 'registered-user-id', got %q", found.UsedBy)
	}
}

func TestInviteTokenRepository_Delete(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewInviteTokenRepository(db)

	tok := newTestToken(t)
	_ = repo.Create(tok)

	err := repo.Delete(tok.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	tokens, _ := repo.List()
	if len(tokens) != 0 {
		t.Fatalf("expected 0 tokens after delete, got %d", len(tokens))
	}
}

func TestInviteTokenRepository_Delete_NonExistent(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewInviteTokenRepository(db)

	// Deleting a non-existent ID should not error
	err := repo.Delete("nonexistent-id")
	if err != nil {
		t.Fatalf("unexpected error deleting non-existent: %v", err)
	}
}
