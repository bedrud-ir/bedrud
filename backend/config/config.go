package config

import (
	"os"
	"strconv"
	"sync"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	LiveKit  LiveKitConfig  `yaml:"livekit"`
	Auth     AuthConfig     `yaml:"auth"`
	Logger   LoggerConfig   `yaml:"logger"`
	Cors     CorsConfig     `yaml:"cors"`
}

type ServerConfig struct {
	Port         string `yaml:"port"`
	Host         string `yaml:"host"`
	ReadTimeout  int    `yaml:"readTimeout"`
	WriteTimeout int    `yaml:"writeTimeout"`
}

type DatabaseConfig struct {
	Host         string `yaml:"host"`
	Port         string `yaml:"port"`
	User         string `yaml:"user"`
	Password     string `yaml:"password"`
	DBName       string `yaml:"dbname"`
	SSLMode      string `yaml:"sslmode"`
	MaxIdleConns int    `yaml:"maxIdleConns"`
	MaxOpenConns int    `yaml:"maxOpenConns"`
	MaxLifetime  int    `yaml:"maxLifetime"` // in minutes
	Type         string `yaml:"type"`        // e.g., "postgres", "sqlite"
	Path         string `yaml:"path"`        // Path for SQLite, if used
}

type LiveKitConfig struct {
	Host      string `yaml:"host"`
	APIKey    string `yaml:"apiKey"`
	APISecret string `yaml:"apiSecret"`
}

type AuthConfig struct {
	JWTSecret     string       `yaml:"jwtSecret"`
	TokenDuration int          `yaml:"tokenDuration"` // in hours
	Google        OAuth2Config `yaml:"google"`
	Github        OAuth2Config `yaml:"github"`
	Twitter       OAuth2Config `yaml:"twitter"`
	FrontendURL   string       `yaml:"frontendURL"`
	SessionSecret string       `yaml:"sessionSecret"`
}

type OAuth2Config struct {
	ClientID     string `yaml:"clientId"`
	ClientSecret string `yaml:"clientSecret"`
	RedirectURL  string `yaml:"redirectUrl"`
}

type LoggerConfig struct {
	Level      string `yaml:"level"`
	OutputPath string `yaml:"outputPath"`
}

type CorsConfig struct {
	AllowedOrigins   string `yaml:"allowedOrigins"`
	AllowedHeaders   string `yaml:"allowedHeaders"`
	AllowedMethods   string `yaml:"allowedMethods"`
	AllowCredentials bool   `yaml:"allowCredentials"`
	ExposeHeaders    string `yaml:"exposeHeaders"`
	MaxAge           int    `yaml:"maxAge"`
}

var (
	config *Config
	once   sync.Once
)

// Load reads the configuration file and returns a Config struct
func Load(configPath string) (*Config, error) {
	once.Do(func() {
		config = &Config{}

		// Read the config file
		data, err := os.ReadFile(configPath)
		if err != nil {
			panic(err)
		}

		// Unmarshal the YAML into the config struct
		err = yaml.Unmarshal(data, config)
		if err != nil {
			panic(err)
		}

		// Override with environment variables if they exist
		if envPort := os.Getenv("SERVER_PORT"); envPort != "" {
			config.Server.Port = envPort
		}
		if dbHost := os.Getenv("DB_HOST"); dbHost != "" {
			config.Database.Host = dbHost
		}
		if dbPort := os.Getenv("DB_PORT"); dbPort != "" {
			config.Database.Port = dbPort
		}
		if dbUser := os.Getenv("DB_USER"); dbUser != "" {
			config.Database.User = dbUser
		}
		if dbPass := os.Getenv("DB_PASSWORD"); dbPass != "" {
			config.Database.Password = dbPass
		}
		if dbName := os.Getenv("DB_NAME"); dbName != "" {
			config.Database.DBName = dbName
		}
		if dbType := os.Getenv("DB_TYPE"); dbType != "" {
			config.Database.Type = dbType
		}
		if dbPath := os.Getenv("DB_PATH"); dbPath != "" {
			config.Database.Path = dbPath
		}
		if livekitHost := os.Getenv("LIVEKIT_HOST"); livekitHost != "" {
			config.LiveKit.Host = livekitHost
		}
		if livekitApiKey := os.Getenv("LIVEKIT_API_KEY"); livekitApiKey != "" {
			config.LiveKit.APIKey = livekitApiKey
		}
		if livekitApiSecret := os.Getenv("LIVEKIT_API_SECRET"); livekitApiSecret != "" {
			config.LiveKit.APISecret = livekitApiSecret
		}
		if jwtSecret := os.Getenv("JWT_SECRET"); jwtSecret != "" {
			config.Auth.JWTSecret = jwtSecret
		}
		if frontendURL := os.Getenv("AUTH_FRONTEND_URL"); frontendURL != "" {
			config.Auth.FrontendURL = frontendURL
		}

		// CORS environment variable overrides
		if corsAllowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); corsAllowedOrigins != "" {
			config.Cors.AllowedOrigins = corsAllowedOrigins
		}
		if corsAllowedHeaders := os.Getenv("CORS_ALLOWED_HEADERS"); corsAllowedHeaders != "" {
			config.Cors.AllowedHeaders = corsAllowedHeaders
		}
		if corsAllowedMethods := os.Getenv("CORS_ALLOWED_METHODS"); corsAllowedMethods != "" {
			config.Cors.AllowedMethods = corsAllowedMethods
		}
		if corsAllowCredentials := os.Getenv("CORS_ALLOW_CREDENTIALS"); corsAllowCredentials != "" {
			if b, err := strconv.ParseBool(corsAllowCredentials); err == nil {
				config.Cors.AllowCredentials = b
			}
		}
		if corsExposeHeaders := os.Getenv("CORS_EXPOSE_HEADERS"); corsExposeHeaders != "" {
			config.Cors.ExposeHeaders = corsExposeHeaders
		}
		if corsMaxAge := os.Getenv("CORS_MAX_AGE"); corsMaxAge != "" {
			if i, err := strconv.Atoi(corsMaxAge); err == nil {
				config.Cors.MaxAge = i
			}
		}
	})

	return config, nil
}

// Get returns the loaded configuration
func Get() *Config {
	if config == nil {
		panic("Config not loaded")
	}
	return config
}

// GetDSN returns the PostgreSQL connection string
func (c *DatabaseConfig) GetDSN() string {
	return "postgresql://" + c.User + ":" + c.Password + "@" + c.Host + ":" + c.Port + "/" + c.DBName + "?sslmode=" + c.SSLMode
}
