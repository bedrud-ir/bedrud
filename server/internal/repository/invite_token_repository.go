package repository

import (
	"bedrud/internal/models"
	"time"

	"gorm.io/gorm"
)

type InviteTokenRepository struct {
	db *gorm.DB
}

func NewInviteTokenRepository(db *gorm.DB) *InviteTokenRepository {
	return &InviteTokenRepository{db: db}
}

func (r *InviteTokenRepository) Create(t *models.InviteToken) error {
	return r.db.Create(t).Error
}

func (r *InviteTokenRepository) List() ([]models.InviteToken, error) {
	var tokens []models.InviteToken
	err := r.db.Order("created_at desc").Find(&tokens).Error
	return tokens, err
}

func (r *InviteTokenRepository) GetByToken(token string) (*models.InviteToken, error) {
	var t models.InviteToken
	err := r.db.Where("token = ?", token).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *InviteTokenRepository) MarkUsed(tokenID, userID string) error {
	now := time.Now()
	return r.db.Model(&models.InviteToken{}).Where("id = ?", tokenID).
		Updates(map[string]interface{}{"used_at": now, "used_by": userID}).Error
}

func (r *InviteTokenRepository) Delete(tokenID string) error {
	return r.db.Delete(&models.InviteToken{}, "id = ?", tokenID).Error
}
