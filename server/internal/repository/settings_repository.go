package repository

import (
	"bedrud/config"
	"bedrud/internal/models"

	"gorm.io/gorm"
)

type SettingsRepository struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewSettingsRepository(db *gorm.DB) *SettingsRepository {
	return &SettingsRepository{db: db}
}

// SetConfig stores the loaded config for fallback merge.
func (r *SettingsRepository) SetConfig(cfg *config.Config) {
	r.cfg = cfg
}

func (r *SettingsRepository) GetSettings() (*models.SystemSettings, error) {
	var s models.SystemSettings
	err := r.db.Attrs(models.SystemSettings{RegistrationEnabled: true, PasskeysEnabled: true, TokenDuration: 24}).FirstOrCreate(&s, models.SystemSettings{ID: 1}).Error
	return &s, err
}

func (r *SettingsRepository) SaveSettings(s *models.SystemSettings) error {
	s.ID = 1
	return r.db.Save(s).Error
}

// GetEffectiveSettings returns settings with DB values overlaid on config.yaml defaults.
// For each field: if the DB value is non-empty/non-zero, it wins; otherwise config.yaml is used.
func (r *SettingsRepository) GetEffectiveSettings() (*models.SystemSettings, error) {
	s, err := r.GetSettings()
	if err != nil {
		return nil, err
	}
	if r.cfg == nil {
		return s, nil
	}
	mergeFromConfig(s, r.cfg)
	return s, nil
}

