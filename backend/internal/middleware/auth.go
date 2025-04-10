package middleware

import (
	"bedrud-backend/config"
	"bedrud-backend/internal/auth"
	"bedrud-backend/internal/models" // Add this import
	"strings"

	"github.com/gofiber/fiber/v2"
)

// Protected middleware
func Protected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		// Handle both cases: with and without "Bearer " prefix
		token := authHeader
		if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
			token = authHeader[7:] // Remove "Bearer " prefix
		}

		claims, err := auth.ValidateToken(token, config.Get())
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token",
			})
		}

		// Add claims to context for use in protected routes
		c.Locals("user", claims)
		return c.Next()
	}
}

// RequireAccess middleware checks for specific access level
func RequireAccess(requiredAccess models.AccessLevel) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := c.Locals("user").(*auth.Claims)

		for _, access := range claims.Accesses {
			if access == string(requiredAccess) {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient access rights",
		})
	}
}

// Example usage:
// app.Get("/admin", middleware.Protected(), middleware.RequireAccess(models.AccessAdmin), adminHandler)
