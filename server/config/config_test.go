package config

import "testing"

func TestDatabaseConfig_GetDSN(t *testing.T) {
	cfg := &DatabaseConfig{
		User:     "bedrud",
		Password: "secret",
		Host:     "localhost",
		Port:     "5432",
		DBName:   "bedrud_db",
		SSLMode:  "disable",
	}

	expected := "postgresql://bedrud:secret@localhost:5432/bedrud_db?sslmode=disable"
	got := cfg.GetDSN()
	if got != expected {
		t.Fatalf("expected DSN '%s', got '%s'", expected, got)
	}
}

func TestDatabaseConfig_GetDSN_SpecialChars(t *testing.T) {
	cfg := &DatabaseConfig{
		User:     "admin",
		Password: "p@ss:w0rd",
		Host:     "db.example.com",
		Port:     "5433",
		DBName:   "mydb",
		SSLMode:  "require",
	}

	expected := "postgresql://admin:p@ss:w0rd@db.example.com:5433/mydb?sslmode=require"
	got := cfg.GetDSN()
	if got != expected {
		t.Fatalf("expected DSN '%s', got '%s'", expected, got)
	}
}

func TestConfig_StructDefaults(t *testing.T) {
	cfg := Config{}

	// All sub-structs should be zero-valued
	if cfg.Server.Port != "" {
		t.Fatal("expected empty default Port")
	}
	if cfg.Server.EnableTLS {
		t.Fatal("expected EnableTLS to default to false")
	}
	if cfg.Server.UseACME {
		t.Fatal("expected UseACME to default to false")
	}
	if cfg.Database.Type != "" {
		t.Fatal("expected empty default database type")
	}
	if cfg.LiveKit.Host != "" {
		t.Fatal("expected empty default livekit host")
	}
	if cfg.Auth.TokenDuration != 0 {
		t.Fatal("expected token duration default to 0")
	}
	if cfg.Cors.AllowCredentials {
		t.Fatal("expected AllowCredentials default to false")
	}
	if cfg.Cors.MaxAge != 0 {
		t.Fatal("expected MaxAge default to 0")
	}
}

func TestServerConfig_Fields(t *testing.T) {
	s := ServerConfig{
		Port:      "8080",
		Host:      "0.0.0.0",
		EnableTLS: true,
		CertFile:  "/etc/cert.pem",
		KeyFile:   "/etc/key.pem",
		Domain:    "example.com",
		Email:     "admin@example.com",
		UseACME:   true,
	}

	if s.Port != "8080" {
		t.Fatalf("expected Port '8080', got '%s'", s.Port)
	}
	if s.Host != "0.0.0.0" {
		t.Fatalf("expected Host '0.0.0.0', got '%s'", s.Host)
	}
	if !s.EnableTLS {
		t.Fatal("expected EnableTLS true")
	}
	if !s.UseACME {
		t.Fatal("expected UseACME true")
	}
}

func TestLiveKitConfig_Fields(t *testing.T) {
	lk := LiveKitConfig{
		Host:          "https://livekit.example.com",
		InternalHost:  "http://localhost:7880",
		APIKey:        "key123",
		APISecret:     "secret456",
		SkipTLSVerify: true,
	}

	if lk.Host != "https://livekit.example.com" {
		t.Fatalf("unexpected Host: %s", lk.Host)
	}
	if !lk.SkipTLSVerify {
		t.Fatal("expected SkipTLSVerify true")
	}
}

func TestCorsConfig_Fields(t *testing.T) {
	c := CorsConfig{
		AllowedOrigins:   "http://localhost:3000",
		AllowedHeaders:   "Content-Type,Authorization",
		AllowedMethods:   "GET,POST",
		AllowCredentials: true,
		ExposeHeaders:    "X-Custom",
		MaxAge:           3600,
	}

	if c.AllowedOrigins != "http://localhost:3000" {
		t.Fatalf("unexpected AllowedOrigins: %s", c.AllowedOrigins)
	}
	if c.MaxAge != 3600 {
		t.Fatalf("expected MaxAge 3600, got %d", c.MaxAge)
	}
}
