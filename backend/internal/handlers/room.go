// Package handlers provides HTTP request handlers for the application.
package handlers

import (
	"bedrud-backend/internal/auth"
	"bedrud-backend/internal/models"
	"bedrud-backend/internal/repository"
	"time"

	"github.com/gofiber/fiber/v2"
	lkauth "github.com/livekit/protocol/auth" // Changed import alias
	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
	"github.com/rs/zerolog/log"
)

// CreateRoomRequest represents the request body for creating a new room
type CreateRoomRequest struct {
	Name            string              `json:"name" example:"my-room"`
	MaxParticipants int                 `json:"maxParticipants,omitempty" example:"20"`
	Settings        models.RoomSettings `json:"settings"`
}

// JoinRoomRequest represents the request body for joining a room
type JoinRoomRequest struct {
	RoomName string `json:"roomName" example:"my-room"`
}

// RoomResponse represents the response for room operations
type RoomResponse struct {
	ID              string              `json:"id"`
	Name            string              `json:"name"`
	Token           string              `json:"token,omitempty"`
	CreatedBy       string              `json:"createdBy"`
	IsActive        bool                `json:"isActive"`
	MaxParticipants int                 `json:"maxParticipants"`
	ExpiresAt       time.Time           `json:"expiresAt"`
	Settings        models.RoomSettings `json:"settings"`
	LiveKitHost     string              `json:"livekitHost,omitempty"`
}

// AdminRoomResponse represents the detailed room information for admins
type AdminRoomResponse struct {
	RoomResponse
	Participants []ParticipantInfo `json:"participants"`
}

