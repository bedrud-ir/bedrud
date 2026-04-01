package handlers

import (
	"bedrud/config"
	"bedrud/internal/auth"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"context"
	"crypto/rand"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	lkauth "github.com/livekit/protocol/auth"
	"github.com/livekit/protocol/livekit"
	"github.com/rs/zerolog/log"
	"github.com/twitchtv/twirp"
)

func boolPtr(b bool) *bool { return &b }

type CreateRoomRequest struct {
	Name            string              `json:"name"`
	MaxParticipants int                 `json:"maxParticipants"`
	IsPublic        bool                `json:"isPublic"`
	Mode            string              `json:"mode"`
	Settings        models.RoomSettings `json:"settings"`
}

type JoinRoomRequest struct {
	RoomName string `json:"roomName"`
}

type RoomHandler struct {
	roomRepo    *repository.RoomRepository
	livekitHost string
	apiKey      string
	apiSecret   string
	client      livekit.RoomService
}

func NewRoomHandler(cfg config.LiveKitConfig, roomRepo *repository.RoomRepository) *RoomHandler {
	apiHost := cfg.InternalHost
	if apiHost == "" {
		apiHost = cfg.Host
	}
	httpClient := http.DefaultClient
	if cfg.SkipTLSVerify && strings.HasPrefix(apiHost, "https") {
		httpClient = &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
		}
	}
	client := livekit.NewRoomServiceProtobufClient(apiHost, httpClient)
	return &RoomHandler{
		roomRepo:    roomRepo,
		livekitHost: cfg.Host,
		apiKey:      cfg.APIKey,
		apiSecret:   cfg.APISecret,
		client:      client,
	}
}

func (h *RoomHandler) withAuth(ctx context.Context, grants ...*lkauth.VideoGrant) context.Context {
	at := lkauth.NewAccessToken(h.apiKey, h.apiSecret)
	for _, g := range grants {
		at.AddGrant(g)
	}
	token, _ := at.ToJWT()
	ctx, _ = twirp.WithHTTPRequestHeaders(ctx, http.Header{
		"Authorization": []string{"Bearer " + token},
	})
	return ctx
}

func (h *RoomHandler) CreateRoom(c *fiber.Ctx) error {
	var req CreateRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Normalize: trim whitespace, lowercase
	req.Name = strings.TrimSpace(strings.ToLower(req.Name))

	// Auto-generate name if not provided
	if req.Name == "" {
		generated, err := models.GenerateRandomRoomName()
		if err != nil {
			log.Error().Err(err).Msg("Failed to generate random room name")
			return c.Status(500).JSON(fiber.Map{"error": "Failed to generate room name"})
		}
		req.Name = generated
	}

	// Validate the room name (URL-safe check)
	if err := models.ValidateRoomName(req.Name); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	claims := c.Locals("user").(*auth.Claims)
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomCreate: true})
	_, err := h.client.CreateRoom(ctx, &livekit.CreateRoomRequest{Name: req.Name, MaxParticipants: uint32(req.MaxParticipants)})
	if err != nil {
		log.Error().Err(err).Str("room", req.Name).Msg("LiveKit CreateRoom failed")
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create media room"})
	}
	room, err := h.roomRepo.CreateRoom(claims.UserID, req.Name, req.IsPublic, req.Mode, req.Settings)
	if err != nil {
		// Map specific errors to appropriate HTTP status codes
		if errors.Is(err, models.ErrRoomNameTaken) {
			return c.Status(409).JSON(fiber.Map{"error": err.Error()})
		}
		if errors.Is(err, models.ErrRoomNameInvalid) || errors.Is(err, models.ErrRoomNameTooShort) || errors.Is(err, models.ErrRoomNameTooLong) {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}
		log.Error().Err(err).Msg("Database CreateRoom failed")
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create room"})
	}
	return c.JSON(fiber.Map{
		"id": room.ID, "name": room.Name, "createdBy": room.CreatedBy, "isActive": room.IsActive,
		"isPublic": room.IsPublic, "maxParticipants": room.MaxParticipants, "settings": room.Settings,
		"livekitHost": h.livekitHost, "mode": room.Mode,
	})
}

