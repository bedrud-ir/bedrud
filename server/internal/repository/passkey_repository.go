package repository

import (
	"bedrud/internal/models"

	"gorm.io/gorm"
)

type PasskeyRepository struct {
	db *gorm.DB
}

func NewPasskeyRepository(db *gorm.DB) *PasskeyRepository {
	return &PasskeyRepository{db: db}
}

func (r *PasskeyRepository) CreatePasskey(passkey *models.Passkey) error {
	return r.db.Create(passkey).Error
}

func (r *PasskeyRepository) GetPasskeyByCredentialID(credentialID []byte) (*models.Passkey, error) {
	var passkey models.Passkey
	err := r.db.Where("credential_id = ?", credentialID).First(&passkey).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &passkey, err
}

func (r *PasskeyRepository) GetPasskeysByUserID(userID string) ([]models.Passkey, error) {
	var passkeys []models.Passkey
	err := r.db.Where("user_id = ?", userID).Find(&passkeys).Error
	return passkeys, err
}

func (r *PasskeyRepository) UpdatePasskeyCounter(credentialID []byte, counter uint32) error {
	return r.db.Model(&models.Passkey{}).
		Where("credential_id = ?", credentialID).
		Update("counter", counter).Error
}

func (r *PasskeyRepository) DeletePasskey(passkeyID string) error {
	return r.db.Delete(&models.Passkey{}, "id = ?", passkeyID).Error
}
