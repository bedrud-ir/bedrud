package scheduler

import (
	"bedrud/config"
	"bedrud/internal/repository"
	"context"
	"crypto/tls"
	"net/http"
	"strings"
	"time"

	"github.com/go-co-op/gocron"
	lkauth "github.com/livekit/protocol/auth"
	"github.com/livekit/protocol/livekit"
	"github.com/rs/zerolog/log"
	"github.com/twitchtv/twirp"
)

var scheduler *gocron.Scheduler

// Initialize creates and starts the scheduler with idle room detection.
func Initialize(roomRepo *repository.RoomRepository, lkCfg *config.LiveKitConfig) {
	scheduler = gocron.NewScheduler(time.Local)

	apiHost := lkCfg.InternalHost
	if apiHost == "" {
		apiHost = lkCfg.Host
	}
	var httpClient *http.Client
	if lkCfg.SkipTLSVerify && strings.HasPrefix(apiHost, "https") {
		httpClient = &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
		}
	} else {
		httpClient = http.DefaultClient
	}
	lkClient := livekit.NewRoomServiceProtobufClient(apiHost, httpClient)

	_, _ = scheduler.Every(1).Minute().Do(func() {
		checkIdleRooms(roomRepo, lkCfg, lkClient)
	})

	scheduler.StartAsync()
}

// Stop gracefully shuts down the scheduler.
func Stop() {
	if scheduler != nil {
		scheduler.Stop()
	}
}

// checkIdleRooms marks active DB rooms as idle when they have 0 participants in LiveKit.
// Rooms created within the last 5 minutes are skipped to avoid false positives.
func checkIdleRooms(roomRepo *repository.RoomRepository, cfg *config.LiveKitConfig, client livekit.RoomService) {
	if roomRepo == nil {
		return
	}
	rooms, err := roomRepo.GetAllActiveRooms()
	if err != nil || len(rooms) == 0 {
		return
	}

	at := lkauth.NewAccessToken(cfg.APIKey, cfg.APISecret)
	at.AddGrant(&lkauth.VideoGrant{RoomList: true}) //nolint:staticcheck // AddGrant is deprecated but VideoGrant field is not available in this version of the protocol SDK
	token, err := at.ToJWT()
	if err != nil {
		log.Error().Err(err).Msg("Scheduler: failed to generate LiveKit token")
		return
	}
	ctx, _ := twirp.WithHTTPRequestHeaders(context.Background(), http.Header{
		"Authorization": []string{"Bearer " + token},
	})

	resp, err := client.ListRooms(ctx, &livekit.ListRoomsRequest{})
	if err != nil {
		log.Debug().Err(err).Msg("Scheduler: failed to list LiveKit rooms")
		return
	}

	// Build map of room name -> participant count from LiveKit
	lkRooms := make(map[string]uint32, len(resp.Rooms))
	for _, r := range resp.Rooms {
		lkRooms[r.Name] = r.NumParticipants
	}

	grace := 5 * time.Minute
	for i := range rooms {
		room := &rooms[i]
		if time.Since(room.CreatedAt) < grace {
			continue
		}
		count, exists := lkRooms[room.Name]
		if !exists || count == 0 {
			if err := roomRepo.SetRoomIdle(room.ID); err == nil {
				log.Info().Str("room", room.Name).Msg("Room set to idle (no participants)")
			}
		}
	}
}
