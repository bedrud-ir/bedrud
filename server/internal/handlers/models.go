package handlers

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error" example:"Error message"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	User  UserResponse `json:"user"`
	Token string       `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

// UserResponse represents the user data from OAuth providers
type UserResponse struct {
	ID        string `json:"id" example:"123456789"`
	Email     string `json:"email" example:"user@example.com"`
	Name      string `json:"name" example:"John Doe"`
	Provider  string `json:"provider" example:"google"`
	AvatarURL string `json:"avatarUrl" example:"https://example.com/avatar.jpg"`
}
