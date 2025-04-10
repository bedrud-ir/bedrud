package handlers

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"bedrud-backend/config"
	"bedrud-backend/internal/auth"
	"bedrud-backend/internal/database"
	"bedrud-backend/internal/models"
	"bedrud-backend/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/markbates/goth/gothic"
	"github.com/rs/zerolog/log"
)

// responseWriter is a minimal adapter that implements http.ResponseWriter
type responseWriter struct {
	ctx     *fiber.Ctx
	headers http.Header
	status  int
}

func newResponseWriter(c *fiber.Ctx) *responseWriter {
	return &responseWriter{
		ctx:     c,
		headers: make(http.Header),
		status:  200,
	}
}

func (r *responseWriter) Header() http.Header {
	return r.headers
}

func (r *responseWriter) Write(b []byte) (int, error) {
	r.ctx.Response().SetBody(b)
	return len(b), nil
}

func (r *responseWriter) WriteHeader(statusCode int) {
	r.status = statusCode
	r.ctx.Status(statusCode)
}

// @Summary Begin OAuth authentication
// @Description Initiates the OAuth authentication process with the specified provider
// @Tags auth
// @Produce json
// @Param provider path string true "Authentication provider (google, github, twitter)"
// @Success 302 {string} string "Redirect to provider's auth page"
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/{provider} [get]
func BeginAuthHandler(c *fiber.Ctx) error {
	provider := c.Params("provider")
	log.Debug().Str("provider", provider).Msg("BeginAuthHandler called with provider")

	// Create a proper http.Request with all necessary fields
	req := &http.Request{
		Method: "GET",
		URL: &url.URL{
			Scheme:   c.Protocol(),
			Host:     c.Hostname(),
			Path:     c.Path(),
			RawQuery: fmt.Sprintf("provider=%s", provider),
		},
		Header:     make(http.Header),
		RemoteAddr: c.IP(),
	}

	// Copy all headers from Fiber request to http.Request
	c.Request().Header.VisitAll(func(key, value []byte) {
		req.Header.Add(string(key), string(value))
	})

	// Create response writer
	w := newResponseWriter(c)

	// Set the provider in the request context
	req = req.WithContext(c.Context())

	// Get the auth URL using gothic
	authURL, err := gothic.GetAuthURL(w, req)
	if err != nil {
		log.Error().Err(err).Str("provider", provider).Msg("Failed to get auth URL")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to begin authentication",
		})
	}

	return c.Redirect(authURL)
}

// @Summary OAuth callback
// @Description Handles the OAuth callback from the authentication provider
// @Tags auth
// @Produce json
// @Param provider path string true "Authentication provider (google, github, twitter)"
// @Success 200 {object} AuthResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/{provider}/callback [get]
func CallbackHandler(c *fiber.Ctx) error {
	provider := c.Params("provider")
	log.Debug().Str("provider", provider).Msg("CallbackHandler called with provider")

	// Create response writer adapter
	w := newResponseWriter(c)

	// Create http.Request from Fiber context
	req := &http.Request{
		Method: "GET",
		URL: &url.URL{
			Path:     fmt.Sprintf("/auth/%s/callback", provider),
			RawQuery: string(c.Request().URI().QueryString()),
		},
	}

	// Set the provider in the request context
	req = req.WithContext(c.Context())
	req.Header = make(http.Header)
	req.Header.Add("Accept", "application/json")

	// Complete auth process
	gothUser, err := gothic.CompleteUserAuth(w, req)
	if err != nil {
		log.Error().Err(err).Str("provider", provider).Msg("Failed to complete auth")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to complete authentication",
		})
	}

	// Create or update user in database
	userRepo := repository.NewUserRepository(database.GetDB())
	dbUser := &models.User{
		ID:        gothUser.UserID,
		Email:     gothUser.Email,
		Name:      gothUser.Name,
		Provider:  gothUser.Provider,
		AvatarURL: gothUser.AvatarURL,
		Accesses:  []string{string(models.AccessUser)}, // Add default access
	}

	if err := userRepo.CreateOrUpdateUser(dbUser); err != nil {
		log.Error().Err(err).Msg("Failed to create/update user")
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
			Error: "Failed to process user data",
		})
	}

	// Generate JWT token
	cfg := config.Get()
	token, err := auth.GenerateToken(
		dbUser.ID,
		dbUser.Email,
		dbUser.Provider,
		dbUser.Accesses, // Add accesses
		cfg,
	)
	if err != nil {
		log.Error().Err(err).Msg("Failed to generate JWT token")
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
			Error: "Failed to generate authentication token",
		})
	}

	// Set token in cookie
	cookie := fiber.Cookie{
		Name:     "jwt",
		Value:    token,
		Expires:  time.Now().Add(time.Duration(cfg.Auth.TokenDuration) * time.Hour),
		HTTPOnly: true,
		Secure:   c.Protocol() == "https",
		SameSite: "Lax",
	}
	c.Cookie(&cookie)

	// If frontend URL is provided in config, redirect there with token
	if cfg.Auth.FrontendURL != "" {
		frontendURL, err := url.Parse(cfg.Auth.FrontendURL)
		if err != nil {
			log.Error().Err(err).Msg("Invalid frontend URL in config")
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
				Error: "Invalid frontend configuration",
			})
		}

		frontendURL.Path = fmt.Sprintf("/auth/callback")
		q := frontendURL.Query()
		q.Set("token", token)
		frontendURL.RawQuery = q.Encode()
		return c.Redirect(frontendURL.String())
	}

	// Otherwise return JSON response
	return c.JSON(AuthResponse{
		User: UserResponse{
			ID:        dbUser.ID,
			Email:     dbUser.Email,
			Name:      dbUser.Name,
			Provider:  dbUser.Provider,
			AvatarURL: dbUser.AvatarURL,
		},
		Token: token,
	})
}
