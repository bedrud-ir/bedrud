package repository

import (
	"bedrud-backend/internal/models"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoomRepository struct {
	db *gorm.DB
}

func NewRoomRepository(db *gorm.DB) *RoomRepository {
	return &RoomRepository{db: db}
}

// CreateRoom creates a new room with default admin permissions for creator
func (r *RoomRepository) CreateRoom(createdBy string, name string, settings models.RoomSettings) (*models.Room, error) {
	var room *models.Room

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// Create room first
		newRoom := &models.Room{
			ID:        uuid.New().String(),
			Name:      name,
			CreatedBy: createdBy,
			AdminID:   createdBy,
			IsActive:  true,
			Settings:  settings,
			ExpiresAt: time.Now().Add(24 * time.Hour),
		}

		if err := tx.Create(newRoom).Error; err != nil {
			return err
		}

		// Create room participant record for the creator
		participant := &models.RoomParticipant{
			ID:         uuid.New().String(),
			RoomID:     newRoom.ID,
			UserID:     createdBy,
			IsActive:   true,
			IsApproved: true, // Creator is automatically approved
		}

		if err := tx.Create(participant).Error; err != nil {
			return err
		}

		// Now create admin permissions
		adminPermissions := &models.RoomPermissions{
			ID:              uuid.New().String(),
			RoomID:          newRoom.ID,
			UserID:          createdBy,
			IsAdmin:         true,
			CanKick:         true,
			CanMuteAudio:    true,
			CanDisableVideo: true,
			CanChat:         true,
		}

		if err := tx.Create(adminPermissions).Error; err != nil {
			return err
		}

		room = newRoom
		return nil
	})

	if err != nil {
		return nil, err
	}

	return room, nil
}

// GetRoom retrieves a room by ID
func (r *RoomRepository) GetRoom(id string) (*models.Room, error) {
	var room models.Room
	result := r.db.First(&room, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return &room, nil
}

// GetRoomByName retrieves a room by name
func (r *RoomRepository) GetRoomByName(name string) (*models.Room, error) {
	var room models.Room
	result := r.db.First(&room, "name = ?", name)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return &room, nil
}

// AddParticipant adds a participant to a room or reactivates them if they already exist
func (r *RoomRepository) AddParticipant(roomID, userID string) error {
	// Check if participant already exists
	var existing models.RoomParticipant
	err := r.db.Where("room_id = ? AND user_id = ?", roomID, userID).First(&existing).Error

	if err == nil {
		// Participant exists, update their status
		return r.db.Model(&existing).Updates(map[string]interface{}{
			"is_active": true,
			"left_at":   nil,
			"joined_at": time.Now(),
		}).Error
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		// Unexpected error
		return err
	}

	// Create new participant
	participant := &models.RoomParticipant{
		ID:       uuid.New().String(),
		RoomID:   roomID,
		UserID:   userID,
		IsActive: true,
		JoinedAt: time.Now(),
	}

	return r.db.Create(participant).Error
}

// RemoveParticipant marks a participant as inactive and sets their leave time
func (r *RoomRepository) RemoveParticipant(roomID, userID string) error {
	now := time.Now()
	return r.db.Model(&models.RoomParticipant{}).
		Where("room_id = ? AND user_id = ? AND is_active = ?", roomID, userID, true).
		Updates(map[string]interface{}{
			"is_active": false,
			"left_at":   now,
		}).Error
}

// GetActiveParticipants gets all active participants in a room
func (r *RoomRepository) GetActiveParticipants(roomID string) ([]models.RoomParticipant, error) {
	var participants []models.RoomParticipant
	err := r.db.Where("room_id = ? AND is_active = ?", roomID, true).
		Find(&participants).Error
	return participants, err
}

// CleanupExpiredRooms marks rooms as inactive if they've expired
func (r *RoomRepository) CleanupExpiredRooms() error {
	return r.db.Model(&models.Room{}).
		Where("expires_at < ? AND is_active = ?", time.Now(), true).
		Update("is_active", false).Error
}

// UpdateParticipantPermissions updates a participant's permissions
func (r *RoomRepository) UpdateParticipantPermissions(roomID, userID string, permissions models.RoomPermissions) error {
	return r.db.Where("room_id = ? AND user_id = ?", roomID, userID).
		Updates(&permissions).Error
}

// GetParticipantPermissions gets a participant's permissions
func (r *RoomRepository) GetParticipantPermissions(roomID, userID string) (*models.RoomPermissions, error) {
	var permissions models.RoomPermissions
	err := r.db.Where("room_id = ? AND user_id = ?", roomID, userID).First(&permissions).Error
	if err != nil {
		return nil, err
	}
	return &permissions, nil
}

// UpdateParticipantStatus updates a participant's status (mute, video, chat)
func (r *RoomRepository) UpdateParticipantStatus(roomID, userID string, updates map[string]interface{}) error {
	return r.db.Model(&models.RoomParticipant{}).
		Where("room_id = ? AND user_id = ?", roomID, userID).
		Updates(updates).Error
}

// KickParticipant removes a participant from the room
func (r *RoomRepository) KickParticipant(roomID, userID string) error {
	now := time.Now()
	return r.db.Model(&models.RoomParticipant{}).
		Where("room_id = ? AND user_id = ?", roomID, userID).
		Updates(map[string]interface{}{
			"is_active": false,
			"left_at":   now,
		}).Error
}

// UpdateRoomSettings updates room global settings
func (r *RoomRepository) UpdateRoomSettings(roomID string, settings models.RoomSettings) error {
	return r.db.Model(&models.Room{}).
		Where("id = ?", roomID).
		Updates(map[string]interface{}{
			"settings_allow_chat":       settings.AllowChat,
			"settings_allow_video":      settings.AllowVideo,
			"settings_allow_audio":      settings.AllowAudio,
			"settings_require_approval": settings.RequireApproval,
		}).Error
}

func (r *RoomRepository) GetAllRooms() ([]models.Room, error) {
	var rooms []models.Room
	err := r.db.Find(&rooms).Error
	return rooms, err
}

func (r *RoomRepository) GetRoomParticipantsWithUsers(roomID string) ([]models.RoomParticipant, error) {
	var participants []models.RoomParticipant
	err := r.db.Preload("User").Where("room_id = ?", roomID).Find(&participants).Error
	return participants, err
}

func (r *RoomRepository) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	err := r.db.Where("id = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
