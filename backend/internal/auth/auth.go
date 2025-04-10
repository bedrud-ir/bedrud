package auth

import (
	"bedrud-backend/config"
	"bedrud-backend/internal/models"
	"bedrud-backend/internal/repository"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
	"github.com/markbates/goth/providers/twitter"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
)

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// RegisterRequest represents registration request data
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

// LoginRequest represents login request data
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// TokenResponse represents token response data
type TokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

// LogoutRequest represents the request payload for logout
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" example:"eyJhbGciOiJ..."`
}

// LoginResponse represents the structured response for login
type LoginResponse struct {
	User  *models.User `json:"user"`
	Token TokenPair    `json:"tokens"`
}

// TokenPair represents the access and refresh tokens
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{
		userRepo: userRepo,
	}
}

// @Summary Register new user
// @Description Create a new user account
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration Data"
// @Success 200 {object} TokenResponse
// @Failure 400 {object} ErrorResponse
// @Router /auth/register [post]
func (s *AuthService) Register(email, password, name string) (*models.User, error) {
	// Check if user exists
	existingUser, err := s.userRepo.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("user already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		ID:        uuid.New().String(),
		Email:     email,
		Password:  string(hashedPassword),
		Name:      name,
		Provider:  "local",
		Accesses:  models.StringArray{"user"}, // Use our custom type
		IsActive:  true,                       // Add this line
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = s.userRepo.CreateUser(user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// @Summary Login user
// @Description Authenticate user and get tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login Data"
// @Success 200 {object} TokenResponse
// @Failure 401 {object} ErrorResponse
// @Router /auth/login [post]
func (s *AuthService) Login(email, password string) (*LoginResponse, error) {
	user, err := s.userRepo.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid password")
	}

	// Generate tokens
	accessToken, refreshToken, err := GenerateTokenPair(user.ID, user.Email, user.Accesses, config.Get())
	if err != nil {
		return nil, errors.New("failed to generate tokens")
	}

	// Update refresh token in database
	if err := s.userRepo.UpdateRefreshToken(user.ID, refreshToken); err != nil {
		return nil, errors.New("failed to save refresh token")
	}

	return &LoginResponse{
		User: user,
		Token: TokenPair{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	}, nil
}

// @Summary Refresh token
// @Description Get new access token using refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body map[string]string true "Refresh Token"
// @Success 200 {object} TokenResponse
// @Failure 401 {object} ErrorResponse
// @Router /auth/refresh [post]
func (s *AuthService) UpdateRefreshToken(userID, refreshToken string) error {
	return s.userRepo.UpdateRefreshToken(userID, refreshToken)
}

// @Summary Get user profile
// @Description Get current user profile
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.User
// @Failure 401 {object} ErrorResponse
// @SecuritySchemes BearerAuth bearerAuth
// @Router /auth/me [get]
func (s *AuthService) GetUserByID(userID string) (*models.User, error) {
	return s.userRepo.GetUserByID(userID)
}

// @Summary Logout user
// @Description Invalidate refresh token and logout user
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param refresh_token body string true "Refresh token to invalidate"
// @Success 200 {object} map[string]string
// @Failure 401 {object} ErrorResponse
// @Router /auth/logout [post]
func (s *AuthService) Logout(userID string, refreshToken string) error {
	// Parse the refresh token to get expiration
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(refreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.Get().Auth.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return errors.New("invalid refresh token")
	}

	// Block the refresh token
	return s.userRepo.BlockRefreshToken(userID, refreshToken, time.Unix(claims.ExpiresAt.Unix(), 0))
}

// @Summary Block refresh token
// @Description Block a refresh token during logout
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body LogoutRequest true "Logout request"
// @Success 200 {object} map[string]string
// @Failure 401 {object} ErrorResponse
// @Router /auth/logout [post]
func (s *AuthService) BlockRefreshToken(userID string, refreshToken string) error {
	// Parse the refresh token to get expiration
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(refreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.Get().Auth.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return errors.New("invalid refresh token")
	}

	// Block the refresh token
	return s.userRepo.BlockRefreshToken(userID, refreshToken, time.Unix(claims.ExpiresAt.Unix(), 0))
}

// Updated refresh token validation
func (s *AuthService) ValidateRefreshToken(refreshToken string) (*Claims, error) {
	// Check if token is blocked
	if s.userRepo.IsRefreshTokenBlocked(refreshToken) {
		return nil, errors.New("refresh token has been revoked")
	}

	// Validate the token
	claims, err := ValidateToken(refreshToken, config.Get())
	if err != nil {
		return nil, err
	}

	return claims, nil
}

// New method to update user accesses
func (s *AuthService) UpdateUserAccesses(userID string, accesses []string) error {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return err
	}

	user.Accesses = accesses
	return s.userRepo.UpdateUser(user)
}

func Init(cfg *config.Config) {
	providers := []goth.Provider{}

	// Initialize Google provider if credentials are provided
	if cfg.Auth.Google.ClientID != "" && cfg.Auth.Google.ClientSecret != "" {
		log.Debug().Msg("Initializing Google provider")
		log.Debug().Str("redirect_url", cfg.Auth.Google.RedirectURL).Msg("Google callback URL")

		provider := google.New(
			cfg.Auth.Google.ClientID,
			cfg.Auth.Google.ClientSecret,
			cfg.Auth.Google.RedirectURL,
			"email",
			"profile",
			"openid",
		)
		provider.SetHostedDomain("") // Allow any domain
		providers = append(providers, provider)
	}

	// Initialize GitHub provider if credentials are provided
	if cfg.Auth.Github.ClientID != "" && cfg.Auth.Github.ClientSecret != "" {
		log.Debug().Msg("Initializing GitHub provider")
		log.Debug().Msg("Client ID: " + cfg.Auth.Github.ClientID)
		log.Debug().Msg("Client Secret: " + cfg.Auth.Github.ClientSecret)
		log.Debug().Msg("Redirect URL: " + cfg.Auth.Github.RedirectURL)
		providers = append(providers, github.New(
			cfg.Auth.Github.ClientID,
			cfg.Auth.Github.ClientSecret,
			cfg.Auth.Github.RedirectURL,
			"user:email",
		))
	}

	// Initialize Twitter provider if credentials are provided
	if cfg.Auth.Twitter.ClientID != "" && cfg.Auth.Twitter.ClientSecret != "" {
		log.Debug().Msg("Initializing Twitter provider")
		providers = append(providers, twitter.New(
			cfg.Auth.Twitter.ClientID,
			cfg.Auth.Twitter.ClientSecret,
			cfg.Auth.Twitter.RedirectURL,
		))
	}

	log.Debug().Int("provider_count", len(providers)).Msg("Using providers")
	goth.UseProviders(providers...)
}