// mergeFromConfig fills in zero/empty fields from the config file.
func mergeFromConfig(s *models.SystemSettings, cfg *config.Config) {
	// Auth
	if s.GoogleClientID == "" && cfg.Auth.Google.ClientID != "" {
		s.GoogleClientID = cfg.Auth.Google.ClientID
	}
	if s.GoogleClientSecret == "" && cfg.Auth.Google.ClientSecret != "" {
		s.GoogleClientSecret = cfg.Auth.Google.ClientSecret
	}
	if s.GoogleRedirectURL == "" && cfg.Auth.Google.RedirectURL != "" {
		s.GoogleRedirectURL = cfg.Auth.Google.RedirectURL
	}
	if s.GithubClientID == "" && cfg.Auth.Github.ClientID != "" {
		s.GithubClientID = cfg.Auth.Github.ClientID
	}
	if s.GithubClientSecret == "" && cfg.Auth.Github.ClientSecret != "" {
		s.GithubClientSecret = cfg.Auth.Github.ClientSecret
	}
	if s.GithubRedirectURL == "" && cfg.Auth.Github.RedirectURL != "" {
		s.GithubRedirectURL = cfg.Auth.Github.RedirectURL
	}
	if s.TwitterClientID == "" && cfg.Auth.Twitter.ClientID != "" {
		s.TwitterClientID = cfg.Auth.Twitter.ClientID
	}
	if s.TwitterClientSecret == "" && cfg.Auth.Twitter.ClientSecret != "" {
		s.TwitterClientSecret = cfg.Auth.Twitter.ClientSecret
	}
	if s.TwitterRedirectURL == "" && cfg.Auth.Twitter.RedirectURL != "" {
		s.TwitterRedirectURL = cfg.Auth.Twitter.RedirectURL
	}
	if s.JWTSecret == "" {
		s.JWTSecret = cfg.Auth.JWTSecret
	}
	if s.TokenDuration == 0 && cfg.Auth.TokenDuration != 0 {
		s.TokenDuration = cfg.Auth.TokenDuration
	}
	if s.SessionSecret == "" {
		s.SessionSecret = cfg.Auth.SessionSecret
	}
	if s.FrontendURL == "" {
		s.FrontendURL = cfg.Auth.FrontendURL
	}

	// Server
	if s.ServerPort == "" {
		s.ServerPort = cfg.Server.Port
	}
	if s.ServerHost == "" {
		s.ServerHost = cfg.Server.Host
	}
	if s.ServerDomain == "" {
		s.ServerDomain = cfg.Server.Domain
	}
	if !s.ServerEnableTLS && cfg.Server.EnableTLS {
		s.ServerEnableTLS = cfg.Server.EnableTLS
	}
	if s.ServerCertFile == "" {
		s.ServerCertFile = cfg.Server.CertFile
	}
	if s.ServerKeyFile == "" {
		s.ServerKeyFile = cfg.Server.KeyFile
	}
	if !s.ServerUseACME && cfg.Server.UseACME {
		s.ServerUseACME = cfg.Server.UseACME
	}
	if s.ServerEmail == "" {
		s.ServerEmail = cfg.Server.Email
	}
	if !s.BehindProxy && cfg.Server.BehindProxy {
		s.BehindProxy = cfg.Server.BehindProxy
	}

	// LiveKit
	if s.LiveKitHost == "" {
		s.LiveKitHost = cfg.LiveKit.Host
	}
	if s.LiveKitAPIKey == "" {
		s.LiveKitAPIKey = cfg.LiveKit.APIKey
	}
	if s.LiveKitAPISecret == "" {
		s.LiveKitAPISecret = cfg.LiveKit.APISecret
	}
	if !s.LiveKitExternal && cfg.LiveKit.External {
		s.LiveKitExternal = cfg.LiveKit.External
	}

	// CORS
	if s.CORSAllowedOrigins == "" {
		s.CORSAllowedOrigins = cfg.Cors.AllowedOrigins
	}
	if s.CORSAllowedHeaders == "" {
		s.CORSAllowedHeaders = cfg.Cors.AllowedHeaders
	}
	if s.CORSAllowedMethods == "" {
		s.CORSAllowedMethods = cfg.Cors.AllowedMethods
	}
	if !s.CORSAllowCredentials && cfg.Cors.AllowCredentials {
		s.CORSAllowCredentials = cfg.Cors.AllowCredentials
	}
	if s.CORSMaxAge == 0 && cfg.Cors.MaxAge != 0 {
		s.CORSMaxAge = cfg.Cors.MaxAge
	}

	// Chat uploads
	if s.ChatUploadBackend == "" {
		s.ChatUploadBackend = cfg.Chat.Uploads.Backend
	}
	if s.ChatUploadMaxBytes == 0 && cfg.Chat.Uploads.MaxBytes != 0 {
		s.ChatUploadMaxBytes = cfg.Chat.Uploads.MaxBytes
	}
	if s.ChatUploadInlineMax == 0 && cfg.Chat.Uploads.InlineMaxBytes != 0 {
		s.ChatUploadInlineMax = cfg.Chat.Uploads.InlineMaxBytes
	}
	if s.ChatUploadDiskDir == "" {
		s.ChatUploadDiskDir = cfg.Chat.Uploads.DiskDir
	}
	if s.ChatUploadS3Endpoint == "" {
		s.ChatUploadS3Endpoint = cfg.Chat.Uploads.S3.Endpoint
	}
	if s.ChatUploadS3Bucket == "" {
		s.ChatUploadS3Bucket = cfg.Chat.Uploads.S3.Bucket
	}
	if s.ChatUploadS3Region == "" {
		s.ChatUploadS3Region = cfg.Chat.Uploads.S3.Region
	}
	if s.ChatUploadS3AccessKey == "" {
		s.ChatUploadS3AccessKey = cfg.Chat.Uploads.S3.AccessKey
	}
	if s.ChatUploadS3SecretKey == "" {
		s.ChatUploadS3SecretKey = cfg.Chat.Uploads.S3.SecretKey
	}
	if s.ChatUploadS3PublicURL == "" {
		s.ChatUploadS3PublicURL = cfg.Chat.Uploads.S3.PublicBaseURL
	}

	// Logger
	if s.LogLevel == "" {
		s.LogLevel = cfg.Logger.Level
	}
}
