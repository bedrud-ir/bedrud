package handlers

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"bedrud/config"
	"bedrud/internal/auth"
	"bedrud/internal/database"
	"bedrud/internal/models"
	"bedrud/internal/repository"

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
	// Ensure headers from r.headers are copied to the Fiber response
	// This is important for Set-Cookie headers set by gothic
	for key, values := range r.headers {
		for _, value := range values {
			// Use Add for headers like Set-Cookie that can appear multiple times
			r.ctx.Response().Header.Add(key, value)
		}
	}
	r.ctx.Status(statusCode) // This sends the headers and status
}

// @Summary Begin OAuth authentication
// @Description Initiates the OAuth authentication process with the specified provider
// @Tags auth
// @Produce json
// @Param provider path string true "Authentication provider (google, github, twitter)"
// @Success 307 "Redirects to the authentication provider"
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/{provider}/login [get]
func BeginAuthHandler(c *fiber.Ctx) error {
	provider := c.Params("provider")
	log.Debug().Str("provider", provider).Msg("BeginAuthHandler called with provider")

	// Create a proper http.Request with all necessary fields.
	// Gothic needs to be able to get the provider name from the URL query or context.
	ctx := context.WithValue(c.Context(), gothic.ProviderParamKey, provider) // Use c.Context() for Fiber context values
	// The request URL passed to gothic should be the URL that the user originally hit to start the auth flow.
	originalReqURL := &url.URL{
		Scheme:   c.Protocol(),
		Host:     string(c.Context().Host()),              // Use c.Context().Host() for full host:port
		Path:     c.Path(),                                // The path of this handler
		RawQuery: string(c.Request().URI().QueryString()), // Preserve original query string
	}

	// Create a new http.Request for gothic
	httpReq, err := http.NewRequestWithContext(ctx, "GET", originalReqURL.String(), nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create http.Request for gothic.GetAuthURL")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to begin authentication",
		})
	}

	// Copy headers from Fiber request to the new http.Request
	// This ensures gothic can see cookies or other relevant headers if needed.
	c.Request().Header.VisitAll(func(key, value []byte) {
		httpReq.Header.Add(string(key), string(value))
	})

	// Create response writer adapter for gothic
	w := newResponseWriter(c)

	// Get the auth URL using gothic.
	// gothic.GetAuthURL will often set a session cookie via w.Header().Set("Set-Cookie", ...)
	// These headers will be picked up by our responseWriter.WriteHeader if gothic calls it,
	// or by our manual copy loop below.
	authURL, err := gothic.GetAuthURL(w, httpReq)
	if err != nil {
		// Even on error, gothic might have set headers (e.g., session cookies).
		// Ensure these headers from our adapter `w` are copied to the Fiber response.
		for keyH, valuesH := range w.Header() {
			for _, valueH := range valuesH {
				c.Response().Header.Add(keyH, valueH)
			}
		}
		log.Error().Err(err).Str("provider", provider).Msg("Failed to get auth URL")
		statusToReturn := w.status
		if statusToReturn == 0 || statusToReturn == http.StatusOK { // If gothic didn't set an error status
			statusToReturn = fiber.StatusInternalServerError
		}
		return c.Status(statusToReturn).JSON(fiber.Map{
			"error": "Failed to begin authentication",
		})
	}

	// Crucially, copy headers set by gothic (e.g., Set-Cookie for session state)
	// from our adapter `w` to the actual Fiber response *before* redirecting.
	// gothic.GetAuthURL itself does not call WriteHeader on `w`, it only populates `w.Header()`.
	for keyH, valuesH := range w.Header() {
		for _, valueH := range valuesH {
			c.Response().Header.Add(keyH, valueH)
		}
	}

	// Redirect to the authURL
	// The http.StatusTemporaryRedirect (307) is used to indicate that the resource has
	// temporarily moved and the client should resubmit the request to the new URI,
	// maintaining the original request method.
	return c.Redirect(authURL, http.StatusTemporaryRedirect)
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

	// Create http.Request for gothic.CompleteUserAuth. This request needs:
	// 1. The provider name (set in context).
	// 2. Query parameters from the OAuth provider's redirect (e.g., `code`, `state`).
	// 3. Cookies from the original request (containing session state set by BeginAuthHandler).

	ctx := context.WithValue(c.Context(), gothic.ProviderParamKey, provider)

	// Construct the full callback URL including query parameters from the incoming request.
	// c.Request().URI().String() provides the path and query string part.
	fullCallbackURL := fmt.Sprintf("%s://%s%s", c.Protocol(), string(c.Context().Host()), c.Request().URI().String())
	parsedCallbackURL, err := url.Parse(fullCallbackURL)
	if err != nil {
		log.Error().Err(err).Msg("Failed to parse callback URL for gothic.CompleteUserAuth")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error processing callback URL",
		})
	}

	httpReq, err := http.NewRequestWithContext(ctx, "GET", parsedCallbackURL.String(), nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create http.Request for gothic.CompleteUserAuth")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to complete authentication",
		})
	}

	// Copy all headers from the incoming Fiber request to the http.Request.
	// This is CRUCIAL for `gothic` to find the session cookie set in BeginAuthHandler.
	c.Request().Header.VisitAll(func(key, value []byte) {
		httpReq.Header.Add(string(key), string(value))
	})

	// Complete auth process. gothic.CompleteUserAuth may read cookies from httpReq.Header
	// and may set/clear cookies via w.Header().
	gothUser, err := gothic.CompleteUserAuth(w, httpReq)
	if err != nil {
		// Even on error, gothic might have modified headers (e.g., clearing session cookies).
		// Ensure these headers from our adapter `w` are copied to the Fiber response.
		for keyH, valuesH := range w.Header() {
			for _, valueH := range valuesH {
				c.Response().Header.Add(keyH, valueH)
			}
		}
		log.Error().Err(err).Str("provider", provider).Msg("Failed to complete auth")
		statusToReturn := w.status
		if statusToReturn == 0 || statusToReturn == http.StatusOK { // If gothic didn't set an error status
			statusToReturn = fiber.StatusInternalServerError
		}
		return c.Status(statusToReturn).JSON(fiber.Map{
			"error": "Failed to complete authentication",
		})
	}

	// If CompleteUserAuth succeeded, it might have modified the session (e.g., cleared state).
	// Ensure any headers set by gothic on `w` (like clearing cookies) are propagated.
	for keyH, valuesH := range w.Header() {
		for _, valueH := range valuesH {
			c.Response().Header.Add(keyH, valueH)
		}
	}

	log.Debug().Str("provider", provider).Msg("Auth completed successfully")

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
		dbUser.Name,
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

	// frontend url debug print
	log.Debug().Str("frontend url", cfg.Auth.FrontendURL).Msg("frontend url")

	// If frontend URL is provided in config, redirect there with token
	if cfg.Auth.FrontendURL != "" {
		frontendURL, err := url.Parse(cfg.Auth.FrontendURL)
		if err != nil {
			log.Error().Err(err).Msg("Invalid frontend URL in config")
			return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{
				Error: "Invalid frontend configuration",
			})
		}

		frontendURL.Path = "/auth/callback"
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
