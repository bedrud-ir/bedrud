package handlers

import (
	"bedrud/internal/auth"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AdminHandler struct {
	settingsRepo    *repository.SettingsRepository
	inviteTokenRepo *repository.InviteTokenRepository
}

func NewAdminHandler(sr *repository.SettingsRepository, itr *repository.InviteTokenRepository) *AdminHandler {
	return &AdminHandler{settingsRepo: sr, inviteTokenRepo: itr}
}

func (h *AdminHandler) GetSettings(c *fiber.Ctx) error {
	s, err := h.settingsRepo.GetSettings()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch settings"})
	}
	return c.JSON(s)
}

// GetPublicSettings returns only the fields relevant to anonymous visitors (no auth required).
func (h *AdminHandler) GetPublicSettings(c *fiber.Ctx) error {
	s, err := h.settingsRepo.GetSettings()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch settings"})
	}
	return c.JSON(fiber.Map{
		"registrationEnabled":   s.RegistrationEnabled,
		"tokenRegistrationOnly": s.TokenRegistrationOnly,
	})
}

func (h *AdminHandler) UpdateSettings(c *fiber.Ctx) error {
	var input models.SystemSettings
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if err := h.settingsRepo.SaveSettings(&input); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save settings"})
	}
	return c.JSON(input)
}

func (h *AdminHandler) ListInviteTokens(c *fiber.Ctx) error {
	tokens, err := h.inviteTokenRepo.List()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch tokens"})
	}
	if tokens == nil {
		tokens = []models.InviteToken{}
	}
	type tokenResponse struct {
		models.InviteToken
		Used bool `json:"used"`
	}
	out := make([]tokenResponse, len(tokens))
	for i, t := range tokens {
		out[i] = tokenResponse{InviteToken: t, Used: t.UsedAt != nil}
	}
	return c.JSON(fiber.Map{"tokens": out})
}

func (h *AdminHandler) CreateInviteToken(c *fiber.Ctx) error {
	claims := c.Locals("user").(*auth.Claims)
	var input struct {
		Email     string `json:"email"`
		ExpiresIn int    `json:"expiresInHours"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if input.ExpiresIn <= 0 {
		input.ExpiresIn = 72
	}

	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate secure token"})
	}
	token := &models.InviteToken{
		ID:        uuid.NewString(),
		Token:     hex.EncodeToString(b),
		Email:     input.Email,
		CreatedBy: claims.UserID,
		ExpiresAt: time.Now().Add(time.Duration(input.ExpiresIn) * time.Hour),
	}
	if err := h.inviteTokenRepo.Create(token); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create token"})
	}
	return c.Status(201).JSON(token)
}

func (h *AdminHandler) DeleteInviteToken(c *fiber.Ctx) error {
	tokenID := c.Params("id")
	if err := h.inviteTokenRepo.Delete(tokenID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete token"})
	}
	return c.JSON(fiber.Map{"status": "success"})
}
