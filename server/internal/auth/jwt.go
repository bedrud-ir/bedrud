package auth

import (
	"bedrud/config"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// ErrTokenRevoked is returned when a token has been explicitly revoked (e.g. on logout).
var ErrTokenRevoked = errors.New("token has been revoked")

// tokenHash returns the hex-encoded SHA-256 hash of a token string.
// Storing hashes instead of full JWTs reduces memory usage in the revocation set.
func tokenHash(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

// revokedSet holds revoked access tokens keyed by their SHA-256 hash, with their expiry time.
//
// TRADE-OFF: The revocation list is kept in-memory and is lost on server restart.
// With a default access token TTL of 24 hours, a revoked token could remain valid
// after a restart for up to its remaining lifetime. This is an acceptable trade-off
// for now: the impact is limited to tokens that were explicitly revoked (e.g. user
// logout) and does not affect token validation itself. If stricter revocation is
// needed in the future, persist this set to the database.
type revokedSet struct {
	mu sync.RWMutex
	m  map[string]time.Time
}

var revokedTokens = &revokedSet{m: make(map[string]time.Time)}

// RevokeAccessToken marks a JWT as invalid until its natural expiry.
func RevokeAccessToken(tokenStr string, cfg *config.Config) {
	claims, err := parseTokenUnchecked(tokenStr, cfg)
	if err != nil {
		return
	}
	exp := time.Unix(claims.ExpiresAt.Unix(), 0)
	h := tokenHash(tokenStr)
	revokedTokens.mu.Lock()
	revokedTokens.m[h] = exp
	revokedTokens.mu.Unlock()
}

// PruneRevokedTokens removes expired entries from the revocation set. Call periodically (e.g. hourly).
func PruneRevokedTokens() {
	now := time.Now()
	revokedTokens.mu.Lock()
	defer revokedTokens.mu.Unlock()
	for h, exp := range revokedTokens.m {
		if now.After(exp) {
			delete(revokedTokens.m, h)
		}
	}
}

func isRevoked(tokenStr string) bool {
	h := tokenHash(tokenStr)
	revokedTokens.mu.RLock()
	defer revokedTokens.mu.RUnlock()
	exp, exists := revokedTokens.m[h]
	return exists && time.Now().Before(exp)
}

type Claims struct {
	UserID   string   `json:"userId"`
	Email    string   `json:"email"`
	Name     string   `json:"name"`
	Provider string   `json:"provider"`
	Accesses []string `json:"accesses"`
	jwt.RegisteredClaims
}

func GenerateToken(userID, email, name, provider string, accesses []string, cfg *config.Config) (string, error) {
	expirationTime := time.Now().Add(time.Duration(cfg.Auth.TokenDuration) * time.Hour)

	claims := &Claims{
		UserID:   userID,
		Email:    email,
		Name:     name,
		Provider: provider,
		Accesses: accesses,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "bedrud",
			Subject:   userID,
			Audience:  []string{"bedrud"},
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(cfg.Auth.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// parseTokenUnchecked parses and verifies the JWT signature/expiry WITHOUT checking revocation.
// Used internally so RevokeAccessToken can read expiry without triggering an infinite loop.
func parseTokenUnchecked(tokenString string, cfg *config.Config) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(cfg.Auth.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

func ValidateToken(tokenString string, cfg *config.Config) (*Claims, error) {
	claims, err := parseTokenUnchecked(tokenString, cfg)
	if err != nil {
		return nil, err
	}

	if isRevoked(tokenString) {
		return nil, ErrTokenRevoked
	}

	return claims, nil
}

func GenerateTokenPair(userID, email, name string, accesses []string, cfg *config.Config) (string, string, error) {
	// Generate access token
	accessToken, err := GenerateToken(userID, email, name, "local", accesses, cfg)
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshClaims := &Claims{
		UserID:   userID,
		Email:    email,
		Name:     name,
		Provider: "local",
		Accesses: accesses,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "bedrud",
			Subject:   userID,
			Audience:  []string{"bedrud"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24 * 7)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.New().String(),
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(cfg.Auth.JWTSecret))
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshTokenString, nil
}