func (h *RoomHandler) JoinRoom(c *fiber.Ctx) error {
	var req JoinRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	claims := c.Locals("user").(*auth.Claims)
	room, _ := h.roomRepo.GetRoomByName(req.RoomName)
	if room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}

	_ = h.roomRepo.AddParticipant(room.ID, claims.UserID)

	at := lkauth.NewAccessToken(h.apiKey, h.apiSecret)
	at.AddGrant(&lkauth.VideoGrant{RoomJoin: true, Room: req.RoomName, CanUpdateOwnMetadata: boolPtr(true)}).SetIdentity(claims.UserID).SetName(claims.Name).SetValidFor(time.Hour)
	if meta, err := json.Marshal(map[string]interface{}{"accesses": claims.Accesses}); err == nil {
		at.SetMetadata(string(meta))
	}
	token, _ := at.ToJWT()

	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}

	return c.JSON(fiber.Map{
		"id": room.ID, "name": room.Name, "token": token, "createdBy": room.CreatedBy, "adminId": adminId, "isActive": room.IsActive,
		"isPublic": room.IsPublic, "maxParticipants": room.MaxParticipants, "expiresAt": room.ExpiresAt,
		"settings": room.Settings, "livekitHost": h.livekitHost, "mode": room.Mode,
	})
}

type GuestJoinRoomRequest struct {
	RoomName  string `json:"roomName"`
	GuestName string `json:"guestName"`
}

func (h *RoomHandler) GuestJoinRoom(c *fiber.Ctx) error {
	var req GuestJoinRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	req.GuestName = strings.TrimSpace(req.GuestName)
	if req.GuestName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Guest name is required"})
	}

	room, _ := h.roomRepo.GetRoomByName(req.RoomName)
	if room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}

	guestID := "guest-" + generateShortID()
	at := lkauth.NewAccessToken(h.apiKey, h.apiSecret)
	at.AddGrant(&lkauth.VideoGrant{
		RoomJoin:             true,
		Room:                 req.RoomName,
		CanUpdateOwnMetadata: boolPtr(false),
	}).SetIdentity(guestID).SetName(req.GuestName).SetValidFor(time.Hour)
	token, _ := at.ToJWT()

	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}

	return c.JSON(fiber.Map{
		"id": room.ID, "name": room.Name, "token": token, "adminId": adminId,
		"livekitHost": h.livekitHost,
	})
}

func generateShortID() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		// fallback: use timestamp hex
		return fmt.Sprintf("%x", time.Now().UnixNano())[:8]
	}
	for i, v := range b {
		b[i] = chars[int(v)%len(chars)]
	}
	return string(b)
}

func (h *RoomHandler) ListRooms(c *fiber.Ctx) error {
	claims := c.Locals("user").(*auth.Claims)
	rooms, _ := h.roomRepo.GetRoomsCreatedByUser(claims.UserID)
	return c.JSON(rooms)
}

func (h *RoomHandler) sendSystemMessage(ctx context.Context, roomName, event, actor, target string) {
	type sysMsg struct {
		Type   string `json:"type"`
		Event  string `json:"event"`
		Actor  string `json:"actor"`
		Target string `json:"target"`
	}
	b, _ := json.Marshal(sysMsg{Type: "system", Event: event, Actor: actor, Target: target})
	topic := "system"
	_, _ = h.client.SendData(ctx, &livekit.SendDataRequest{
		Room:  roomName,
		Data:  b,
		Kind:  livekit.DataPacket_RELIABLE,
		Topic: &topic,
	})
}

func (h *RoomHandler) KickParticipant(c *fiber.Ctx) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)
	room, _ := h.roomRepo.GetRoom(roomID)
	if room == nil {
		return c.SendStatus(404)
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	_, err := h.client.RemoveParticipant(ctx, &livekit.RoomParticipantIdentity{Room: room.Name, Identity: identity})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	h.sendSystemMessage(ctx, room.Name, "kick", claims.UserID, identity)
	return c.JSON(fiber.Map{"status": "success"})
}

func (h *RoomHandler) DeleteRoom(c *fiber.Ctx) error {
	roomID := c.Params("roomId")
	claims := c.Locals("user").(*auth.Claims)

	room, _ := h.roomRepo.GetRoom(roomID)
	if room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	if room.CreatedBy != claims.UserID {
		return c.Status(403).JSON(fiber.Map{"error": "Only the room creator can delete this room"})
	}

	// Delete from LiveKit
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomCreate: true})
	_, _ = h.client.DeleteRoom(ctx, &livekit.DeleteRoomRequest{Room: room.Name})

	// Delete from database
	if err := h.roomRepo.DeleteRoom(roomID, claims.UserID); err != nil {
		log.Error().Err(err).Str("roomId", roomID).Msg("Failed to delete room")
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete room"})
	}

	return c.JSON(fiber.Map{"status": "success"})
}

