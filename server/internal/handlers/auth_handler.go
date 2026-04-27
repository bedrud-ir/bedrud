package handlers

import (
	"bedrud/config"
	"bedrud/internal/auth"
	"bedrud/internal/repository"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/mail"
	"net/url"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
	"github.com/rs/zerolog/log"
)

const minPasswordLength = 12
const maxPasswordLength = 128

type AuthHandler struct {
	authService     *auth.AuthService
	config          *config.Config
	settingsRepo    *repository.SettingsRepository
	inviteTokenRepo *repository.InviteTokenRepository
}

func NewAuthHandler(authService *auth.AuthService, cfg *config.Config, settingsRepo *repository.SettingsRepository, inviteTokenRepo *repository.InviteTokenRepository) *AuthHandler {
	return &AuthHandler{
		authService:     authService,
		config:          cfg,
		settingsRepo:    settingsRepo,
		inviteTokenRepo: inviteTokenRepo,
	}
}

// setAuthCookies writes access and refresh tokens as HTTP-only cookies so the
// browser sends them on every subsequent request without JS involvement.
func setAuthCookies(c *fiber.Ctx, cfg *config.Config, accessToken, refreshToken string) {
	secure := cfg.Server.EnableTLS || cfg.Server.BehindProxy
	domain := cfg.Server.Domain
	sameSite := "Lax"
	if secure {
		sameSite = "None" // Required for cross-site requests over HTTPS
	}
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		MaxAge:   cfg.Auth.TokenDuration * 3600,
		HTTPOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		Domain:   domain,
		Path:     "/",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		MaxAge:   7 * 24 * 3600, // 7 days, matches GenerateTokenPair
		HTTPOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		Domain:   domain,
		Path:     "/",
	})
}

// clearAuthCookies removes both auth cookies (used on logout).
func clearAuthCookies(c *fiber.Ctx, cfg *config.Config) {
	secure := cfg.Server.EnableTLS || cfg.Server.BehindProxy
	domain := cfg.Server.Domain
	sameSite := "Lax"
	if secure {
		sameSite = "None"
	}
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		MaxAge:   -1,
		HTTPOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		Domain:   domain,
		Path:     "/",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		MaxAge:   -1,
		HTTPOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		Domain:   domain,
		Path:     "/",
	})
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var input struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		Name        string `json:"name"`
		InviteToken string `json:"inviteToken"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input",
		})
	}

	// Validate email format
	if _, err := mail.ParseAddress(input.Email); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid email format",
		})
	}

	// Validate name
	if len(input.Name) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name must be at least 2 characters",
		})
	}

	// Check registration settings
	if h.settingsRepo != nil {
		settings, _ := h.settingsRepo.GetSettings()
		if settings != nil {
			if !settings.RegistrationEnabled {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"error": "Registration is currently disabled",
				})
			}
			if settings.TokenRegistrationOnly {
				if input.InviteToken == "" {
					return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
						"error": "An invite token is required to register",
					})
				}
				tok, err := h.inviteTokenRepo.GetByToken(input.InviteToken)
				if err != nil || tok == nil || tok.UsedAt != nil || time.Now().After(tok.ExpiresAt) {
					return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
						"error": "Invalid or expired invite token",
					})
				}
				c.Locals("pendingInviteToken", tok.ID)
			}
		}
	}

	if len(input.Password) < minPasswordLength {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("Password must be at least %d characters", minPasswordLength),
		})
	}

	if len(input.Password) > maxPasswordLength {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("Password must be at most %d characters", maxPasswordLength),
		})
	}

	user, err := h.authService.Register(input.Email, input.Password, input.Name)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	accessToken, refreshToken, err := auth.GenerateTokenPair(
		user.ID,
		user.Email,
		user.Name,
		user.Accesses, // Add accesses
		h.config,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate tokens",
		})
	}

	err = h.authService.UpdateRefreshToken(user.ID, refreshToken)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save refresh token",
		})
	}

	// Mark invite token as used if one was validated
	if tokenID, ok := c.Locals("pendingInviteToken").(string); ok && tokenID != "" && h.inviteTokenRepo != nil {
		if err := h.inviteTokenRepo.MarkUsed(tokenID, user.ID); err != nil {
			log.Error().Err(err).Str("tokenID", tokenID).Msg("Failed to mark invite token as used")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Registration succeeded but failed to record token usage",
			})
		}
	}

	setAuthCookies(c, h.config, accessToken, refreshToken)
	return c.JSON(auth.LoginResponse{
		User: user,
		Token: auth.TokenPair{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input",
		})
	}

	if input.Email == "" || input.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email and password are required",
		})
	}

	if len(input.Password) > maxPasswordLength {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("Password must be at most %d characters", maxPasswordLength),
		})
	}

	loginResponse, err := h.authService.Login(input.Email, input.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	setAuthCookies(c, h.config, loginResponse.Token.AccessToken, loginResponse.Token.RefreshToken)
	return c.JSON(loginResponse)
}

func (h *AuthHandler) GuestLogin(c *fiber.Ctx) error {
	var input struct {
		Name string `json:"name"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input",
		})
	}

	if input.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name is required",
		})
	}

	loginResponse, err := h.authService.GuestLogin(input.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create guest user",
		})
	}

	setAuthCookies(c, h.config, loginResponse.Token.AccessToken, loginResponse.Token.RefreshToken)
	return c.JSON(loginResponse)
}

