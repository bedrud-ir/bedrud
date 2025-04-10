package auth

import (
	"bedrud-backend/config"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID   string   `json:"userId"`
	Email    string   `json:"email"`
	Provider string   `json:"provider"`
	Accesses []string `json:"accesses"`
	jwt.RegisteredClaims
}

func GenerateToken(userID, email, provider string, accesses []string, cfg *config.Config) (string, error) {
	expirationTime := time.Now().Add(time.Duration(cfg.Auth.TokenDuration) * time.Hour)

	claims := &Claims{
		UserID:   userID,
		Email:    email,
		Provider: provider,
		Accesses: accesses,
		RegisteredClaims: jwt.RegisteredClaims{
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

func ValidateToken(tokenString string, cfg *config.Config) (*Claims, error) {
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

func GenerateTokenPair(userID, email string, accesses []string, cfg *config.Config) (string, string, error) {
	// Generate access token
	accessToken, err := GenerateToken(userID, email, "local", accesses, cfg)
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshClaims := &Claims{
		UserID:   userID,
		Email:    email,
		Provider: "local",
		Accesses: accesses,
		RegisteredClaims: jwt.RegisteredClaims{
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
