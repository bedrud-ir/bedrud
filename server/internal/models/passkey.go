package models

import (
	"time"
)

type Passkey struct {
	ID           string    `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID       string    `json:"userId" gorm:"not null;type:varchar(36);index"`
	CredentialID []byte    `json:"credentialId" gorm:"not null;type:bytea"`
	PublicKey    []byte    `json:"publicKey" gorm:"not null;type:bytea"`
	Algorithm    int       `json:"algorithm" gorm:"not null;default:0"`
	Counter      uint32    `json:"counter" gorm:"not null;default:0"`
	Name         string    `json:"name" gorm:"type:varchar(255)"`
	CreatedAt    time.Time `json:"createdAt" gorm:"autoCreateTime;not null"`
}

func (Passkey) TableName() string {
	return "passkeys"
}