// RefreshRequest represents the refresh token request payload
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" example:"eyJhbGciOiJ..."`
}

// RefreshToken handles token refresh requests
// @Summary Refresh access token
// @Description Get new access token using refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RefreshRequest true "Refresh token request"
// @Success 200 {object} auth.TokenResponse
// @Failure 400 {object} auth.ErrorResponse
// @Failure 401 {object} auth.ErrorResponse
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var input RefreshRequest
	c.BodyParser(&input) //nolint:errcheck — fallback to cookie below

	// Fallback to HTTP-only cookie when body is empty (e.g. cookie-only clients)
	if input.RefreshToken == "" {
		input.RefreshToken = c.Cookies("refresh_token")
	}

	if input.RefreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No refresh token provided",
		})
	}

	// Validate the refresh token
	claims, err := h.authService.ValidateRefreshToken(input.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid or expired refresh token",
		})
	}

	// Block the old refresh token to prevent replay
	if err := h.authService.BlockRefreshToken(claims.UserID, input.RefreshToken); err != nil {
		log.Error().Err(err).Msg("Failed to block old refresh token during rotation")
	}

	// Generate new token pair
	accessToken, refreshToken, err := auth.GenerateTokenPair(
		claims.UserID,
		claims.Email,
		claims.Name,
		claims.Accesses,
		h.config,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate tokens",
		})
	}

	// Update refresh token in database
	if err := h.authService.UpdateRefreshToken(claims.UserID, refreshToken); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update refresh token",
		})
	}

	setAuthCookies(c, h.config, accessToken, refreshToken)
	return c.JSON(fiber.Map{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	claims := c.Locals("user").(*auth.Claims)
	user, err := h.authService.GetUserByID(claims.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user",
		})
	}

	return c.JSON(user)
}

