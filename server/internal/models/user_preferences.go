package models

import "time"

// UserPreferences stores per-user preferences as a JSON blob.
// The single JSON blob approach avoids schema migrations when new preference
// categories (video, keybindings, etc.) are added in the future.
type UserPreferences struct {
	UserID          string    `gorm:"primaryKey;type:varchar(36)" json:"userId"`
	PreferencesJSON string    `gorm:"type:text;not null;default:'{}'" json:"preferencesJson"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (UserPreferences) TableName() string { return "user_preferences" }
