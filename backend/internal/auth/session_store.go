package auth

import (
	"net/http"
	"net/url"

	"github.com/gofiber/fiber/v2"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
)

// InitializeSessionStore sets up the gothic session store
func InitializeSessionStore(secret string) {
	store := sessions.NewCookieStore([]byte(secret))
	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 30,
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
	}
	gothic.Store = store
}

// SetProviderToSession adds the provider to the gothic session
func SetProviderToSession(c *fiber.Ctx, provider string) error {
	// Create a complete http.Request from Fiber context
	req := &http.Request{
		Method: "GET",
		URL: &url.URL{
			Scheme: c.Protocol(),
			Host:   c.Hostname(),
			Path:   c.Path(),
		},
		Header:     make(http.Header),
		RemoteAddr: c.IP(),
	}

	// Copy headers from Fiber request
	c.Request().Header.VisitAll(func(key, value []byte) {
		req.Header.Add(string(key), string(value))
	})

	session, err := gothic.Store.Get(req, gothic.SessionName)
	if err != nil {
		return err
	}

	session.Values["provider"] = provider
	return session.Save(req, nil)
}
