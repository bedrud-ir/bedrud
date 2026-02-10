package handlers

import (
	"bedrud/config"
	"bedrud/internal/auth"
	"encoding/base64"
	"net/http"
	"net/url"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
)

type AuthHandler struct {
	authService *auth.AuthService
	config      *config.Config
}

func NewAuthHandler(authService *auth.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		config:      cfg,
	}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input",
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

	return c.JSON(fiber.Map{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
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

	loginResponse, err := h.authService.Login(input.Email, input.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	// Check if user is active
	if !loginResponse.User.IsActive {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Account is deactivated",
		})
	}

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
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input - expected JSON with refresh_token field",
		})
	}

	// Validate the refresh token
	claims, err := h.authService.ValidateRefreshToken(input.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid or expired refresh token",
		})
	}

	// Generate new token pair
	accessToken, refreshToken, err := auth.GenerateTokenPair(
		claims.UserID,
		claims.Email,
		claims.Name,
		claims.Accesses, // Add accesses from claims
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

	// Block refresh token
	err := h.authService.BlockRefreshToken(claims.UserID, input.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to logout",
		})
	}

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

	sess, req, _ := h.getSession(c)
	sess.Values["passkey_challenge"] = challenge
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
			"name": "Bedrud",
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

	sess, req, _ := h.getSession(c)
	challenge, ok := sess.Values["passkey_challenge"].(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Challenge not found in session"})
	}

	clientData, _ := base64.RawURLEncoding.DecodeString(input.ClientDataJSON)
	attestation, _ := base64.RawURLEncoding.DecodeString(input.AttestationObject)

	err := h.authService.FinishRegisterPasskey(claims.UserID, challenge, clientData, attestation, h.getRPID(c), h.getOrigin(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	delete(sess.Values, "passkey_challenge")
	h.saveSession(c, sess, req)

	return c.JSON(fiber.Map{"message": "Passkey registered successfully"})
}

func (h *AuthHandler) PasskeyLoginBegin(c *fiber.Ctx) error {
	challenge, err := h.authService.BeginLoginPasskey()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	sess, req, _ := h.getSession(c)
	sess.Values["passkey_challenge"] = challenge
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

	sess, req, _ := h.getSession(c)
	challenge, ok := sess.Values["passkey_challenge"].(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Challenge not found in session"})
	}

	credID, _ := base64.RawURLEncoding.DecodeString(input.CredentialID)
	clientData, _ := base64.RawURLEncoding.DecodeString(input.ClientDataJSON)
	authData, _ := base64.RawURLEncoding.DecodeString(input.AuthenticatorData)
	sig, _ := base64.RawURLEncoding.DecodeString(input.Signature)

	loginResponse, err := h.authService.FinishLoginPasskey(challenge, credID, clientData, authData, sig, h.getRPID(c), h.getOrigin(c))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	delete(sess.Values, "passkey_challenge")
	h.saveSession(c, sess, req)

	return c.JSON(loginResponse)
}

func (h *AuthHandler) PasskeySignupBegin(c *fiber.Ctx) error {
	var input struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	if input.Email == "" || input.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email and Name are required"})
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

	sess, req, _ := h.getSession(c)
	sess.Values["signup_challenge"] = challenge
	sess.Values["signup_email"] = input.Email
	sess.Values["signup_name"] = input.Name
	sess.Values["signup_user_id"] = userID
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
			"name": "Bedrud",
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

	sess, req, _ := h.getSession(c)
	challenge, ok := sess.Values["signup_challenge"].(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Signup session expired or not found"})
	}

	email := sess.Values["signup_email"].(string)
	name := sess.Values["signup_name"].(string)
	userID := sess.Values["signup_user_id"].(string)

	clientData, _ := base64.RawURLEncoding.DecodeString(input.ClientDataJSON)
	attestation, _ := base64.RawURLEncoding.DecodeString(input.AttestationObject)

	loginResponse, err := h.authService.FinishSignupPasskey(userID, email, name, challenge, clientData, attestation, h.getRPID(c), h.getOrigin(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	delete(sess.Values, "signup_challenge")
	delete(sess.Values, "signup_email")
	delete(sess.Values, "signup_name")
	delete(sess.Values, "signup_user_id")
	h.saveSession(c, sess, req)

	return c.JSON(loginResponse)
}
