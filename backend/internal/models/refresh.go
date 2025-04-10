package models

import "time"

type BlockedRefreshToken struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Token     string    `json:"token" gorm:"type:text;not null;uniqueIndex"`
	UserID    string    `json:"userId" gorm:"type:varchar(36);not null;index"`
	ExpiresAt time.Time `json:"expiresAt" gorm:"not null;index"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime;not null"`
}

// TableName specifies the table name for GORM
func (BlockedRefreshToken) TableName() string {
	return "blocked_refresh_tokens"
}
