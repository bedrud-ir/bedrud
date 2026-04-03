package repository

import (
	"bedrud/internal/models"
	"bedrud/internal/testutil"
	"testing"
)

func TestSettingsRepository_GetSettings_CreatesDefault(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewSettingsRepository(db)

	settings, err := repo.GetSettings()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if settings == nil {
		t.Fatal("expected non-nil settings")
	}
	// Default: registration is enabled
	if !settings.RegistrationEnabled {
		t.Fatal("expected RegistrationEnabled to default to true")
	}
	if settings.TokenRegistrationOnly {
		t.Fatal("expected TokenRegistrationOnly to default to false")
	}
}

func TestSettingsRepository_GetSettings_Idempotent(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewSettingsRepository(db)

	s1, _ := repo.GetSettings()
	s2, _ := repo.GetSettings()

	if s1.ID != s2.ID {
		t.Fatalf("expected same ID on repeated GetSettings, got %d vs %d", s1.ID, s2.ID)
	}
}

func TestSettingsRepository_SaveSettings_TokenRegistrationOnly(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewSettingsRepository(db)

	// Ensure row exists first
	_, _ = repo.GetSettings()

	err := repo.SaveSettings(&models.SystemSettings{
		RegistrationEnabled:   true,
		TokenRegistrationOnly: true,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	saved, _ := repo.GetSettings()
	if !saved.TokenRegistrationOnly {
		t.Fatal("expected TokenRegistrationOnly to be true after save")
	}
}

func TestSettingsRepository_SaveSettings_MultipleUpdates(t *testing.T) {
	db := testutil.SetupTestDB(t)
	repo := NewSettingsRepository(db)

	// First save
	_ = repo.SaveSettings(&models.SystemSettings{
		RegistrationEnabled:   true,
		TokenRegistrationOnly: true,
	})

	// Second save — overrides
	_ = repo.SaveSettings(&models.SystemSettings{
		RegistrationEnabled:   true,
		TokenRegistrationOnly: false,
	})

	saved, _ := repo.GetSettings()
	if saved.TokenRegistrationOnly {
		t.Fatal("expected TokenRegistrationOnly to be false after second save")
	}
}
