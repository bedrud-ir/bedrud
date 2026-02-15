package handlers

import (
	"bedrud/config"
	"bedrud/internal/auth"
	"bedrud/internal/models"
	"bedrud/internal/repository"
	"context"
	"crypto/tls"
	"errors"
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

	if req.Mode == "clubhouse" {
		req.Settings.AllowVideo = false
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

func (h *RoomHandler) ListRooms(c *fiber.Ctx) error {
	claims := c.Locals("user").(*auth.Claims)
	rooms, _ := h.roomRepo.GetRoomsCreatedByUser(claims.UserID)
	return c.JSON(rooms)
}

func (h *RoomHandler) KickParticipant(c *fiber.Ctx) error {
	roomID, identity := c.Params("roomId"), c.Params("identity")
	room, _ := h.roomRepo.GetRoom(roomID)
	if room == nil {
		return c.SendStatus(404)
	}
	ctx := h.withAuth(c.Context(), &lkauth.VideoGrant{RoomAdmin: true, Room: room.Name})
	_, err := h.client.RemoveParticipant(ctx, &livekit.RoomParticipantIdentity{Room: room.Name, Identity: identity})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
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
	return c.JSON(fiber.Map{"status": "success"})
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
	return c.JSON(fiber.Map{"status": "success"})
}
func (h *RoomHandler) AdminGenerateToken(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "success"})
}
