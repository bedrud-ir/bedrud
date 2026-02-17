package models

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"time"
)

// Room name constraints
const (
	RoomNameMinLength = 3
	RoomNameMaxLength = 63
)

// Sentinel errors for room operations
var (
	ErrRoomNameInvalid  = errors.New("room name must contain only lowercase letters, numbers, and hyphens")
	ErrRoomNameTooShort = fmt.Errorf("room name must be at least %d characters", RoomNameMinLength)
	ErrRoomNameTooLong  = fmt.Errorf("room name must be at most %d characters", RoomNameMaxLength)
	ErrRoomNameTaken    = errors.New("a room with this name already exists")
)

// validRoomNameRegex allows only lowercase alphanumeric and hyphens,
// no leading/trailing hyphens, no consecutive hyphens.
var validRoomNameRegex = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

// ValidateRoomName checks that a room name is safe for use in URLs.
// Allowed: lowercase letters (a-z), digits (0-9), and hyphens (-).
// No leading/trailing hyphens, no consecutive hyphens, no special characters.
func ValidateRoomName(name string) error {
	if len(name) < RoomNameMinLength {
		return ErrRoomNameTooShort
	}
	if len(name) > RoomNameMaxLength {
		return ErrRoomNameTooLong
	}
	if !validRoomNameRegex.MatchString(name) {
		return ErrRoomNameInvalid
	}
	return nil
}

// GenerateRandomRoomName creates a URL-safe random room name in the format "xxx-xxxx-xxx"
// using cryptographically secure random values.
func GenerateRandomRoomName() (string, error) {
	const chars = "abcdefghijklmnopqrstuvwxyz"
	part := func(length int) (string, error) {
		result := make([]byte, length)
		for i := range result {
			idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
			if err != nil {
				return "", err
			}
			result[i] = chars[idx.Int64()]
		}
		return string(result), nil
	}

	p1, err := part(3)
	if err != nil {
		return "", err
	}
	p2, err := part(4)
	if err != nil {
		return "", err
	}
	p3, err := part(3)
	if err != nil {
		return "", err
	}

	return p1 + "-" + p2 + "-" + p3, nil
}

type Room struct {
	ID              string       `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Name            string       `json:"name" gorm:"uniqueIndex;not null;type:varchar(255)"`
	CreatedBy       string       `json:"createdBy" gorm:"type:varchar(36);not null"`
	IsActive        bool         `json:"isActive" gorm:"not null;default:true"`
	MaxParticipants int          `json:"maxParticipants" gorm:"not null;default:20"`
	CreatedAt       time.Time    `json:"createdAt" gorm:"autoCreateTime;not null"`
	UpdatedAt       time.Time    `json:"updatedAt" gorm:"autoUpdateTime;not null"`
	ExpiresAt       time.Time    `json:"expiresAt" gorm:"index"`
	AdminID         string       `json:"adminId" gorm:"type:varchar(36);not null"` // Room creator/admin
	IsPublic        bool         `json:"isPublic" gorm:"not null;default:false"`
	Settings        RoomSettings `json:"settings" gorm:"embedded;embeddedPrefix:settings_"`
	Mode            string       `json:"mode" gorm:"not null;default:'standard';type:varchar(20)"` // Room mode (e.g. 'standard')
}

// RoomSettings represents the global settings for a room
type RoomSettings struct {
	AllowChat       bool `json:"allowChat" gorm:"not null;default:true"`
	AllowVideo      bool `json:"allowVideo" gorm:"not null;default:true"`
	AllowAudio      bool `json:"allowAudio" gorm:"not null;default:true"`
	RequireApproval bool `json:"requireApproval" gorm:"not null;default:false"`
	E2EE            bool `json:"e2ee" gorm:"not null;default:false"`
}

// RoomParticipant represents a user in a room
type RoomParticipant struct {
	ID            string           `json:"id" gorm:"primaryKey;type:varchar(36)"`
	RoomID        string           `json:"roomId" gorm:"type:varchar(36);not null;uniqueIndex:idx_room_user"`
	UserID        string           `json:"userId" gorm:"type:varchar(36);not null;uniqueIndex:idx_room_user"`
	JoinedAt      time.Time        `json:"joinedAt" gorm:"autoCreateTime;not null"`
	LeftAt        *time.Time       `json:"leftAt"`
	IsActive      bool             `json:"isActive" gorm:"not null;default:true"`
	IsApproved    bool             `json:"isApproved" gorm:"not null;default:false"`
	IsMuted       bool             `json:"isMuted" gorm:"not null;default:false"`
	IsVideoOff    bool             `json:"isVideoOff" gorm:"not null;default:false"`
	IsChatBlocked bool             `json:"isChatBlocked" gorm:"not null;default:false"`
	IsBanned      bool             `json:"isBanned" gorm:"not null;default:false"`
	IsOnStage     bool             `json:"isOnStage" gorm:"not null;default:false"`
	User          *User            `json:"user" gorm:"foreignKey:UserID"`
	Room          *Room            `json:"room" gorm:"foreignKey:RoomID"`
	Permission    *RoomPermissions `json:"permission" gorm:"-"`
}

// RoomPermissions represents the permissions a participant has in a room
type RoomPermissions struct {
	ID              string           `json:"id" gorm:"primaryKey;type:varchar(36)"`
	RoomID          string           `json:"roomId" gorm:"type:varchar(36);not null;index"`
	UserID          string           `json:"userId" gorm:"type:varchar(36);not null;index"`
	IsAdmin         bool             `json:"isAdmin" gorm:"not null;default:false"`
	CanKick         bool             `json:"canKick" gorm:"not null;default:false"`
	CanMuteAudio    bool             `json:"canMuteAudio" gorm:"not null;default:false"`
	CanDisableVideo bool             `json:"canDisableVideo" gorm:"not null;default:false"`
	CanChat         bool             `json:"canChat" gorm:"not null;default:true"`
	CreatedAt       time.Time        `json:"createdAt" gorm:"autoCreateTime;not null"`
	UpdatedAt       time.Time        `json:"updatedAt" gorm:"autoUpdateTime;not null"`
	RoomParticipant *RoomParticipant `json:"-" gorm:"foreignKey:RoomID,UserID;references:RoomID,UserID"`
}

// TableName specifies the table names for GORM
func (Room) TableName() string {
	return "rooms"
}

func (RoomParticipant) TableName() string {
	return "room_participants"
}

func (RoomPermissions) TableName() string {
	return "room_permissions"
}
