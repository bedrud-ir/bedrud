package models

import "time"

type SystemSettings struct {
	ID                    uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	RegistrationEnabled   bool      `gorm:"not null;default:true" json:"registrationEnabled"`
	TokenRegistrationOnly bool      `gorm:"not null;default:false" json:"tokenRegistrationOnly"`

	// Auth
	PasskeysEnabled      bool   `gorm:"not null;default:true" json:"passkeysEnabled"`
	GoogleClientID       string `gorm:"size:512" json:"googleClientId"`
	GoogleClientSecret   string `gorm:"size:512" json:"googleClientSecret"`
	GoogleRedirectURL    string `gorm:"size:512" json:"googleRedirectUrl"`
	GithubClientID       string `gorm:"size:512" json:"githubClientId"`
	GithubClientSecret   string `gorm:"size:512" json:"githubClientSecret"`
	GithubRedirectURL    string `gorm:"size:512" json:"githubRedirectUrl"`
	TwitterClientID      string `gorm:"size:512" json:"twitterClientId"`
	TwitterClientSecret  string `gorm:"size:512" json:"twitterClientSecret"`
	TwitterRedirectURL   string `gorm:"size:512" json:"twitterRedirectUrl"`
	JWTSecret            string `gorm:"size:512" json:"jwtSecret"`
	TokenDuration        int    `gorm:"default:24" json:"tokenDuration"`
	SessionSecret        string `gorm:"size:512" json:"sessionSecret"`
	FrontendURL          string `gorm:"size:512" json:"frontendUrl"`

	// Server
	ServerPort      string `gorm:"size:20" json:"serverPort"`
	ServerHost      string `gorm:"size:255" json:"serverHost"`
	ServerDomain    string `gorm:"size:255" json:"serverDomain"`
	ServerEnableTLS bool   `json:"serverEnableTls"`
	ServerCertFile  string `gorm:"size:512" json:"serverCertFile"`
	ServerKeyFile   string `gorm:"size:512" json:"serverKeyFile"`
	ServerUseACME   bool   `json:"serverUseAcme"`
	ServerEmail     string `gorm:"size:255" json:"serverEmail"`
	BehindProxy     bool   `json:"behindProxy"`

	// LiveKit
	LiveKitHost     string `gorm:"size:255" json:"livekitHost"`
	LiveKitAPIKey   string `gorm:"size:255" json:"livekitApiKey"`
	LiveKitAPISecret string `gorm:"size:255" json:"livekitApiSecret"`
	LiveKitExternal bool   `json:"livekitExternal"`

	// CORS
	CORSAllowedOrigins   string `gorm:"size:1024" json:"corsAllowedOrigins"`
	CORSAllowedHeaders   string `gorm:"size:1024" json:"corsAllowedHeaders"`
	CORSAllowedMethods   string `gorm:"size:255" json:"corsAllowedMethods"`
	CORSAllowCredentials bool   `json:"corsAllowCredentials"`
	CORSMaxAge           int    `json:"corsMaxAge"`

	// Chat uploads
	ChatUploadBackend     string `gorm:"size:20" json:"chatUploadBackend"`
	ChatUploadMaxBytes    int64  `json:"chatUploadMaxBytes"`
	ChatUploadInlineMax   int64  `json:"chatUploadInlineMax"`
	ChatUploadDiskDir     string `gorm:"size:512" json:"chatUploadDiskDir"`
	ChatUploadS3Endpoint  string `gorm:"size:255" json:"chatUploadS3Endpoint"`
	ChatUploadS3Bucket    string `gorm:"size:255" json:"chatUploadS3Bucket"`
	ChatUploadS3Region    string `gorm:"size:50" json:"chatUploadS3Region"`
	ChatUploadS3AccessKey string `gorm:"size:255" json:"chatUploadS3AccessKey"`
	ChatUploadS3SecretKey string `gorm:"size:255" json:"chatUploadS3SecretKey"`
	ChatUploadS3PublicURL string `gorm:"size:512" json:"chatUploadS3PublicUrl"`

	// Logger
	LogLevel string `gorm:"size:20" json:"logLevel"`

	UpdatedAt time.Time `json:"updatedAt"`
}

// SecretFields lists JSON field names that should be masked in API responses.
var SecretFields = []string{
	"googleClientSecret",
	"githubClientSecret",
	"twitterClientSecret",
	"jwtSecret",
	"sessionSecret",
	"livekitApiSecret",
	"chatUploadS3SecretKey",
}

// IsOAuthProviderConfigured returns true if the given provider has both
// client ID and client secret set.
func (s *SystemSettings) IsOAuthProviderConfigured(provider string) bool {
	switch provider {
	case "google":
		return s.GoogleClientID != "" && s.GoogleClientSecret != ""
	case "github":
		return s.GithubClientID != "" && s.GithubClientSecret != ""
	case "twitter":
		return s.TwitterClientID != "" && s.TwitterClientSecret != ""
	}
	return false
}

// ConfiguredOAuthProviders returns a list of provider IDs that have credentials.
func (s *SystemSettings) ConfiguredOAuthProviders() []string {
	var providers []string
	for _, p := range []string{"google", "github", "twitter"} {
		if s.IsOAuthProviderConfigured(p) {
			providers = append(providers, p)
		}
	}
	return providers
}
