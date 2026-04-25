package install

import (
	"crypto/rand"
	"encoding/base64"
)

// generateSecret generates a cryptographically secure random string of n bytes,
// encoded as a base64 URLEncoding string.
func generateSecret(n int) string {
	b := make([]byte, n)
	_, err := rand.Read(b)
	if err != nil {
		// This should practically never happen with crypto/rand
		panic("failed to generate secure random bytes: " + err.Error())
	}
	return base64.URLEncoding.EncodeToString(b)
}