func (h *RoomHandler) MuteParticipant(c *fiber.Ctx) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)
	room, _ := h.roomRepo.GetRoom(roomID)
	if room == nil {
		return c.SendStatus(404)
	}
	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}
	if claims.UserID != adminId && !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	p, err := h.client.GetParticipant(ctx, &livekit.RoomParticipantIdentity{Room: room.Name, Identity: identity})
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Participant not found"})
	}
	for _, track := range p.Tracks {
		if track.Type == livekit.TrackType_AUDIO {
			_, _ = h.client.MutePublishedTrack(ctx, &livekit.MuteRoomTrackRequest{
				Room: room.Name, Identity: identity, TrackSid: track.Sid, Muted: true,
			})
		}
	}
	return c.JSON(fiber.Map{"status": "success"})
}

func (h *RoomHandler) BanParticipant(c *fiber.Ctx) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)
	room, _ := h.roomRepo.GetRoom(roomID)
	if room == nil {
		return c.SendStatus(404)
	}
	adminId := room.AdminID
	if adminId == "" {
		adminId = room.CreatedBy
	}
	if claims.UserID != adminId && !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	_, err := h.client.RemoveParticipant(ctx, &livekit.RoomParticipantIdentity{Room: room.Name, Identity: identity})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	h.sendSystemMessage(ctx, room.Name, "ban", claims.UserID, identity)
	_ = h.roomRepo.KickParticipant(room.ID, identity)
	return c.JSON(fiber.Map{"status": "success"})
}

func containsAccess(accesses []string, target string) bool {
	for _, a := range accesses {
		if a == target {
			return true
		}
	}
	return false
}
func (h *RoomHandler) DisableParticipantVideo(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "success"})
}
func (h *RoomHandler) BringToStage(c *fiber.Ctx) error { return c.JSON(fiber.Map{"status": "success"}) }
func (h *RoomHandler) RemoveFromStage(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "success"})
}
func (h *RoomHandler) UpdateSettings(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "success"})
}
func (h *RoomHandler) AdminListRooms(c *fiber.Ctx) error {
	rooms, err := h.roomRepo.GetAllRooms()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch rooms"})
	}
	return c.JSON(fiber.Map{"rooms": rooms})
}
func (h *RoomHandler) AdminGenerateToken(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "success"})
}

func (h *RoomHandler) AdminCloseRoom(c *fiber.Ctx) error {
	roomID := c.Params("roomId")
	room, _ := h.roomRepo.GetRoom(roomID)
	if room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomCreate: true})
	_, _ = h.client.DeleteRoom(ctx, &livekit.DeleteRoomRequest{Room: room.Name})
	room.IsActive = false
	if err := h.roomRepo.UpdateRoom(room); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to close room"})
	}
	return c.JSON(fiber.Map{"status": "success"})
}

