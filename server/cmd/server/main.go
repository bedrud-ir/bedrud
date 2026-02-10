package main

import (
	"bedrud/config"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	_ "bedrud/docs"
	"bedrud/internal/auth"
	"bedrud/internal/database"
	"bedrud/internal/handlers"
	"bedrud/internal/middleware"
	"bedrud/internal/repository"
	"bedrud/internal/scheduler"

	root "bedrud"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/swagger"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// @title           Bedrud Backend API
// @version         1.0
// @description     This is a Bedrud Backend API server.
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8090
// @BasePath  /api

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Enter the token with the `Bearer ` prefix, e.g. "Bearer abcde12345"

func init() {
	// Load configuration
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config.yaml"
	}

	cfg, err := config.Load(configPath)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// Configure zerolog based on config
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	logLevel, err := zerolog.ParseLevel(cfg.Logger.Level)
	if err != nil {
		logLevel = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(logLevel)

	output := os.Stdout
	if cfg.Logger.OutputPath != "" {
		file, err := os.OpenFile(cfg.Logger.OutputPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err == nil {
			output = file
		}
	}

	log.Logger = log.Output(zerolog.ConsoleWriter{
		Out:        output,
		TimeFormat: time.RFC3339,
	})
}

func main() {
	cfg := config.Get()

	// Initialize session store first
	auth.InitializeSessionStore(cfg.Auth.SessionSecret, cfg.Server.EnableTLS)

	// Initialize database connection
	if err := database.Initialize(&cfg.Database); err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize database")
	}
	defer database.Close()

	// Run database migrations after database initialization
	if err := database.RunMigrations(); err != nil {
		log.Fatal().Err(err).Msg("Failed to run database migrations")
	}

	// Initialize scheduler
	scheduler.Initialize()
	defer scheduler.Stop()

	// Initialize Goth providers (after session store is initialized)
	auth.Init(cfg)

	// Create new Fiber instance
	app := fiber.New(fiber.Config{
		AppName:      "Bedrud API",
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		// Enable custom error handling
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			log.Error().Err(err).
				Str("path", c.Path()).
				Str("ip", c.IP()).
				Msg("Error handling request")

			// Default 500 status code
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}

			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// ===============================
	// Repositories
	// ===============================
	userRepo := repository.NewUserRepository(database.GetDB())
	passkeyRepo := repository.NewPasskeyRepository(database.GetDB())
	roomRepo := repository.NewRoomRepository(database.GetDB())

	// ===============================
	// Services
	// ===============================
	authService := auth.NewAuthService(userRepo, passkeyRepo)

	// ===============================
	// Middleware
	// ===============================
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.Cors.AllowedOrigins,
		AllowHeaders:     cfg.Cors.AllowedHeaders,
		AllowMethods:     cfg.Cors.AllowedMethods,
		AllowCredentials: cfg.Cors.AllowCredentials,
		ExposeHeaders:    cfg.Cors.ExposeHeaders,
		MaxAge:           cfg.Cors.MaxAge,
	}))

	// ===============================
	// Group all API routes under /api
	// ===============================
	api := app.Group("/api")

	api.Get("/health", healthCheck)
	api.Get("/ready", readinessCheck)

	api.Get("/swagger/*", swagger.New(swagger.Config{
		URL:          "/api/swagger/doc.json",
		DeepLinking:  true,
		DocExpansion: "list",
	}))

	// ------------------------------
	authHandler := handlers.NewAuthHandler(authService, cfg)
	api.Post("/auth/register", authHandler.Register)
	api.Post("/auth/login", authHandler.Login)
	api.Post("/auth/guest-login", authHandler.GuestLogin)
	api.Post("/auth/refresh", authHandler.RefreshToken)
	api.Post("/auth/logout", middleware.Protected(), authHandler.Logout)
	api.Get("/auth/me", middleware.Protected(), authHandler.GetMe)
	api.Get("/auth/:provider/login", handlers.BeginAuthHandler)
	api.Get("/auth/:provider/callback", handlers.CallbackHandler)

	// Passkey routes
	api.Post("/auth/passkey/register/begin", middleware.Protected(), authHandler.PasskeyRegisterBegin)
	api.Post("/auth/passkey/register/finish", middleware.Protected(), authHandler.PasskeyRegisterFinish)
	api.Post("/auth/passkey/login/begin", authHandler.PasskeyLoginBegin)
	api.Post("/auth/passkey/login/finish", authHandler.PasskeyLoginFinish)
	api.Post("/auth/passkey/signup/begin", authHandler.PasskeySignupBegin)
	api.Post("/auth/passkey/signup/finish", authHandler.PasskeySignupFinish)

	// Initialize handlers
	roomHandler := handlers.NewRoomHandler(cfg.LiveKit, roomRepo)

	// Room routes
	api.Post("/room/create", middleware.Protected(), roomHandler.CreateRoom)
	api.Post("/room/join", middleware.Protected(), roomHandler.JoinRoom)
	api.Get("/room/list", middleware.Protected(), roomHandler.ListRooms)
	api.Post("/room/:roomId/kick/:identity", middleware.Protected(), roomHandler.KickParticipant)
	api.Post("/room/:roomId/mute/:identity", middleware.Protected(), roomHandler.MuteParticipant)
	api.Post("/room/:roomId/video/:identity/off", middleware.Protected(), roomHandler.DisableParticipantVideo)
	api.Post("/room/:roomId/stage/:identity/bring", middleware.Protected(), roomHandler.BringToStage)
	api.Post("/room/:roomId/stage/:identity/remove", middleware.Protected(), roomHandler.RemoveFromStage)
	api.Put("/room/:roomId/settings", middleware.Protected(), roomHandler.UpdateSettings)

	// Initialize handlers
	usersHandler := handlers.NewUsersHandler(userRepo)

	// Admin routes
	adminGroup := api.Group("/admin",
		middleware.Protected(),
		middleware.RequireAccess("superadmin"),
	)
	adminGroup.Get("/users", usersHandler.ListUsers)
	adminGroup.Put("/users/:id/status", usersHandler.UpdateUserStatus)
	adminGroup.Get("/rooms", roomHandler.AdminListRooms)
	adminGroup.Post("/rooms/:roomId/token", roomHandler.AdminGenerateToken)

	// ------------------------------
	// Serve static files
	app.Static("/static", "./static")

	// ------------------------------
	// Serve frontend application using embedded files
	app.Use("/", filesystem.New(filesystem.Config{
		Root:       http.FS(root.UI),
		PathPrefix: "frontend",
		Browse:     false,
	}))

	// ------------------------------
	// For backward compatibility - these will be removed later
	app.Get("/health", func(c *fiber.Ctx) error { return c.Redirect("/api/health") })
	app.Get("/ready", func(c *fiber.Ctx) error { return c.Redirect("/api/ready") })

	// Serve SPA - handle routes for SPA by serving index.html for all non-API routes
	app.Get("*", func(c *fiber.Ctx) error {
		// Skip if path starts with /api or /static
		path := c.Path()
		if strings.HasPrefix(path, "/api") || strings.HasPrefix(path, "/static") {
			return c.Next()
		}
		// Serve index.html from embedded files
		file, err := root.UI.ReadFile("frontend/index.html")
		if err != nil {
			return c.Status(fiber.StatusNotFound).SendString("index.html not found")
		}
		c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
		return c.Send(file)
	})

	// Start server in a goroutine
	serverAddr := cfg.Server.Host + ":" + cfg.Server.Port
	go func() {
		if err := app.Listen(serverAddr); err != nil {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")
	if err := app.Shutdown(); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}
}

// @Summary Health check endpoint
// @Description Get the health status of the service
// @Tags health
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health [get]
// Health check handler
func healthCheck(c *fiber.Ctx) error {
	log.Info().
		Str("path", c.Path()).
		Str("ip", c.IP()).
		Msg("Health check request received")

	return c.JSON(fiber.Map{
		"status": "healthy",
		"time":   time.Now().Unix(),
	})
}

// @Summary Readiness check endpoint
// @Description Get the readiness status of the service
// @Tags health
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /ready [get]
// Readiness check handler
func readinessCheck(c *fiber.Ctx) error {
	log.Info().
		Str("path", c.Path()).
		Str("ip", c.IP()).
		Msg("Readiness check request received")

	return c.JSON(fiber.Map{
		"status": "ready",
		"time":   time.Now().Unix(),
	})
}
