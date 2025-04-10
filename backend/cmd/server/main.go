package main

import (
	"bedrud-backend/config"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "bedrud-backend/docs"
	"bedrud-backend/internal/auth"
	"bedrud-backend/internal/database"
	"bedrud-backend/internal/handlers"
	"bedrud-backend/internal/middleware"
	"bedrud-backend/internal/repository"
	"bedrud-backend/internal/scheduler"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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
// @BasePath  /

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
	auth.InitializeSessionStore(cfg.Auth.SessionSecret)

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

	// Middleware
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:8090,http://127.0.0.1:8090,http://localhost:5173,http://127.0.0.1:5173",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowCredentials: true,
		ExposeHeaders:    "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Cache-Control, Content-Language, Content-Type",
		MaxAge:           300,
	}))

	// Swagger configuration
	app.Get("/swagger/*", swagger.New(swagger.Config{
		URL:          "/swagger/doc.json",
		DeepLinking:  true,
		DocExpansion: "list",
	}))

	// Health check routes
	app.Get("/health", healthCheck)
	app.Get("/ready", readinessCheck)

	// Serve static files
	app.Static("/static", "./static")

	// Serve templates
	// app.Get("/", handlers.AuthMiddleware, func(c *fiber.Ctx) error {
	// 	return c.SendFile("./internal/templates/index.html")
	// })
	app.Get("/login", func(c *fiber.Ctx) error {
		return c.SendFile("./internal/templates/login.html")
	})

	// API routes
	// api := app.Group("/api")
	// api.Get("/user", handlers.AuthMiddleware, handlers.GetUserInfo)

	// Auth routes with handlers
	userRepo := repository.NewUserRepository(database.GetDB())
	authService := auth.NewAuthService(userRepo)
	authHandler := handlers.NewAuthHandler(authService, cfg)

	// Register auth routes
	app.Post("/auth/register", authHandler.Register)
	app.Post("/auth/login", authHandler.Login)
	app.Post("/auth/refresh", authHandler.RefreshToken)
	app.Post("/auth/logout", middleware.Protected(), authHandler.Logout)
	app.Get("/auth/me", middleware.Protected(), authHandler.GetMe)

	// Social auth routes (existing)
	app.Get("/auth/:provider/login", handlers.BeginAuthHandler)
	app.Get("/auth/:provider/callback", handlers.CallbackHandler)

	// Initialize repositories
	roomRepo := repository.NewRoomRepository(database.GetDB())

	// Initialize handlers
	roomHandler := handlers.NewRoomHandler(
		cfg.LiveKit.Host,
		cfg.LiveKit.APIKey,
		cfg.LiveKit.APISecret,
		roomRepo,
	)

	// Room routes
	app.Post("/create-room", middleware.Protected(), roomHandler.CreateRoom)
	app.Post("/join-room", middleware.Protected(), roomHandler.JoinRoom)

	// Initialize handlers
	usersHandler := handlers.NewUsersHandler(userRepo)

	// Admin routes
	adminGroup := app.Group("/admin",
		middleware.Protected(),
		middleware.RequireAccess("superadmin"),
	)

	// Add these new routes
	adminGroup.Get("/users", usersHandler.ListUsers)
	adminGroup.Put("/users/:id/status", usersHandler.UpdateUserStatus)

	// ...existing admin routes...
	adminGroup.Get("/rooms", roomHandler.AdminListRooms)
	adminGroup.Post("/rooms/:roomId/token", roomHandler.AdminGenerateToken)

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
