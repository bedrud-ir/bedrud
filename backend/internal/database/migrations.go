package database

import (
	"bedrud-backend/internal/models"

	"github.com/rs/zerolog/log"
)

// RunMigrations performs all database migrations
func RunMigrations() error {
	db := GetDB()

	// Disable foreign key checks during migration
	db = db.Set("gorm:auto_preload", false)

	// Run migrations in correct order
	if err := db.AutoMigrate(&models.User{}); err != nil {
		return err
	}
	if err := db.AutoMigrate(&models.BlockedRefreshToken{}); err != nil {
		return err
	}
	if err := db.AutoMigrate(&models.Room{}); err != nil {
		return err
	}
	if err := db.AutoMigrate(&models.RoomParticipant{}); err != nil {
		return err
	}
	if err := db.AutoMigrate(&models.RoomPermissions{}); err != nil {
		return err
	}

	// Add foreign key constraints manually
	if err := db.Exec(`
        ALTER TABLE room_permissions 
        ADD CONSTRAINT fk_room_permissions_participant 
        FOREIGN KEY (room_id, user_id) 
        REFERENCES room_participants(room_id, user_id) 
        ON DELETE CASCADE
    `).Error; err != nil {
		log.Warn().Err(err).Msg("Failed to add foreign key constraint - might already exist")
	}

	log.Info().Msg("Database migrations completed successfully")
	return nil
}
