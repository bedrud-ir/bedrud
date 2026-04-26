package database

import (
	"fmt"
	"os"

	"bedrud/internal/models"

	"github.com/rs/zerolog/log"
)

// RunMigrations performs all database migrations
func RunMigrations() error {
	if os.Getenv("BEDRUD_SKIP_MIGRATE") == "1" {
		log.Info().Msg("Skipping database migrations (BEDRUD_SKIP_MIGRATE=1)")
		return nil
	}

	db := GetDB()
	if db == nil {
		return fmt.Errorf("database not initialized; call database.Initialize first")
	}

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
	if err := db.AutoMigrate(&models.Passkey{}); err != nil {
		return err
	}
	if err := db.AutoMigrate(&models.SystemSettings{}); err != nil {
		return err
	}
	if err := db.AutoMigrate(&models.InviteToken{}); err != nil {
		return err
	}
	if err := db.AutoMigrate(&models.UserPreferences{}); err != nil {
		return err
	}

	// Add foreign key constraints manually (idempotent, Postgres only)
	// SQLite does not support ALTER TABLE ADD CONSTRAINT for composite FKs.
	if db.Dialector.Name() == "postgres" {
		if !db.Migrator().HasConstraint(&models.RoomPermissions{}, "fk_room_permissions_participant") {
			if err := db.Exec(`
				ALTER TABLE room_permissions
				ADD CONSTRAINT fk_room_permissions_participant
				FOREIGN KEY (room_id, user_id)
				REFERENCES room_participants(room_id, user_id)
				ON DELETE CASCADE
			`).Error; err != nil {
				log.Warn().Err(err).Msg("Failed to add foreign key constraint")
			}
		}
	}

	log.Info().Msg("Database migrations completed successfully")
	return nil
}
