package handlers

import (
	"bedrud/internal/auth"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"crypto/rand"
	"encoding/hex"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
)

const maskedSecret = "••••••••"

type AdminHandler struct {
	settingsRepo    *repository.SettingsRepository
	inviteTokenRepo *repository.InviteTokenRepository
}

func NewAdminHandler(sr *repository.SettingsRepository, itr *repository.InviteTokenRepository) *AdminHandler {
	return &AdminHandler{settingsRepo: sr, inviteTokenRepo: itr}
}

func (h *AdminHandler) GetSettings(c *fiber.Ctx) error {
	s, err := h.settingsRepo.GetEffectiveSettings()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch settings"})
	}
	return c.JSON(maskSettings(s))
}

// GetPublicSettings returns only the fields relevant to anonymous visitors (no auth required).
func (h *AdminHandler) GetPublicSettings(c *fiber.Ctx) error {
	s, err := h.settingsRepo.GetEffectiveSettings()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch settings"})
	}
	return c.JSON(fiber.Map{
		"registrationEnabled":   s.RegistrationEnabled,
		"tokenRegistrationOnly": s.TokenRegistrationOnly,
		"passkeysEnabled":       s.PasskeysEnabled,
		"oauthProviders":        auth.ConfiguredProviders(),
	})
}

func (h *AdminHandler) UpdateSettings(c *fiber.Ctx) error {
	// Get existing settings first (to preserve secrets when client sends masked values)
	existing, err := h.settingsRepo.GetSettings()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch current settings"})
	}

	var input models.SystemSettings
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Unmask: if the client sent masked placeholders, keep the existing value
	unmaskSecrets(&input, existing)

	input.ID = 1
	if err := h.settingsRepo.SaveSettings(&input); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save settings"})
	}

	// Reload runtime-configurable subsystems
	effective, err := h.settingsRepo.GetEffectiveSettings()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Settings saved but failed to reload"})
	}
	auth.ReloadProviders(effective)

	log.Info().Msg("Admin settings updated and providers reloaded")
	return c.JSON(maskSettings(effective))
}

// unmaskSecrets preserves existing secret values when the client sends the
// masked placeholder "••••••••" instead of a real value.
func unmaskSecrets(input, existing *models.SystemSettings) {
	type pair struct {
		incoming *string
		current  string
	}
	secrets := []pair{
		{&input.GoogleClientSecret, existing.GoogleClientSecret},
		{&input.GithubClientSecret, existing.GithubClientSecret},
		{&input.TwitterClientSecret, existing.TwitterClientSecret},
		{&input.JWTSecret, existing.JWTSecret},
		{&input.SessionSecret, existing.SessionSecret},
		{&input.LiveKitAPISecret, existing.LiveKitAPISecret},
		{&input.ChatUploadS3SecretKey, existing.ChatUploadS3SecretKey},
	}
	for _, s := range secrets {
		if strings.TrimSpace(*s.incoming) == maskedSecret || strings.TrimSpace(*s.incoming) == "" {
			*s.incoming = s.current
		}
	}
}

// maskSettings returns a copy with secret fields replaced by a placeholder.
func maskSettings(s *models.SystemSettings) *models.SystemSettings {
	cp := *s
	if cp.GoogleClientSecret != "" {
		cp.GoogleClientSecret = maskedSecret
	}
	if cp.GithubClientSecret != "" {
		cp.GithubClientSecret = maskedSecret
	}
	if cp.TwitterClientSecret != "" {
		cp.TwitterClientSecret = maskedSecret
	}
	if cp.JWTSecret != "" {
		cp.JWTSecret = maskedSecret
	}
	if cp.SessionSecret != "" {
		cp.SessionSecret = maskedSecret
	}
	if cp.LiveKitAPISecret != "" {
		cp.LiveKitAPISecret = maskedSecret
	}
	if cp.ChatUploadS3SecretKey != "" {
		cp.ChatUploadS3SecretKey = maskedSecret
	}
	return &cp
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
	for i := range tokens {
		out[i] = tokenResponse{InviteToken: tokens[i], Used: tokens[i].UsedAt != nil}
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
