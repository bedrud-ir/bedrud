package auth

import (
	"bedrud/config"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"crypto/rand"
	"crypto/x509"
	"encoding/base64"
	"errors"
	"strings"
	"time"

	"github.com/go-passkeys/go-passkeys/webauthn"
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
	userRepo    *repository.UserRepository
	passkeyRepo *repository.PasskeyRepository
}

func NewAuthService(userRepo *repository.UserRepository, passkeyRepo *repository.PasskeyRepository) *AuthService {
	return &AuthService{
		userRepo:    userRepo,
		passkeyRepo: passkeyRepo,
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

	// Dummy bcrypt hash used to maintain constant-time response when user is nil,
	// preventing timing-based email enumeration attacks.
	const dummyHash = "$2a$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

	if user == nil {
		// Perform a dummy comparison so both the nil-user and wrong-password paths
		// take roughly the same amount of time (~100ms bcrypt).
		_ = bcrypt.CompareHashAndPassword([]byte(dummyHash), []byte(password))
		return nil, errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Check if account is deactivated before issuing tokens.
	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	// Generate tokens
	accessToken, refreshToken, err := GenerateTokenPair(user.ID, user.Email, user.Name, user.Accesses, config.Get())
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

// GuestLoginRequest represents guest login request data
type GuestLoginRequest struct {
	Name string `json:"name"`
}

// GuestLogin creates a temporary guest user and returns tokens
func (s *AuthService) GuestLogin(name string) (*LoginResponse, error) {
	// Create a guest user
	// Note: In a production app, you might want to cleanup these users eventually
	user := &models.User{
		ID:        uuid.New().String(),
		Email:     "guest_" + uuid.New().String() + "@bedrud.guest",
		Name:      name,
		Provider:  "guest",
		Accesses:  models.StringArray{"guest"},
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := s.userRepo.CreateUser(user)
	if err != nil {
		return nil, err
	}

	// Generate tokens
	accessToken, refreshToken, err := GenerateTokenPair(user.ID, user.Email, user.Name, user.Accesses, config.Get())
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

func (s *AuthService) GetUserByEmail(email string) (*models.User, error) {
	return s.userRepo.GetUserByEmail(email)
}

// UpdateProfile updates the user's display name.
func (s *AuthService) UpdateProfile(userID, name string) (*models.User, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	user.Name = name
	if err := s.userRepo.UpdateUser(user); err != nil {
		return nil, err
	}
	return user, nil
}

// ChangePassword verifies the current password then sets a new one.
func (s *AuthService) ChangePassword(userID, currentPassword, newPassword string) error {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil || user == nil {
		return errors.New("user not found")
	}
	if user.Provider != models.ProviderLocal && user.Provider != "passkey" {
		return errors.New("password change is only available for local accounts")
	}
	// Passkey-only users may have an empty stored password; skip the current-
	// password check in that case and let them set a password for the first time.
	if user.Password != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword)); err != nil {
			return errors.New("current password is incorrect")
		}
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashed)
	return s.userRepo.UpdateUser(user)
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
func (s *AuthService) Logout(userID string, refreshToken string, accessToken string) error {
	if err := s.BlockRefreshToken(userID, refreshToken); err != nil {
		return err
	}
	RevokeAccessToken(accessToken, config.Get())
	return nil
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
func (s *AuthService) BlockRefreshToken(userID, refreshToken string) error {
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

// ErrRefreshTokenMismatch is returned when the presented refresh token does not
// match the token currently stored for the user (e.g. it was rotated on another device).
var ErrRefreshTokenMismatch = errors.New("refresh token does not match stored token for user")

// Updated refresh token validation
func (s *AuthService) ValidateRefreshToken(refreshToken string) (*Claims, error) {
	// Check if token is blocked
	if s.userRepo.IsRefreshTokenBlocked(refreshToken) {
		return nil, errors.New("refresh token has been revoked")
	}

	// Validate the token signature and claims
	claims, err := ValidateToken(refreshToken, config.Get())
	if err != nil {
		return nil, err
	}

	// Verify the token matches what is currently stored for this user.
	// This prevents replay of a token that was rotated on another device.
	user, err := s.userRepo.GetUserByID(claims.UserID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	if !s.userRepo.MatchRefreshToken(user.ID, refreshToken) {
		return nil, ErrRefreshTokenMismatch
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

func (s *AuthService) BeginRegisterPasskey(userID string) (string, error) {
	challenge := make([]byte, 32)
	if _, err := rand.Read(challenge); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(challenge), nil
}

func (s *AuthService) FinishRegisterPasskey(userID, challengeStr string, clientDataJSON, attestationObject []byte, rpID, origin string) error {
	challenge, err := base64.RawURLEncoding.DecodeString(challengeStr)
	if err != nil {
		return err
	}

	rp := &webauthn.RelyingParty{
		ID:     rpID,
		Origin: origin,
	}

	authData, err := rp.VerifyAttestation(challenge, clientDataJSON, attestationObject)
	if err != nil {
		return err
	}

	// Prevent duplicate credential registration.
	existing, _ := s.passkeyRepo.GetPasskeyByCredentialID(authData.CredentialID)
	if existing != nil {
		return errors.New("passkey already registered")
	}

	pub, err := x509.MarshalPKIXPublicKey(authData.PublicKey)
	if err != nil {
		return err
	}

	passkey := &models.Passkey{
		ID:           uuid.New().String(),
		UserID:       userID,
		CredentialID: authData.CredentialID,
		PublicKey:    pub,
		Algorithm:    int(authData.Algorithm),
		Counter:      authData.Counter,
		Name:         "Passkey",
	}

	return s.passkeyRepo.CreatePasskey(passkey)
}

func (s *AuthService) FinishSignupPasskey(userID, email, name, challengeStr string, clientDataJSON, attestationObject []byte, rpID, origin string) (*LoginResponse, error) {
	challenge, err := base64.RawURLEncoding.DecodeString(challengeStr)
	if err != nil {
		return nil, err
	}

	rp := &webauthn.RelyingParty{
		ID:     rpID,
		Origin: origin,
	}

	authData, err := rp.VerifyAttestation(challenge, clientDataJSON, attestationObject)
	if err != nil {
		return nil, err
	}

	pub, err := x509.MarshalPKIXPublicKey(authData.PublicKey)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &models.User{
		ID:       userID,
		Email:    email,
		Name:     name,
		Provider: "passkey",
		IsActive: true,
		Accesses: []string{"user"},
	}

	if err := s.userRepo.CreateUser(user); err != nil {
		return nil, err
	}

	passkey := &models.Passkey{
		ID:           uuid.New().String(),
		UserID:       userID,
		CredentialID: authData.CredentialID,
		PublicKey:    pub,
		Algorithm:    int(authData.Algorithm),
		Counter:      authData.Counter,
		Name:         "Passkey",
	}

	if err := s.passkeyRepo.CreatePasskey(passkey); err != nil {
		return nil, err
	}

	// Generate tokens
	cfg := config.Get()
	accessToken, refreshToken, err := GenerateTokenPair(user.ID, user.Email, user.Name, user.Accesses, cfg)
	if err != nil {
		return nil, errors.New("failed to generate tokens")
	}

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

func (s *AuthService) BeginLoginPasskey() (string, error) {
	challenge := make([]byte, 32)
	if _, err := rand.Read(challenge); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(challenge), nil
}

func (s *AuthService) FinishLoginPasskey(challengeStr string, credentialID, clientDataJSON, authenticatorData, signature []byte, rpID, origin string) (*LoginResponse, error) {
	challenge, err := base64.RawURLEncoding.DecodeString(challengeStr)
	if err != nil {
		return nil, err
	}

	passkey, err := s.passkeyRepo.GetPasskeyByCredentialID(credentialID)
	if err != nil {
		return nil, err
	}
	if passkey == nil {
		return nil, errors.New("passkey not found")
	}

	pub, err := x509.ParsePKIXPublicKey(passkey.PublicKey)
	if err != nil {
		return nil, err
	}

	rp := &webauthn.RelyingParty{
		ID:     rpID,
		Origin: origin,
	}

	assertion, err := rp.VerifyAssertion(pub, webauthn.Algorithm(passkey.Algorithm), challenge, clientDataJSON, authenticatorData, signature)
	if err != nil {
		return nil, err
	}

	// Update counter to prevent replay attacks
	if err := s.passkeyRepo.UpdatePasskeyCounter(credentialID, assertion.Counter); err != nil {
		log.Error().Err(err).Msg("Failed to update passkey counter")
	}

	user, err := s.userRepo.GetUserByID(passkey.UserID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	if !user.IsActive {
		return nil, errors.New("account is deactivated")
	}

	// Generate tokens
	cfg := config.Get()
	accessToken, refreshToken, err := GenerateTokenPair(user.ID, user.Email, user.Name, user.Accesses, cfg)
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

// activeProviders tracks which provider names were successfully initialized.
var activeProviders []string

func Init(cfg *config.Config) {
	initProvidersFromConfig(cfg)
}

func initProvidersFromConfig(cfg *config.Config) {
	providers, names := buildProviders(
		cfg.Auth.Google.ClientID, cfg.Auth.Google.ClientSecret, cfg.Auth.Google.RedirectURL,
		cfg.Auth.Github.ClientID, cfg.Auth.Github.ClientSecret, cfg.Auth.Github.RedirectURL,
		cfg.Auth.Twitter.ClientID, cfg.Auth.Twitter.ClientSecret, cfg.Auth.Twitter.RedirectURL,
	)
	activeProviders = names
	log.Debug().Strs("providers", names).Msg("Using providers")
	goth.UseProviders(providers...)
}

// ReloadProviders reinitializes goth OAuth providers from effective settings.
// Called after admin saves auth settings.
func ReloadProviders(s *models.SystemSettings) {
	providers, names := buildProviders(
		s.GoogleClientID, s.GoogleClientSecret, s.GoogleRedirectURL,
		s.GithubClientID, s.GithubClientSecret, s.GithubRedirectURL,
		s.TwitterClientID, s.TwitterClientSecret, s.TwitterRedirectURL,
	)
	activeProviders = names
	log.Info().
		Strs("providers", names).
		Int("count", len(providers)).
		Msg("Reloaded OAuth providers from settings")
	goth.UseProviders(providers...)
}

// looksLikePlaceholder returns true if the value looks like a template/placeholder
// string rather than a real credential (e.g. "your-github-client-id").
func looksLikePlaceholder(v string) bool {
	v = strings.ToLower(strings.TrimSpace(v))
	return strings.HasPrefix(v, "your-") || strings.HasPrefix(v, "replace-") || strings.HasPrefix(v, "example-") || strings.HasPrefix(v, "xxx") || strings.HasPrefix(v, "todo")
}

func buildProviders(
	googleID, googleSecret, googleRedirect,
	githubID, githubSecret, githubRedirect,
	twitterID, twitterSecret, twitterRedirect string,
) ([]goth.Provider, []string) {
	var providers []goth.Provider
	var names []string

	if googleID != "" && googleSecret != "" && !looksLikePlaceholder(googleID) && !looksLikePlaceholder(googleSecret) {
		p := google.New(googleID, googleSecret, googleRedirect, "email", "profile", "openid")
		p.SetHostedDomain("")
		providers = append(providers, p)
		names = append(names, "google")
	}
	if githubID != "" && githubSecret != "" && !looksLikePlaceholder(githubID) && !looksLikePlaceholder(githubSecret) {
		providers = append(providers, github.New(githubID, githubSecret, githubRedirect, "user:email"))
		names = append(names, "github")
	}
	if twitterID != "" && twitterSecret != "" && !looksLikePlaceholder(twitterID) && !looksLikePlaceholder(twitterSecret) {
		providers = append(providers, twitter.New(twitterID, twitterSecret, twitterRedirect))
		names = append(names, "twitter")
	}

	return providers, names
}

// ConfiguredProviders returns the provider names that were successfully
// initialized with real credentials. This is the authoritative list used
// by the public settings endpoint to show/hide OAuth buttons.
func ConfiguredProviders() []string {
	if activeProviders == nil {
		return []string{}
	}
	return activeProviders
}
