package models

import "time"

type InviteToken struct {
	ID        string     `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Token     string     `gorm:"uniqueIndex;not null;type:varchar(64)" json:"token"`
	Email     string     `gorm:"type:varchar(255)" json:"email"`
	CreatedBy string     `gorm:"not null;type:varchar(36)" json:"createdBy"`
	ExpiresAt time.Time  `json:"expiresAt"`
	UsedAt    *time.Time `json:"usedAt"`
	UsedBy    string     `gorm:"type:varchar(36)" json:"usedBy"`
	CreatedAt time.Time  `json:"createdAt"`
}
