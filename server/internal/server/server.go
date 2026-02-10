package server

import (
	root "bedrud"
	"bedrud/config"
	"bedrud/internal/auth"
	"bedrud/internal/database"
	"bedrud/internal/handlers"
	"bedrud/internal/livekit"
	"bedrud/internal/middleware"
	"bedrud/internal/repository"
	"bedrud/internal/scheduler"
	"context"
	"crypto/tls"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/acme/autocert"
)

func Run(configPath string) error {
	cfg, err := config.Load(configPath)
	if err != nil {
		return err
	}

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	logLevel, _ := zerolog.ParseLevel(cfg.Logger.Level)
	zerolog.SetGlobalLevel(logLevel)
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})

	internalHost := strings.ToLower(cfg.LiveKit.InternalHost)
	if strings.Contains(internalHost, "localhost") || strings.Contains(internalHost, "127.0.0.1") {
		log.Info().Msg("➜ Starting internal managed LiveKit server...")
		certFile, keyFile := "", ""
		if cfg.Server.EnableTLS {
			certFile = cfg.Server.CertFile
			keyFile = cfg.Server.KeyFile
			if certFile == "" {
				certFile = "/etc/bedrud/cert.pem"
			}
			if keyFile == "" {
				keyFile = "/etc/bedrud/key.pem"
			}
		}
		if err := livekit.StartInternalServer(context.Background(), cfg.LiveKit.APIKey, cfg.LiveKit.APISecret, 7880, certFile, keyFile, cfg.LiveKit.ConfigPath); err != nil {
			log.Error().Err(err).Msg("Failed to start internal LiveKit server")
		}
	}

	auth.InitializeSessionStore(cfg.Auth.SessionSecret, cfg.Server.EnableTLS)
	if err := database.Initialize(&cfg.Database); err != nil {
		return err
	}
	defer database.Close()
	database.RunMigrations()
	scheduler.Initialize()
	defer scheduler.Stop()
	auth.Init(cfg)

	app := fiber.New(fiber.Config{AppName: "Bedrud API"})

	// Proxy LiveKit traffic if we are using internal host
	if strings.Contains(strings.ToLower(cfg.LiveKit.InternalHost), "127.0.0.1") ||
		strings.Contains(strings.ToLower(cfg.LiveKit.InternalHost), "localhost") {
		target, _ := url.Parse("http://127.0.0.1:7880")
		rp := httputil.NewSingleHostReverseProxy(target)

		// Custom director to handle path stripping and logging
		oldDirector := rp.Director
		rp.Director = func(req *http.Request) {
			oldDirector(req)
			originalPath := req.URL.Path
			req.URL.Path = strings.TrimPrefix(originalPath, "/livekit")
			if req.URL.Path == "" {
				req.URL.Path = "/"
			}
			req.Host = target.Host
			log.Debug().Str("original", originalPath).Str("proxied", req.URL.Path).Msg("Proxying LiveKit request (WS supported)")
		}

		app.Use("/livekit", adaptor.HTTPHandler(rp))
	}

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.Cors.AllowedOrigins,
		AllowHeaders:     cfg.Cors.AllowedHeaders,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

	api := app.Group("/api")
	userRepo := repository.NewUserRepository(database.GetDB())
	passkeyRepo := repository.NewPasskeyRepository(database.GetDB())
	roomRepo := repository.NewRoomRepository(database.GetDB())
	authService := auth.NewAuthService(userRepo, passkeyRepo)
	authHandler := handlers.NewAuthHandler(authService, cfg)
	roomHandler := handlers.NewRoomHandler(cfg.LiveKit, roomRepo)

	api.Post("/auth/register", authHandler.Register)
	api.Post("/auth/login", authHandler.Login)
	api.Post("/auth/guest-login", authHandler.GuestLogin)
	api.Post("/auth/refresh", authHandler.RefreshToken)
	api.Post("/auth/logout", middleware.Protected(), authHandler.Logout)
	api.Get("/auth/me", middleware.Protected(), authHandler.GetMe)

	// Passkey routes
	api.Post("/auth/passkey/register/begin", middleware.Protected(), authHandler.PasskeyRegisterBegin)
	api.Post("/auth/passkey/register/finish", middleware.Protected(), authHandler.PasskeyRegisterFinish)
	api.Post("/auth/passkey/login/begin", authHandler.PasskeyLoginBegin)
	api.Post("/auth/passkey/login/finish", authHandler.PasskeyLoginFinish)
	api.Post("/auth/passkey/signup/begin", authHandler.PasskeySignupBegin)
	api.Post("/auth/passkey/signup/finish", authHandler.PasskeySignupFinish)

	api.Post("/room/create", middleware.Protected(), roomHandler.CreateRoom)
	api.Post("/room/join", middleware.Protected(), roomHandler.JoinRoom)
	api.Get("/room/list", middleware.Protected(), roomHandler.ListRooms)
	api.Post("/room/:roomId/kick/:identity", middleware.Protected(), roomHandler.KickParticipant)
	api.Post("/room/:roomId/mute/:identity", middleware.Protected(), roomHandler.MuteParticipant)
	api.Post("/room/:roomId/video/:identity/off", middleware.Protected(), roomHandler.DisableParticipantVideo)
	api.Post("/room/:roomId/stage/:identity/bring", middleware.Protected(), roomHandler.BringToStage)
	api.Post("/room/:roomId/stage/:identity/remove", middleware.Protected(), roomHandler.RemoveFromStage)
	api.Put("/room/:roomId/settings", middleware.Protected(), roomHandler.UpdateSettings)

	// Admin routes
	usersHandler := handlers.NewUsersHandler(userRepo)
	adminGroup := api.Group("/admin",
		middleware.Protected(),
		middleware.RequireAccess("superadmin"),
	)
	adminGroup.Get("/users", usersHandler.ListUsers)
	adminGroup.Put("/users/:id/status", usersHandler.UpdateUserStatus)
	adminGroup.Get("/rooms", roomHandler.AdminListRooms)
	adminGroup.Post("/rooms/:roomId/token", roomHandler.AdminGenerateToken)

	app.Use("/", filesystem.New(filesystem.Config{Root: http.FS(root.UI), PathPrefix: "frontend"}))
	app.Get("*", func(c *fiber.Ctx) error {
		if strings.HasPrefix(c.Path(), "/api") {
			return c.Next()
		}
		file, _ := root.UI.ReadFile("frontend/index.html")
		c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
		return c.Status(200).Send(file)
	})

	go func() {
		if cfg.Server.UseACME && cfg.Server.Domain != "" {
			log.Info().Msgf("➜ Enabling Let's Encrypt for domain: %s", cfg.Server.Domain)

			certManager := &autocert.Manager{
				Prompt:     autocert.AcceptTOS,
				HostPolicy: autocert.HostWhitelist(cfg.Server.Domain),
				Cache:      autocert.DirCache("/var/lib/bedrud/certs"),
			}

			// Manager for HTTP-01 challenge on port 80
			go func() {
				log.Info().Msg("➜ Starting ACME challenge server on port 80")
				if err := http.ListenAndServe(":80", certManager.HTTPHandler(nil)); err != nil {
					log.Error().Err(err).Msg("ACME challenge server failed")
				}
			}()

			tlsConfig := &tls.Config{
				GetCertificate: certManager.GetCertificate,
				MinVersion:     tls.VersionTLS12,
			}

			ln, err := tls.Listen("tcp", ":443", tlsConfig)
			if err != nil {
				log.Fatal().Err(err).Msg("Failed to listen on :443 for ACME")
			}
			log.Info().Msg("➜ Bedrud is running on HTTPS 443 with Let's Encrypt")
			_ = app.Listener(ln)
			return
		}

		addr := cfg.Server.Host + ":" + cfg.Server.Port
		if cfg.Server.EnableTLS {
			// Start HTTP on port 80 for bots/local use
			go func() {
				httpAddr := cfg.Server.Host + ":80"
				log.Info().Msgf("➜ Also listening on HTTP %s", httpAddr)
				if err := app.Listen(httpAddr); err != nil {
					log.Debug().Err(err).Msg("HTTP server failed (might be port 80 restricted)")
				}
			}()
			// Start HTTPS on primary port
			log.Info().Msgf("➜ Bedrud is running on HTTPS %s (Self-signed or provided certs)", addr)
			_ = app.ListenTLS(addr, cfg.Server.CertFile, cfg.Server.KeyFile)
		} else {
			log.Info().Msgf("➜ Bedrud is running on HTTP %s", addr)
			_ = app.Listen(addr)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	return app.Shutdown()
}
