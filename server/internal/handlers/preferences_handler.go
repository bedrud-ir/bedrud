package handlers

import (
	"bedrud/internal/auth"
	"bedrud/internal/repository"
	"encoding/json"

	"github.com/gofiber/fiber/v2"
)

type PreferencesHandler struct {
	prefsRepo *repository.UserPreferencesRepository
}

func NewPreferencesHandler(repo *repository.UserPreferencesRepository) *PreferencesHandler {
	return &PreferencesHandler{prefsRepo: repo}
}

// GetPreferences handles GET /api/auth/preferences.
// Returns the stored JSON blob or an empty object if none exists yet.
func (h *PreferencesHandler) GetPreferences(c *fiber.Ctx) error {
	claims := c.Locals("user").(*auth.Claims)

	prefs, err := h.prefsRepo.GetByUserID(claims.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get preferences"})
	}
	if prefs == nil {
		return c.JSON(fiber.Map{"preferencesJson": "{}"})
	}
	return c.JSON(fiber.Map{"preferencesJson": prefs.PreferencesJSON})
}

// UpdatePreferences handles PUT /api/auth/preferences.
// Accepts { "preferencesJson": "<valid-json-string>" } and upserts it.
func (h *PreferencesHandler) UpdatePreferences(c *fiber.Ctx) error {
	claims := c.Locals("user").(*auth.Claims)

	var input struct {
		PreferencesJSON string `json:"preferencesJson"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}
	if len(input.PreferencesJSON) > 4*1024 {
		return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{"error": "preferencesJson too large (max 4 KB)"})
	}
	if !json.Valid([]byte(input.PreferencesJSON)) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "preferencesJson must be valid JSON"})
	}

	if err := h.prefsRepo.Upsert(claims.UserID, input.PreferencesJSON); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save preferences"})
	}
	return c.JSON(fiber.Map{"message": "Preferences updated"})
}
