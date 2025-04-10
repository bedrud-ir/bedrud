package handlers

import (
	"bedrud-backend/config"
	"bedrud-backend/internal/auth"

	"github.com/gofiber/fiber/v2"
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
