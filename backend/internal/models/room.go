package models

import "time"

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
	Settings        RoomSettings `json:"settings" gorm:"embedded;embeddedPrefix:settings_"`
}

// RoomSettings represents the global settings for a room
type RoomSettings struct {
	AllowChat       bool `json:"allowChat" gorm:"not null;default:true"`
	AllowVideo      bool `json:"allowVideo" gorm:"not null;default:true"`
	AllowAudio      bool `json:"allowAudio" gorm:"not null;default:true"`
	RequireApproval bool `json:"requireApproval" gorm:"not null;default:false"`
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
