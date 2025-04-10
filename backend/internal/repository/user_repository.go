package repository

import (
	"bedrud-backend/internal/models"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateOrUpdateUser(user *models.User) error {
	now := time.Now()
	user.UpdatedAt = now

	result := r.db.Where("email = ? AND provider = ?", user.Email, user.Provider).
		Assign(user).
		FirstOrCreate(user)

	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to create or update user")
		return result.Error
	}

	return nil
}

func (r *UserRepository) GetUserByEmailAndProvider(email, provider string) (*models.User, error) {
	var user models.User
	result := r.db.Where("email = ? AND provider = ?", email, provider).First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		return nil, nil
	}

	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to get user")
		return nil, result.Error
	}

	return &user, nil
}

func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	result := r.db.Where("email = ?", email).First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		return nil, nil
	}

	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to get user by email")
		return nil, result.Error
	}

	return &user, nil
}

func (r *UserRepository) CreateUser(user *models.User) error {
	result := r.db.Create(user)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to create user")
		return result.Error
	}
	return nil
}

func (r *UserRepository) UpdateRefreshToken(userID, refreshToken string) error {
	result := r.db.Model(&models.User{}).
		Where("id = ?", userID).
		Update("refresh_token", refreshToken)

	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to update refresh token")
		return result.Error
	}
	return nil
}

func (r *UserRepository) GetUserByID(id string) (*models.User, error) {
	var user models.User
	result := r.db.Where("id = ?", id).First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		return nil, nil
	}

	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to get user by ID")
		return nil, result.Error
	}

	return &user, nil
}

func (r *UserRepository) BlockRefreshToken(userID, token string, expiresAt time.Time) error {
	blocked := &models.BlockedRefreshToken{
		ID:        uuid.New().String(),
		Token:     token,
		UserID:    userID,
		ExpiresAt: expiresAt,
	}

	result := r.db.Create(blocked)
	return result.Error
}

func (r *UserRepository) IsRefreshTokenBlocked(token string) bool {
	var count int64
	r.db.Model(&models.BlockedRefreshToken{}).
		Where("token = ? AND expires_at > ?", token, time.Now()).
		Count(&count)
	return count > 0
}

func (r *UserRepository) CleanupBlockedTokens() error {
	result := r.db.Where("expires_at < ?", time.Now()).
		Delete(&models.BlockedRefreshToken{})
	return result.Error
}

func (r *UserRepository) UpdateUserAccesses(userID string, accesses []string) error {
	result := r.db.Model(&models.User{}).
		Where("id = ?", userID).
		Update("accesses", accesses)

	return result.Error
}

func (r *UserRepository) GetUsersByAccess(access models.AccessLevel) ([]models.User, error) {
	var users []models.User
	err := r.db.Where("? = ANY(accesses)", string(access)).Find(&users).Error
	return users, err
}

// UpdateUser updates an existing user
func (r *UserRepository) UpdateUser(user *models.User) error {
	user.UpdatedAt = time.Now()
	result := r.db.Save(user)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to update user")
		return result.Error
	}
	return nil
}

// DeleteUser deletes a user by ID
func (r *UserRepository) DeleteUser(userID string) error {
	// First delete associated room participants and permissions
	if err := r.db.Delete(&models.RoomParticipant{}, "user_id = ?", userID).Error; err != nil {
		return err
	}
	if err := r.db.Delete(&models.RoomPermissions{}, "user_id = ?", userID).Error; err != nil {
		return err
	}
	// Then delete blocked refresh tokens
	if err := r.db.Delete(&models.BlockedRefreshToken{}, "user_id = ?", userID).Error; err != nil {
		return err
	}
	// Finally delete the user
	return r.db.Delete(&models.User{}, "id = ?", userID).Error
}

// GetAllUsers returns all users in the system
func (r *UserRepository) GetAllUsers() ([]models.User, error) {
	var users []models.User
	err := r.db.Find(&users).Error
	return users, err
}
