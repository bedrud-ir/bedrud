package repository

import (
	"bedrud/internal/models"
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
func (r *RoomRepository) CreateRoom(createdBy string, name string, isPublic bool, mode string, settings models.RoomSettings) (*models.Room, error) {
	var room *models.Room

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// Create room first
		newRoom := &models.Room{
			ID:        uuid.New().String(),
			Name:      name,
			CreatedBy: createdBy,
			AdminID:   createdBy,
			IsActive:  true,
			IsPublic:  isPublic,
			Settings:  settings,
			Mode:      mode,
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
			IsOnStage:  true, // Creator is always on stage
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
		// Check if participant is banned
		if existing.IsBanned {
			return errors.New("user is banned from this room")
		}

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
		ID:        uuid.New().String(),
		RoomID:    roomID,
		UserID:    userID,
		IsActive:  true,
		JoinedAt:  time.Now(),
		IsOnStage: false, // Default to audience
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

// BringToStage brings a participant to the stage
func (r *RoomRepository) BringToStage(roomID, userID string) error {
	return r.db.Model(&models.RoomParticipant{}).
		Where("room_id = ? AND user_id = ?", roomID, userID).
		Update("is_on_stage", true).Error
}

// RemoveFromStage removes a participant from the stage
func (r *RoomRepository) RemoveFromStage(roomID, userID string) error {
	return r.db.Model(&models.RoomParticipant{}).
		Where("room_id = ? AND user_id = ?", roomID, userID).
		Update("is_on_stage", false).Error
}

// IsParticipantOnStage checks if a participant is on stage
func (r *RoomRepository) IsParticipantOnStage(roomID, userID string) (bool, error) {
	var participant models.RoomParticipant
	err := r.db.Where("room_id = ? AND user_id = ?", roomID, userID).First(&participant).Error
	if err != nil {
		return false, err
	}
	return participant.IsOnStage, nil
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
			"is_banned": true,
			"left_at":   now,
		}).Error
}

// UpdateRoomSettings updates room global settings
func (r *RoomRepository) UpdateRoomSettings(roomID string, settings models.RoomSettings) error {
	return r.db.Model(&models.Room{}).
		Where("id = ?", roomID).
		Select("Settings").
		Updates(models.Room{Settings: settings}).Error
}

// DeleteRoom deletes a room and its related data. Only the creator can delete.
func (r *RoomRepository) DeleteRoom(roomID, userID string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var room models.Room
		if err := tx.Where("id = ? AND created_by = ?", roomID, userID).First(&room).Error; err != nil {
			return err
		}
		tx.Where("room_id = ?", roomID).Delete(&models.RoomPermissions{})
		tx.Where("room_id = ?", roomID).Delete(&models.RoomParticipant{})
		return tx.Delete(&room).Error
	})
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

// GetRoomsCreatedByUser retrieves rooms created by a specific user
func (r *RoomRepository) GetRoomsCreatedByUser(userID string) ([]models.Room, error) {
	var rooms []models.Room
	err := r.db.Where("created_by = ?", userID).Order("created_at desc").Find(&rooms).Error
	return rooms, err
}

// GetRoomsParticipatedInByUser retrieves rooms a user has participated in (excluding those they created)
func (r *RoomRepository) GetRoomsParticipatedInByUser(userID string) ([]models.Room, error) {
	var rooms []models.Room
	// Find RoomIDs where the user is a participant
	var participantRoomIDs []string
	err := r.db.Model(&models.RoomParticipant{}).
		Where("user_id = ? AND room_id NOT IN (?)", userID, r.db.Model(&models.Room{}).Select("id").Where("created_by = ?", userID)).
		Distinct("room_id").
		Pluck("room_id", &participantRoomIDs).Error
	if err != nil {
		return nil, err
	}

	if len(participantRoomIDs) == 0 {
		return rooms, nil // Return empty slice if no participated rooms
	}

	// Fetch the rooms based on the found IDs
	err = r.db.Where("id IN (?)", participantRoomIDs).Order("created_at desc").Find(&rooms).Error
	return rooms, err
}