func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	claims := c.Locals("user").(*auth.Claims)
	var input struct {
		Name string `json:"name"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}
	if len(input.Name) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Name must be at least 2 characters"})
	}
	user, err := h.authService.UpdateProfile(claims.UserID, input.Name)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(user)
}

func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	claims := c.Locals("user").(*auth.Claims)
	var input struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}
	if len(input.NewPassword) < minPasswordLength {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("New password must be at least %d characters", minPasswordLength)})
	}
	if len(input.NewPassword) > maxPasswordLength {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("New password must be at most %d characters", maxPasswordLength)})
	}
	if err := h.authService.ChangePassword(claims.UserID, input.CurrentPassword, input.NewPassword); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Password updated successfully"})
}

// LogoutRequest represents the logout request payload
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	var input LogoutRequest
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input - expected JSON with refresh_token field",
		})
	}

	// Get user from context (set by auth middleware)
	claims := c.Locals("user").(*auth.Claims)

	// Fallback to cookie when body omits the token
	if input.RefreshToken == "" {
		input.RefreshToken = c.Cookies("refresh_token")
	}

	// Extract the raw access token from Authorization header or cookie
	accessToken := strings.TrimPrefix(c.Get("Authorization"), "Bearer ")
	if accessToken == "" {
		accessToken = c.Cookies("access_token")
	}

	// Revoke access token and block refresh token (best-effort; clear cookies regardless)
	if input.RefreshToken != "" {
		if err := h.authService.Logout(claims.UserID, input.RefreshToken, accessToken); err != nil {
			log.Error().Err(err).Msg("Failed to invalidate tokens on logout")
		}
	} else if accessToken != "" {
		// No refresh token provided — at least revoke the access token
		auth.RevokeAccessToken(accessToken, h.config)
	}

	clearAuthCookies(c, h.config)
	return c.JSON(fiber.Map{
		"message": "Successfully logged out",
	})
}

// Passkey handlers

func (h *AuthHandler) getSession(c *fiber.Ctx) (*sessions.Session, *http.Request, error) {
	req := &http.Request{
		Method: "GET",
		URL: &url.URL{
			Scheme: c.Protocol(),
			Host:   string(c.Context().Host()),
			Path:   c.Path(),
		},
		Header:     make(http.Header),
		RemoteAddr: c.IP(),
	}
	c.Request().Header.VisitAll(func(key, value []byte) {
		req.Header.Add(string(key), string(value))
	})
	sess, err := gothic.Store.Get(req, gothic.SessionName)
	return sess, req, err
}

func (h *AuthHandler) getRPID(c *fiber.Ctx) string {
	rpid := h.config.Server.Domain
	if rpid == "" {
		rpid = c.Hostname()
	}
	return rpid
}

func (h *AuthHandler) getOrigin(c *fiber.Ctx) string {
	origin := h.config.Auth.FrontendURL
	if origin == "" {
		host := string(c.Context().Host())
		proto := c.Protocol()
		// Try to respect X-Forwarded-Proto if available
		if forwardedProto := c.Get("X-Forwarded-Proto"); forwardedProto != "" {
			proto = forwardedProto
		}
		origin = proto + "://" + host
	}
	return origin
}

func (h *AuthHandler) saveSession(c *fiber.Ctx, sess *sessions.Session, req *http.Request) error {
	w := newResponseWriter(c)
	if err := sess.Save(req, w); err != nil {
		return err
	}
	// Copy headers from w.Header() to c.Response().Header
	for key, values := range w.Header() {
		for _, value := range values {
			c.Response().Header.Add(key, value)
		}
	}
	return nil
}

func (h *AuthHandler) PasskeyRegisterBegin(c *fiber.Ctx) error {
	claims := c.Locals("user").(*auth.Claims)
	challenge, err := h.authService.BeginRegisterPasskey(claims.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	sess, req, err := h.getSession(c)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Session unavailable"})
	}
	sess.Values["passkey_register_challenge"] = challenge
	if err := h.saveSession(c, sess, req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save session"})
	}

	return c.JSON(fiber.Map{
		"challenge": challenge,
		"user": fiber.Map{
			"id":          base64.RawURLEncoding.EncodeToString([]byte(claims.UserID)),
			"name":        claims.Email,
			"displayName": claims.Name,
		},
		"rp": fiber.Map{
			"id":   h.getRPID(c),
			"name": h.getRPID(c),
		},
	})
}

func (h *AuthHandler) PasskeyRegisterFinish(c *fiber.Ctx) error {
	claims := c.Locals("user").(*auth.Claims)
	var input struct {
		ClientDataJSON    string `json:"clientDataJSON"`
		AttestationObject string `json:"attestationObject"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	sess, req, err := h.getSession(c)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Session unavailable"})
	}
	challenge, ok := sess.Values["passkey_register_challenge"].(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Challenge not found in session"})
	}

	clientData, err := base64.RawURLEncoding.DecodeString(input.ClientDataJSON)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid clientDataJSON encoding"})
	}
	attestation, err := base64.RawURLEncoding.DecodeString(input.AttestationObject)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid attestationObject encoding"})
	}

	err = h.authService.FinishRegisterPasskey(claims.UserID, challenge, clientData, attestation, h.getRPID(c), h.getOrigin(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	delete(sess.Values, "passkey_register_challenge")
	h.saveSession(c, sess, req)

	return c.JSON(fiber.Map{"message": "Passkey registered successfully"})
}

func (h *AuthHandler) PasskeyLoginBegin(c *fiber.Ctx) error {
	challenge, err := h.authService.BeginLoginPasskey()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	sess, req, err := h.getSession(c)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Session unavailable"})
	}
	sess.Values["passkey_login_challenge"] = challenge
	if err := h.saveSession(c, sess, req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save session"})
	}

	return c.JSON(fiber.Map{
		"challenge": challenge,
		"rpId":      h.getRPID(c),
	})
}

