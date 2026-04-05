package repository

import (
	"bedrud/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserPreferencesRepository struct {
	db *gorm.DB
}

func NewUserPreferencesRepository(db *gorm.DB) *UserPreferencesRepository {
	return &UserPreferencesRepository{db: db}
}

// GetByUserID returns the preferences row for a user, or nil if not found.
func (r *UserPreferencesRepository) GetByUserID(userID string) (*models.UserPreferences, error) {
	var p models.UserPreferences
	result := r.db.First(&p, "user_id = ?", userID)
	if result.Error == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if result.Error != nil {
		return nil, result.Error
	}
	return &p, nil
}

// Upsert creates or fully replaces the preferences row for a user.
func (r *UserPreferencesRepository) Upsert(userID, prefsJSON string) error {
	p := models.UserPreferences{
		UserID:          userID,
		PreferencesJSON: prefsJSON,
	}
	return r.db.Clauses(clause.OnConflict{UpdateAll: true}).Create(&p).Error
}
