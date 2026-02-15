package testutil

import (
	"bedrud/internal/models"
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// SetupTestDB creates an in-memory SQLite database for testing
// with all required tables migrated
func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to open test database: %v", err)
	}

	// Run migrations
	err = db.AutoMigrate(
		&models.User{},
		&models.BlockedRefreshToken{},
		&models.Room{},
		&models.RoomParticipant{},
		&models.RoomPermissions{},
		&models.Passkey{},
	)
	if err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}

	return db
}
