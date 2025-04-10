package models

import (
	"database/sql/driver"
	"errors"
	"strings"
	"time"
)

type AccessLevel string

const (
	AccessAdmin AccessLevel = "admin"
	AccessMod   AccessLevel = "moderator"
	AccessUser  AccessLevel = "user"
	AccessGuest AccessLevel = "guest"
)

// StringArray is a custom type for handling string arrays in PostgreSQL
type StringArray []string

// Scan implements the sql.Scanner interface
func (sa *StringArray) Scan(value interface{}) error {
	if value == nil {
		*sa = StringArray{}
		return nil
	}

	switch v := value.(type) {
	case []byte:
		// Convert the []byte to string and parse it
		str := string(v)
		// Remove the curly braces and split by comma
		str = str[1 : len(str)-1]
		if str == "" {
			*sa = StringArray{}
			return nil
		}
		*sa = StringArray(strings.Split(str, ","))
		return nil
	case string:
		str := v
		str = str[1 : len(str)-1]
		if str == "" {
			*sa = StringArray{}
			return nil
		}
		*sa = StringArray(strings.Split(str, ","))
		return nil
	default:
		return errors.New("failed to scan StringArray")
	}
}

// Value implements the driver.Valuer interface
func (sa StringArray) Value() (driver.Value, error) {
	if sa == nil {
		return "{}", nil
	}
	return "{" + strings.Join(sa, ",") + "}", nil
}

// GormDataType implements the GormDataTypeInterface
func (StringArray) GormDataType() string {
	return "text[]"
}

type User struct {
	ID           string      `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Email        string      `json:"email" gorm:"uniqueIndex;not null;type:varchar(255)"`
	Name         string      `json:"name" gorm:"not null;type:varchar(255)"`
	Provider     string      `json:"provider" gorm:"not null;type:varchar(50);index"`
	AvatarURL    string      `json:"avatarUrl" gorm:"column:avatar_url;type:varchar(255)"`
	Password     string      `json:"-" gorm:"type:varchar(255)"`
	RefreshToken string      `json:"-" gorm:"column:refresh_token;type:text"`
	Accesses     StringArray `json:"accesses" gorm:"type:text[]"`
	IsActive     bool        `json:"isActive" gorm:"not null;default:true"`
	CreatedAt    time.Time   `json:"createdAt" gorm:"autoCreateTime;not null"`
	UpdatedAt    time.Time   `json:"updatedAt" gorm:"autoUpdateTime;not null"`
}

// TableName specifies the table name for GORM
func (User) TableName() string {
	return "users"
}

// HasAccess checks if user has specific access level
func (u *User) HasAccess(level AccessLevel) bool {
	for _, access := range u.Accesses {
		if access == string(level) {
			return true
		}
	}
	return false
}

// IsAdmin checks if user has admin access
func (u *User) IsAdmin() bool {
	return u.HasAccess(AccessAdmin)
}