func (h *AuthHandler) PasskeyLoginFinish(c *fiber.Ctx) error {
	var input struct {
		CredentialID      string `json:"credentialId"`
		ClientDataJSON    string `json:"clientDataJSON"`
		AuthenticatorData string `json:"authenticatorData"`
		Signature         string `json:"signature"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	sess, req, err := h.getSession(c)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Session unavailable"})
	}
	challenge, ok := sess.Values["passkey_login_challenge"].(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Challenge not found in session"})
	}

	credID, err := base64.RawURLEncoding.DecodeString(input.CredentialID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid credentialId encoding"})
	}
	clientData, err := base64.RawURLEncoding.DecodeString(input.ClientDataJSON)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid clientDataJSON encoding"})
	}
	authData, err := base64.RawURLEncoding.DecodeString(input.AuthenticatorData)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid authenticatorData encoding"})
	}
	sig, err := base64.RawURLEncoding.DecodeString(input.Signature)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid signature encoding"})
	}

	loginResponse, err := h.authService.FinishLoginPasskey(challenge, credID, clientData, authData, sig, h.getRPID(c), h.getOrigin(c))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	delete(sess.Values, "passkey_login_challenge")
	h.saveSession(c, sess, req)

	setAuthCookies(c, h.config, loginResponse.Token.AccessToken, loginResponse.Token.RefreshToken)
	return c.JSON(loginResponse)
}

func (h *AuthHandler) PasskeySignupBegin(c *fiber.Ctx) error {
	var input struct {
		Email       string `json:"email"`
		Name        string `json:"name"`
		InviteToken string `json:"inviteToken"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	if input.Email == "" || input.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email and Name are required"})
	}

	// Check registration settings (mirrors Register())
	if h.settingsRepo != nil {
		settings, _ := h.settingsRepo.GetSettings()
		if settings != nil {
			if !settings.RegistrationEnabled {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Registration is currently disabled"})
			}
			if settings.TokenRegistrationOnly {
				if input.InviteToken == "" {
					return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "An invite token is required to register"})
				}
				tok, err := h.inviteTokenRepo.GetByToken(input.InviteToken)
				if err != nil || tok == nil || tok.UsedAt != nil || time.Now().After(tok.ExpiresAt) {
					return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Invalid or expired invite token"})
				}
				c.Locals("pendingPasskeyInviteToken", tok.ID)
			}
		}
	}

	// Check if user already exists
	existing, _ := h.authService.GetUserByEmail(input.Email)
	if existing != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email already registered"})
	}

	userID := uuid.New().String()
	challenge, err := h.authService.BeginRegisterPasskey(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	sess, req, err := h.getSession(c)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Session unavailable"})
	}
	sess.Values["signup_challenge"] = challenge
	sess.Values["signup_email"] = input.Email
	sess.Values["signup_name"] = input.Name
	sess.Values["signup_user_id"] = userID
	if tokenID, ok := c.Locals("pendingPasskeyInviteToken").(string); ok && tokenID != "" {
		sess.Values["signup_invite_token"] = tokenID
	}
	if err := h.saveSession(c, sess, req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save session"})
	}

	return c.JSON(fiber.Map{
		"challenge": challenge,
		"user": fiber.Map{
			"id":          base64.RawURLEncoding.EncodeToString([]byte(userID)),
			"name":        input.Email,
			"displayName": input.Name,
		},
		"rp": fiber.Map{
			"id":   h.getRPID(c),
			"name": h.getRPID(c),
		},
	})
}

func (h *AuthHandler) PasskeySignupFinish(c *fiber.Ctx) error {
	var input struct {
		ClientDataJSON    string `json:"clientDataJSON"`
		AttestationObject string `json:"attestationObject"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	sess, req, err := h.getSession(c)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Session unavailable"})
	}
	challenge, ok := sess.Values["signup_challenge"].(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Signup session expired or not found"})
	}

	email, ok2 := sess.Values["signup_email"].(string)
	name, ok3 := sess.Values["signup_name"].(string)
	userID, ok4 := sess.Values["signup_user_id"].(string)
	if !ok2 || !ok3 || !ok4 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Signup session expired or not found"})
	}

	clientData, err := base64.RawURLEncoding.DecodeString(input.ClientDataJSON)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid clientDataJSON encoding"})
	}
	attestation, err := base64.RawURLEncoding.DecodeString(input.AttestationObject)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid attestationObject encoding"})
	}

	loginResponse, err := h.authService.FinishSignupPasskey(userID, email, name, challenge, clientData, attestation, h.getRPID(c), h.getOrigin(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Mark invite token used if passkey signup required one
	if tokenID, ok := sess.Values["signup_invite_token"].(string); ok && tokenID != "" && h.inviteTokenRepo != nil {
		if err := h.inviteTokenRepo.MarkUsed(tokenID, loginResponse.User.ID); err != nil {
			log.Error().Err(err).Str("tokenID", tokenID).Msg("Failed to mark passkey invite token as used")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Signup succeeded but failed to record token usage",
			})
		}
	}

	delete(sess.Values, "signup_challenge")
	delete(sess.Values, "signup_email")
	delete(sess.Values, "signup_name")
	delete(sess.Values, "signup_user_id")
	delete(sess.Values, "signup_invite_token")
	h.saveSession(c, sess, req)

	setAuthCookies(c, h.config, loginResponse.Token.AccessToken, loginResponse.Token.RefreshToken)
	return c.JSON(loginResponse)
}