type ParticipantInfo struct {
	ID            string    `json:"id"`
	UserID        string    `json:"userId"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	JoinedAt      time.Time `json:"joinedAt"`
	IsActive      bool      `json:"isActive"`
	IsMuted       bool      `json:"isMuted"`
	IsVideoOff    bool      `json:"isVideoOff"`
	IsChatBlocked bool      `json:"isChatBlocked"`
	Permissions   string    `json:"permissions"`
}

type RoomHandler struct {
	roomRepo    *repository.RoomRepository
	livekitHost string
	apiKey      string
	apiSecret   string
	roomService *lksdk.RoomServiceClient
}

func NewRoomHandler(host, apiKey, apiSecret string, roomRepo *repository.RoomRepository) *RoomHandler {
	return &RoomHandler{
		roomRepo:    roomRepo,
		livekitHost: host,
		apiKey:      apiKey,
		apiSecret:   apiSecret,
		roomService: lksdk.NewRoomServiceClient(host, apiKey, apiSecret),
	}
}

// @Summary Create a new room
// @Description Creates a new room with LiveKit integration
// @Tags rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body CreateRoomRequest true "Room creation parameters"
// @Success 200 {object} RoomResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /create-room [post]
func (h *RoomHandler) CreateRoom(c *fiber.Ctx) error {
	var req CreateRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Get user from context
	claims := c.Locals("user").(*auth.Claims)

	// Create LiveKit room
	_, err := h.roomService.CreateRoom(c.Context(), &livekit.CreateRoomRequest{
		Name:            req.Name,
		MaxParticipants: uint32(req.MaxParticipants),
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to create LiveKit room")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create room",
		})
	}

	// Create room in our database
	room, err := h.roomRepo.CreateRoom(claims.UserID, req.Name, req.Settings)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create room in database")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create room",
		})
	}

	return c.JSON(RoomResponse{
		ID:              room.ID,
		Name:            room.Name,
		CreatedBy:       room.CreatedBy,
		IsActive:        room.IsActive,
		MaxParticipants: room.MaxParticipants,
		ExpiresAt:       room.ExpiresAt,
		Settings:        room.Settings,
	})
}

// @Summary Join a room
// @Description Join an existing room and get access token
// @Tags rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body JoinRoomRequest true "Room join parameters"
// @Success 200 {object} RoomResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /join-room [post]
func (h *RoomHandler) JoinRoom(c *fiber.Ctx) error {
	var req JoinRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	claims := c.Locals("user").(*auth.Claims)

	// Get room from database
	room, err := h.roomRepo.GetRoomByName(req.RoomName)
	if err != nil || room == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Room not found",
		})
	}

	// Check if room is active and not expired
	if !room.IsActive || time.Now().After(room.ExpiresAt) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Room is not active or has expired",
		})
	}

	// Add participant to room
	err = h.roomRepo.AddParticipant(room.ID, claims.UserID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to add participant to room")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to join room",
		})
	}

	// Generate LiveKit token
	at := lkauth.NewAccessToken(h.apiKey, h.apiSecret) // Changed to lkauth
	grant := &lkauth.VideoGrant{                       // Changed to lkauth
		RoomJoin: true,
		Room:     req.RoomName,
	}
	at.AddGrant(grant).
		SetIdentity(claims.Email).
		SetValidFor(time.Hour)

	token, err := at.ToJWT()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.JSON(RoomResponse{
		ID:              room.ID,
		Name:            room.Name,
		Token:           token,
		CreatedBy:       room.CreatedBy,
		IsActive:        room.IsActive,
		MaxParticipants: room.MaxParticipants,
		ExpiresAt:       room.ExpiresAt,
		Settings:        room.Settings,
		LiveKitHost:     h.livekitHost,
	})
}

// @Summary List all rooms (Admin only)
// @Description Get detailed information about all rooms (requires superadmin access)
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} AdminRoomResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Router /admin/rooms [get]
func (h *RoomHandler) AdminListRooms(c *fiber.Ctx) error {
	var rooms []models.Room
	rooms, err := h.roomRepo.GetAllRooms()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch rooms",
		})
	}

	var response []AdminRoomResponse
	for _, room := range rooms {
		participants, err := h.roomRepo.GetRoomParticipantsWithUsers(room.ID)
		if err != nil {
			continue
		}

		var participantInfos []ParticipantInfo
		for _, p := range participants {
			info := ParticipantInfo{
				ID:            p.ID,
				UserID:        p.UserID,
				JoinedAt:      p.JoinedAt,
				IsActive:      p.IsActive,
				IsMuted:       p.IsMuted,
				IsVideoOff:    p.IsVideoOff,
				IsChatBlocked: p.IsChatBlocked,
			}

			// Safely access User information
			if p.User != nil {
				info.Email = p.User.Email
				info.Name = p.User.Name
			}

			participantInfos = append(participantInfos, info)
		}

		response = append(response, AdminRoomResponse{
			RoomResponse: RoomResponse{
				ID:              room.ID,
				Name:            room.Name,
				CreatedBy:       room.CreatedBy,
				IsActive:        room.IsActive,
				MaxParticipants: room.MaxParticipants,
				ExpiresAt:       room.ExpiresAt,
				Settings:        room.Settings,
			},
			Participants: participantInfos,
		})
	}

	return c.JSON(response)
}

// @Summary Generate room token (Admin only)
// @Description Generate a new token for any user to join a room (requires superadmin access)
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param roomId path string true "Room ID"
// @Param userId query string true "User ID to generate token for"
// @Success 200 {object} map[string]string
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /admin/rooms/{roomId}/token [post]
func (h *RoomHandler) AdminGenerateToken(c *fiber.Ctx) error {
	roomID := c.Params("roomId")
	userID := c.Query("userId")

	room, err := h.roomRepo.GetRoom(roomID)
	if err != nil || room == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Room not found",
		})
	}

	user, err := h.roomRepo.GetUserByID(userID)
	if err != nil || user == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	at := lkauth.NewAccessToken(h.apiKey, h.apiSecret)
	grant := &lkauth.VideoGrant{
		RoomJoin: true,
		Room:     room.Name,
	}
	at.AddGrant(grant).
		SetIdentity(user.Email).
		SetValidFor(time.Hour * 24)

	token, err := at.ToJWT()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.JSON(fiber.Map{
		"token": token,
	})
}
