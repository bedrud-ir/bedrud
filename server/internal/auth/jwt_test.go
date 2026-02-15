package auth

import (
	"bedrud/config"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func testConfig() *config.Config {
	return &config.Config{
		Auth: config.AuthConfig{
			JWTSecret:     "test-secret-key-for-testing-only",
			TokenDuration: 1, // 1 hour
		},
	}
}

// --- GenerateToken Tests ---

func TestGenerateToken_Success(t *testing.T) {
	cfg := testConfig()
	token, err := GenerateToken("user-123", "test@example.com", "Test User", "local", []string{"user"}, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
}

func TestGenerateToken_WithMultipleAccesses(t *testing.T) {
	cfg := testConfig()
	token, err := GenerateToken("user-123", "admin@example.com", "Admin", "local", []string{"admin", "user"}, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
}

func TestGenerateToken_EmptySecret(t *testing.T) {
	cfg := &config.Config{
		Auth: config.AuthConfig{
			JWTSecret:     "",
			TokenDuration: 1,
		},
	}
	// Should still generate (empty secret is valid for HS256, just insecure)
	token, err := GenerateToken("user-123", "test@example.com", "Test", "local", []string{"user"}, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
}

// --- ValidateToken Tests ---

func TestValidateToken_Valid(t *testing.T) {
	cfg := testConfig()
	token, _ := GenerateToken("user-123", "test@example.com", "Test User", "local", []string{"user", "admin"}, cfg)

	claims, err := ValidateToken(token, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if claims.UserID != "user-123" {
		t.Fatalf("expected UserID 'user-123', got '%s'", claims.UserID)
	}
	if claims.Email != "test@example.com" {
		t.Fatalf("expected Email 'test@example.com', got '%s'", claims.Email)
	}
	if claims.Name != "Test User" {
		t.Fatalf("expected Name 'Test User', got '%s'", claims.Name)
	}
	if claims.Provider != "local" {
		t.Fatalf("expected Provider 'local', got '%s'", claims.Provider)
	}
	if len(claims.Accesses) != 2 || claims.Accesses[0] != "user" || claims.Accesses[1] != "admin" {
		t.Fatalf("unexpected accesses: %v", claims.Accesses)
	}
}

func TestValidateToken_InvalidSignature(t *testing.T) {
	cfg := testConfig()
	token, _ := GenerateToken("user-123", "test@example.com", "Test User", "local", []string{"user"}, cfg)

	// Use a different secret for validation
	wrongCfg := &config.Config{
		Auth: config.AuthConfig{
			JWTSecret: "wrong-secret",
		},
	}

	_, err := ValidateToken(token, wrongCfg)
	if err == nil {
		t.Fatal("expected error for invalid signature")
	}
}

func TestValidateToken_ExpiredToken(t *testing.T) {
	cfg := testConfig()

	// Create a token that expired 1 hour ago
	claims := &Claims{
		UserID:   "user-123",
		Email:    "test@example.com",
		Name:     "Test",
		Provider: "local",
		Accesses: []string{"user"},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(cfg.Auth.JWTSecret))

	_, err := ValidateToken(tokenString, cfg)
	if err == nil {
		t.Fatal("expected error for expired token")
	}
}

func TestValidateToken_MalformedToken(t *testing.T) {
	cfg := testConfig()
	_, err := ValidateToken("not.a.valid.token", cfg)
	if err == nil {
		t.Fatal("expected error for malformed token")
	}
}

func TestValidateToken_EmptyToken(t *testing.T) {
	cfg := testConfig()
	_, err := ValidateToken("", cfg)
	if err == nil {
		t.Fatal("expected error for empty token")
	}
}

func TestValidateToken_WrongSigningMethod(t *testing.T) {
	cfg := testConfig()

	// Create a token with "none" signing method (unsigned)
	claims := &Claims{
		UserID: "user-123",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodNone, claims)
	tokenString, _ := token.SignedString(jwt.UnsafeAllowNoneSignatureType)

	_, err := ValidateToken(tokenString, cfg)
	if err == nil {
		t.Fatal("expected error for wrong signing method")
	}
}

// --- GenerateTokenPair Tests ---

func TestGenerateTokenPair_Success(t *testing.T) {
	cfg := testConfig()
	accessToken, refreshToken, err := GenerateTokenPair("user-123", "test@example.com", "Test", []string{"user"}, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if accessToken == "" {
		t.Fatal("expected non-empty access token")
	}
	if refreshToken == "" {
		t.Fatal("expected non-empty refresh token")
	}
	if accessToken == refreshToken {
		t.Fatal("access and refresh tokens should be different")
	}
}

func TestGenerateTokenPair_RefreshTokenHasJTI(t *testing.T) {
	cfg := testConfig()
	_, refreshToken, _ := GenerateTokenPair("user-123", "test@example.com", "Test", []string{"user"}, cfg)

	// Validate the refresh token and check it has a JTI
	claims, err := ValidateToken(refreshToken, cfg)
	if err != nil {
		t.Fatalf("failed to validate refresh token: %v", err)
	}
	if claims.RegisteredClaims.ID == "" {
		t.Fatal("expected refresh token to have a JTI (ID)")
	}
}

func TestGenerateTokenPair_RefreshTokenLongerExpiration(t *testing.T) {
	cfg := testConfig()
	accessToken, refreshToken, _ := GenerateTokenPair("user-123", "test@example.com", "Test", []string{"user"}, cfg)

	accessClaims, _ := ValidateToken(accessToken, cfg)
	refreshClaims, _ := ValidateToken(refreshToken, cfg)

	// Refresh token should expire later than access token
	if !refreshClaims.ExpiresAt.Time.After(accessClaims.ExpiresAt.Time) {
		t.Fatal("refresh token should expire after access token")
	}
}

func TestGenerateTokenPair_AccessTokenContainsAccesses(t *testing.T) {
	cfg := testConfig()
	accessToken, _, _ := GenerateTokenPair("user-123", "test@example.com", "Test", []string{"user", "admin"}, cfg)

	claims, err := ValidateToken(accessToken, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(claims.Accesses) != 2 {
		t.Fatalf("expected 2 accesses, got %d", len(claims.Accesses))
	}
}

// --- Claims Tests ---

func TestClaims_Structure(t *testing.T) {
	c := Claims{
		UserID:   "id-1",
		Email:    "e@e.com",
		Name:     "Name",
		Provider: "google",
		Accesses: []string{"user"},
	}
	if c.UserID != "id-1" {
		t.Fatalf("unexpected UserID: %s", c.UserID)
	}
	if c.Provider != "google" {
		t.Fatalf("unexpected Provider: %s", c.Provider)
	}
}
