package models

import "time"

type SystemSettings struct {
	ID                    uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	RegistrationEnabled   bool      `gorm:"not null;default:true" json:"registrationEnabled"`
	TokenRegistrationOnly bool      `gorm:"not null;default:false" json:"tokenRegistrationOnly"`
	UpdatedAt             time.Time `json:"updatedAt"`
}
