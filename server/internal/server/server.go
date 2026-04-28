/*
 * Copyright 2026 Bedrud Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package server

import (
	"bedrud/config"
	"bedrud/internal/auth"
	"bedrud/internal/database"
	"bedrud/internal/handlers"
	"bedrud/internal/livekit"
	"bedrud/internal/middleware"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"bedrud/internal/scheduler"
	"bedrud/internal/utils"
	"context"
	"crypto/tls"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	root "bedrud"

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

	// Start embedded LiveKit unless an external deployment is configured.
	internalHost := strings.ToLower(cfg.LiveKit.InternalHost)
	useInternalLK := !cfg.LiveKit.External &&
		(strings.Contains(internalHost, "localhost") || strings.Contains(internalHost, "127.0.0.1"))
	if useInternalLK {
		log.Info().Msg("➜ Starting internal managed LiveKit server...")
		if len(cfg.LiveKit.APISecret) < 32 {
			return fmt.Errorf(
				"LiveKit API secret is too short (%d chars, need at least 32).\n\n"+
					"Generate a secret:\n"+
					"  openssl rand -hex 32\n\n"+
					"Then set it in config.yaml:\n"+
					"  livekit:\n"+
					"    apiSecret: <generated-secret>\n"+
					"Or via environment:\n"+
					"  LIVEKIT_API_SECRET=<secret> bedrud run",
				len(cfg.LiveKit.APISecret),
			)
		}
		certFile, keyFile := "", ""
		if cfg.Server.EnableTLS && !cfg.Server.DisableTLS {
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
	} else if cfg.LiveKit.External {
		log.Info().Str("host", cfg.LiveKit.Host).Msg("➜ Using external LiveKit server")
	}

	auth.InitializeSessionStore(cfg.Auth.SessionSecret, cfg.Server.EnableTLS && !cfg.Server.DisableTLS)
	if err := database.Initialize(&cfg.Database); err != nil {
		return err
	}
	defer database.Close()
	if err := database.RunMigrations(); err != nil {
		log.Error().Err(err).Msg("Failed to run database migrations")
	}
	roomRepo := repository.NewRoomRepository(database.GetDB())
	scheduler.Initialize(roomRepo, &cfg.LiveKit)
	defer scheduler.Stop()
	auth.Init(cfg)

	fiberCfg := fiber.Config{AppName: "Bedrud API"}
	// Enable trusted-proxy mode when: explicit trustedProxies list is set,
	// OR behindProxy=true (CDN / nginx in front), OR DisableTLS with a domain.
	if len(cfg.Server.TrustedProxies) > 0 || cfg.Server.BehindProxy {
		fiberCfg.EnableTrustedProxyCheck = true
		if len(cfg.Server.TrustedProxies) > 0 {
			fiberCfg.TrustedProxies = cfg.Server.TrustedProxies
		} else {
			// Trust all proxies when behindProxy=true and no explicit list.
			fiberCfg.TrustedProxies = []string{"0.0.0.0/0"}
		}
		if cfg.Server.ProxyHeader != "" {
			fiberCfg.ProxyHeader = cfg.Server.ProxyHeader
		} else {
			fiberCfg.ProxyHeader = "X-Forwarded-For"
		}
	}
	app := fiber.New(fiberCfg)

	// Proxy LiveKit traffic only when using the internal (embedded) server.
	// When livekit.external=true the client connects directly to livekit.host.
	if useInternalLK {
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
	corsConfig := cors.Config{
		AllowHeaders:     cfg.Cors.AllowedHeaders,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: cfg.Cors.AllowCredentials,
	}
	if cfg.Cors.AllowCredentials {
		if cfg.Cors.AllowedOrigins == "*" || cfg.Cors.AllowedOrigins == "" {
			log.Warn().Msg("CORS: AllowCredentials is true but AllowedOrigins is wildcard. Refusing to allow all origins with credentials.")
		} else {
			corsConfig.AllowOrigins = cfg.Cors.AllowedOrigins
		}
	} else {
		if cfg.Cors.AllowedOrigins == "" || cfg.Cors.AllowedOrigins == "*" {
			corsConfig.AllowOrigins = "*"
		} else {
			corsConfig.AllowOrigins = cfg.Cors.AllowedOrigins
		}
	}
	app.Use(cors.New(corsConfig))

	api := app.Group("/api")
	userRepo := repository.NewUserRepository(database.GetDB())
	passkeyRepo := repository.NewPasskeyRepository(database.GetDB())
	settingsRepo := repository.NewSettingsRepository(database.GetDB())
	settingsRepo.SetConfig(cfg)
	inviteTokenRepo := repository.NewInviteTokenRepository(database.GetDB())
	authService := auth.NewAuthService(userRepo, passkeyRepo)
	authHandler := handlers.NewAuthHandler(authService, cfg, settingsRepo, inviteTokenRepo)
	roomHandler := handlers.NewRoomHandler(&cfg.LiveKit, &cfg.Chat, roomRepo)

	api.Post("/auth/register", authHandler.Register)
	api.Post("/auth/login", authHandler.Login)
	api.Post("/auth/guest-login", authHandler.GuestLogin)
	api.Post("/auth/refresh", authHandler.RefreshToken)
	api.Post("/auth/logout", middleware.Protected(), authHandler.Logout)
	api.Get("/auth/me", middleware.Protected(), authHandler.GetMe)
	api.Put("/auth/me", middleware.Protected(), authHandler.UpdateProfile)
	api.Put("/auth/password", middleware.Protected(), authHandler.ChangePassword)

	prefsRepo := repository.NewUserPreferencesRepository(database.GetDB())
	preferencesHandler := handlers.NewPreferencesHandler(prefsRepo)
	api.Get("/auth/preferences", middleware.Protected(), preferencesHandler.GetPreferences)
	api.Put("/auth/preferences", middleware.Protected(), preferencesHandler.UpdatePreferences)

	// Passkey routes
	api.Post("/auth/passkey/register/begin", middleware.Protected(), authHandler.PasskeyRegisterBegin)
	api.Post("/auth/passkey/register/finish", middleware.Protected(), authHandler.PasskeyRegisterFinish)
	api.Post("/auth/passkey/login/begin", authHandler.PasskeyLoginBegin)
	api.Post("/auth/passkey/login/finish", authHandler.PasskeyLoginFinish)
	api.Post("/auth/passkey/signup/begin", authHandler.PasskeySignupBegin)
	api.Post("/auth/passkey/signup/finish", authHandler.PasskeySignupFinish)

	api.Post("/room/create", middleware.Protected(), roomHandler.CreateRoom)
	api.Post("/room/join", middleware.Protected(), roomHandler.JoinRoom)
	api.Post("/room/guest-join", roomHandler.GuestJoinRoom)
	api.Get("/room/list", middleware.Protected(), roomHandler.ListRooms)
	api.Post("/room/:roomId/kick/:identity", middleware.Protected(), roomHandler.KickParticipant)
	api.Post("/room/:roomId/mute/:identity", middleware.Protected(), roomHandler.MuteParticipant)
	api.Post("/room/:roomId/ban/:identity", middleware.Protected(), roomHandler.BanParticipant)
	api.Post("/room/:roomId/video/:identity/off", middleware.Protected(), roomHandler.DisableParticipantVideo)
	api.Post("/room/:roomId/promote/:identity", middleware.Protected(), roomHandler.PromoteParticipant)
	api.Post("/room/:roomId/demote/:identity", middleware.Protected(), roomHandler.DemoteParticipant)
	api.Post("/room/:roomId/chat/:identity/block", middleware.Protected(), roomHandler.BlockChat)
	api.Post("/room/:roomId/deafen/:identity", middleware.Protected(), roomHandler.DeafenParticipant)
	api.Post("/room/:roomId/undeafen/:identity", middleware.Protected(), roomHandler.UndeafenParticipant)
	api.Post("/room/:roomId/ask/:identity/:action", middleware.Protected(), roomHandler.AskParticipantAction)
	api.Post("/room/:roomId/spotlight/:identity", middleware.Protected(), roomHandler.SpotlightParticipant)
	api.Post("/room/:roomId/screenshare/:identity/stop", middleware.Protected(), roomHandler.StopScreenShare)
	api.Get("/room/:roomId/participant/:identity/info", middleware.Protected(), roomHandler.GetParticipantInfo)
	api.Post("/room/:roomId/stage/:identity/bring", middleware.Protected(), roomHandler.BringToStage)
	api.Post("/room/:roomId/stage/:identity/remove", middleware.Protected(), roomHandler.RemoveFromStage)
	api.Put("/room/:roomId/settings", middleware.Protected(), roomHandler.UpdateSettings)
	api.Delete("/room/:roomId", middleware.Protected(), roomHandler.DeleteRoom)
	api.Post("/room/:roomId/chat/upload", middleware.Protected(), roomHandler.UploadChatImage)

	// Serve disk-backed chat image uploads as static files.
	// Inline (base64) and S3-hosted images are not served from here.
	uploadDir := cfg.Chat.Uploads.DiskDir
	if uploadDir == "" {
		uploadDir = "./data/uploads/chat"
	}
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		log.Warn().Err(err).Str("dir", uploadDir).Msg("Could not create chat upload dir")
	}
	app.Static("/uploads/chat", uploadDir, fiber.Static{Browse: false})

	// Admin routes
	usersHandler := handlers.NewUsersHandler(userRepo, roomRepo)
	adminHandler := handlers.NewAdminHandler(settingsRepo, inviteTokenRepo)
	adminGroup := api.Group("/admin",
		middleware.Protected(),
		middleware.RequireAccess(models.AccessSuperAdmin),
	)
	adminGroup.Get("/users", usersHandler.ListUsers)
	adminGroup.Put("/users/:id/status", usersHandler.UpdateUserStatus)
	adminGroup.Put("/users/:id/accesses", usersHandler.UpdateUserAccesses)
	adminGroup.Get("/rooms", roomHandler.AdminListRooms)
	adminGroup.Post("/rooms/:roomId/token", roomHandler.AdminGenerateToken)
	adminGroup.Delete("/rooms/:roomId", roomHandler.AdminCloseRoom)
	adminGroup.Put("/rooms/:roomId", roomHandler.AdminUpdateRoom)
	adminGroup.Get("/online-count", roomHandler.GetOnlineCount)
	adminGroup.Get("/livekit/stats", roomHandler.AdminLiveKitStats)
	adminGroup.Get("/users/:id", usersHandler.GetUserDetail)
	adminGroup.Get("/rooms/:roomId/participants", roomHandler.AdminGetRoomParticipants)
	adminGroup.Post("/rooms/:roomId/participants/:identity/kick", roomHandler.AdminKickParticipant)
	adminGroup.Post("/rooms/:roomId/participants/:identity/mute", roomHandler.AdminMuteParticipant)
	api.Get("/auth/settings", adminHandler.GetPublicSettings)
	adminGroup.Get("/settings", adminHandler.GetSettings)
	adminGroup.Put("/settings", adminHandler.UpdateSettings)
	adminGroup.Get("/invite-tokens", adminHandler.ListInviteTokens)
	adminGroup.Post("/invite-tokens", adminHandler.CreateInviteToken)
	adminGroup.Delete("/invite-tokens/:id", adminHandler.DeleteInviteToken)

	app.Use("/", filesystem.New(filesystem.Config{Root: http.FS(root.UI), PathPrefix: "frontend"}))

	// Pre-read both HTML files: index.html has SSR'd homepage content (for SEO),
	// shell.html has the same <head>/scripts but no pre-rendered route markup
	// (avoids flashing the homepage when loading /m/*, /dashboard/*, etc.).
	indexHTML, _ := root.UI.ReadFile("frontend/index.html")
	shellHTML, _ := root.UI.ReadFile("frontend/shell.html")
	if len(shellHTML) == 0 {
		shellHTML = indexHTML // fallback if shell.html hasn't been generated yet
	}

	app.Get("*", func(c *fiber.Ctx) error {
		if strings.HasPrefix(c.Path(), "/api") {
			return c.Next()
		}
		c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
		if c.Path() == "/" {
			return c.Status(http.StatusOK).Send(indexHTML)
		}
		return c.Status(http.StatusOK).Send(shellHTML)
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
				log.Info().Msgf("➜ Starting ACME challenge server on %s (bound 0.0.0.0:80)", utils.DisplayAddr("0.0.0.0", "80"))
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
				log.Error().Err(err).Msg("Failed to listen on :443 for ACME — falling back to plain HTTP")
				// fall through to the plain-HTTP / manual-TLS block below
			} else {
				log.Info().Msgf("➜ Bedrud is running on HTTPS %s (bound 0.0.0.0:443)", utils.DisplayAddr("0.0.0.0", "443"))
				_ = app.Listener(ln)
				return
			}
		}

		addr := cfg.Server.Host + ":" + cfg.Server.Port
		tlsEnabled := cfg.Server.EnableTLS && !cfg.Server.DisableTLS
		if tlsEnabled {
			// Start HTTP on port 80 for bots/local use
			go func() {
				httpAddr := cfg.Server.Host + ":80"
				log.Info().Msgf("➜ Also listening on HTTP %s (bound %s)", utils.DisplayAddr(cfg.Server.Host, "80"), httpAddr)
				if err := app.Listen(httpAddr); err != nil {
					log.Debug().Err(err).Msg("HTTP server failed (might be port 80 restricted)")
				}
			}()
			// Start HTTPS on primary port
			log.Info().Msgf("➜ Bedrud is running on HTTPS %s (bound %s)", utils.DisplayAddr(cfg.Server.Host, cfg.Server.Port), addr)
			_ = app.ListenTLS(addr, cfg.Server.CertFile, cfg.Server.KeyFile)
		} else {
			log.Info().Msgf("➜ Bedrud is running on HTTP %s (bound %s)", utils.DisplayAddr(cfg.Server.Host, cfg.Server.Port), addr)
			_ = app.Listen(addr)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	return app.Shutdown()
}