func (h *RoomHandler) AdminUpdateRoom(c *fiber.Ctx) error {
	roomID := c.Params("roomId")
	var input struct {
		MaxParticipants *int `json:"maxParticipants"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	room, _ := h.roomRepo.GetRoom(roomID)
	if room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	if input.MaxParticipants != nil {
		room.MaxParticipants = *input.MaxParticipants
	}
	if err := h.roomRepo.UpdateRoom(room); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update room"})
	}
	return c.JSON(room)
}

func (h *RoomHandler) GetOnlineCount(c *fiber.Ctx) error {
	count, err := h.roomRepo.CountActiveParticipants()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to count participants"})
	}
	return c.JSON(fiber.Map{"count": count})
}

// AdminLiveKitStats returns aggregate stats from the LiveKit server.
func (h *RoomHandler) AdminLiveKitStats(c *fiber.Ctx) error {
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomList: true})
	resp, err := h.client.ListRooms(ctx, &livekit.ListRoomsRequest{})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch LiveKit stats"})
	}

	type RoomStat struct {
		Name            string `json:"name"`
		NumParticipants uint32 `json:"numParticipants"`
		NumPublishers   uint32 `json:"numPublishers"`
		CreationTime    int64  `json:"creationTime"`
	}
	var totalParticipants, totalPublishers uint32
	rooms := make([]RoomStat, 0, len(resp.Rooms))
	for _, r := range resp.Rooms {
		totalParticipants += r.NumParticipants
		totalPublishers += r.NumPublishers
		rooms = append(rooms, RoomStat{
			Name:            r.Name,
			NumParticipants: r.NumParticipants,
			NumPublishers:   r.NumPublishers,
			CreationTime:    r.CreationTime,
		})
	}
	return c.JSON(fiber.Map{
		"totalParticipants": totalParticipants,
		"totalPublishers":   totalPublishers,
		"activeRooms":       len(resp.Rooms),
		"rooms":             rooms,
	})
}

// AdminGetRoomParticipants fetches live participant data from LiveKit for a specific room.
func (h *RoomHandler) AdminGetRoomParticipants(c *fiber.Ctx) error {
	roomID := c.Params("roomId")
	room, _ := h.roomRepo.GetRoom(roomID)
	if room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}

	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	resp, err := h.client.ListParticipants(ctx, &livekit.ListParticipantsRequest{Room: room.Name})
	if err != nil {
		// Room may not be active in LiveKit — return empty list
		return c.JSON(fiber.Map{"participants": []struct{}{}, "room": room})
	}

	type TrackStat struct {
		Sid     string `json:"sid"`
		Type    string `json:"type"`
		Source  string `json:"source"`
		Muted   bool   `json:"muted"`
		Bitrate uint32 `json:"bitrate"` // target bitrate from highest quality layer
	}
	type ParticipantStat struct {
		Sid         string      `json:"sid"`
		Identity    string      `json:"identity"`
		Name        string      `json:"name"`
		State       string      `json:"state"`
		JoinedAt    int64       `json:"joinedAt"`
		IsPublisher bool        `json:"isPublisher"`
		Tracks      []TrackStat `json:"tracks"`
	}

	participants := make([]ParticipantStat, 0, len(resp.Participants))
	for _, p := range resp.Participants {
		tracks := make([]TrackStat, 0, len(p.Tracks))
		for _, t := range p.Tracks {
			var bitrate uint32
			for _, layer := range t.Layers {
				if layer.Bitrate > bitrate {
					bitrate = layer.Bitrate
				}
			}
			tracks = append(tracks, TrackStat{
				Sid:     t.Sid,
				Type:    t.Type.String(),
				Source:  t.Source.String(),
				Muted:   t.Muted,
				Bitrate: bitrate,
			})
		}
		participants = append(participants, ParticipantStat{
			Sid:         p.Sid,
			Identity:    p.Identity,
			Name:        p.Name,
			State:       p.State.String(),
			JoinedAt:    p.JoinedAt,
			IsPublisher: p.IsPublisher,
			Tracks:      tracks,
		})
	}
	return c.JSON(fiber.Map{"participants": participants, "room": room})
}

// AdminKickParticipant removes any participant from a room (no creator check).
func (h *RoomHandler) AdminKickParticipant(c *fiber.Ctx) error {
	roomID := c.Params("roomId")
	identity := c.Params("identity")
	claims := c.Locals("user").(*auth.Claims)
	room, _ := h.roomRepo.GetRoom(roomID)
	if room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	_, err := h.client.RemoveParticipant(ctx, &livekit.RoomParticipantIdentity{Room: room.Name, Identity: identity})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	h.sendSystemMessage(ctx, room.Name, "kick", claims.UserID, identity)
	return c.JSON(fiber.Map{"status": "success"})
}

// AdminMuteParticipant mutes all audio tracks for a participant.
func (h *RoomHandler) AdminMuteParticipant(c *fiber.Ctx) error {
	roomID := c.Params("roomId")
	identity := c.Params("identity")
	room, _ := h.roomRepo.GetRoom(roomID)
	if room == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Room not found"})
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})

	// Get participant to find their audio track SIDs
	p, err := h.client.GetParticipant(ctx, &livekit.RoomParticipantIdentity{Room: room.Name, Identity: identity})
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Participant not found"})
	}
	for _, track := range p.Tracks {
		if track.Type == livekit.TrackType_AUDIO {
			_, _ = h.client.MutePublishedTrack(ctx, &livekit.MuteRoomTrackRequest{
				Room:     room.Name,
				Identity: identity,
				TrackSid: track.Sid,
				Muted:    true,
			})
		}
	}
	return c.JSON(fiber.Map{"status": "success"})
}
