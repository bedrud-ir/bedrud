package repository

import (
	"bedrud/internal/models"

	"gorm.io/gorm"
)

type SettingsRepository struct {
	db *gorm.DB
}

func NewSettingsRepository(db *gorm.DB) *SettingsRepository {
	return &SettingsRepository{db: db}
}

func (r *SettingsRepository) GetSettings() (*models.SystemSettings, error) {
	var s models.SystemSettings
	err := r.db.Attrs(models.SystemSettings{RegistrationEnabled: true}).FirstOrCreate(&s, models.SystemSettings{ID: 1}).Error
	return &s, err
}

func (r *SettingsRepository) SaveSettings(s *models.SystemSettings) error {
	s.ID = 1
	return r.db.Save(s).Error
}
