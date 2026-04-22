package handlers

import (
	"bedrud/internal/auth"
	"bedrud/internal/models"
	"bedrud/internal/repository"

	"github.com/gofiber/fiber/v2"
)

type UsersHandler struct {
	userRepo *repository.UserRepository
	roomRepo *repository.RoomRepository
}

// UserListResponse represents the response for listing users
// @Description Response containing a list of users
type UserListResponse struct {
	// @Description List of user details
	Users []UserDetails `json:"users"`
}

// UserDetails represents detailed user information
// @Description Detailed information about a user
type UserDetails struct {
	// @Description User's unique identifier
	ID string `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`

	// @Description User's email address
	Email string `json:"email" example:"user@example.com"`

	// @Description User's display name
	Name string `json:"name" example:"John Doe"`

	// @Description Authentication provider
	Provider string `json:"provider" example:"local"`

	// @Description Whether the user account is active
	IsActive bool `json:"isActive" example:"true"`

	// @Description Whether the user has admin access
	IsAdmin bool `json:"isAdmin" example:"false"`

	// @Description List of user's access levels
	Accesses []string `json:"accesses" example:"user,admin"`

	// @Description Account creation timestamp
	CreatedAt string `json:"createdAt" example:"2025-01-01 12:00:00"`
}

// UserStatusUpdateRequest represents the request to update user status
// @Description Request body for updating user status
type UserStatusUpdateRequest struct {
	Active bool `json:"active" example:"true"`
}

// UserStatusUpdateResponse represents the response for status update
// @Description Response for user status update
type UserStatusUpdateResponse struct {
	Message string `json:"message" example:"User status updated successfully"`
}

func NewUsersHandler(userRepo *repository.UserRepository, roomRepo *repository.RoomRepository) *UsersHandler {
	return &UsersHandler{
		userRepo: userRepo,
		roomRepo: roomRepo,
	}
}

// @Summary List all users
// @Description Get a list of all users in the system (requires superadmin access)
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} UserListResponse "List of users"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /admin/users [get]
func (h *UsersHandler) ListUsers(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 50)
	users, total, err := h.userRepo.GetAllUsers(repository.PaginationParams{Page: page, Limit: limit})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch users",
		})
	}

	var response []UserDetails
	for _, user := range users {
		response = append(response, UserDetails{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Provider:  user.Provider,
			IsActive:  user.IsActive,
			IsAdmin:   containsAccess(user.Accesses, "admin"),
			Accesses:  user.Accesses,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return c.JSON(fiber.Map{
		"users": response,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// @Summary Update user status
// @Description Activate or deactivate a user (requires superadmin access)
// @Tags admin
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param request body UserStatusUpdateRequest true "Status update"
// @Security BearerAuth
// @Success 200 {object} UserStatusUpdateResponse "Status updated successfully"
// @Failure 400 {object} ErrorResponse "Invalid request"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "User not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /admin/users/{id}/status [put]
func (h *UsersHandler) UpdateUserAccesses(c *fiber.Ctx) error {
	claims, ok := c.Locals("user").(*auth.Claims)
	if !ok || claims == nil || !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Insufficient permissions"})
	}

	userID := c.Params("id")
	var input struct {
		Accesses []string `json:"accesses"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}
	user, err := h.userRepo.GetUserByID(userID)
	if err != nil || user == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}
	user.Accesses = input.Accesses
	if err := h.userRepo.UpdateUser(user); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update user"})
	}
	return c.JSON(fiber.Map{"message": "User accesses updated"})
}

func (h *UsersHandler) UpdateUserStatus(c *fiber.Ctx) error {
	claims, ok := c.Locals("user").(*auth.Claims)
	if !ok || claims == nil || !containsAccess(claims.Accesses, "superadmin") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Insufficient permissions"})
	}

	userID := c.Params("id")
	var input UserStatusUpdateRequest

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input",
		})
	}

	user, err := h.userRepo.GetUserByID(userID)
	if err != nil || user == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	user.IsActive = input.Active
	if err := h.userRepo.UpdateUser(user); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update user status",
		})
	}

	return c.JSON(UserStatusUpdateResponse{
		Message: "User status updated successfully",
	})
}

func (h *UsersHandler) GetUserDetail(c *fiber.Ctx) error {
	userID := c.Params("id")
	user, err := h.userRepo.GetUserByID(userID)
	if err != nil || user == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	rooms, _ := h.roomRepo.GetRoomsCreatedByUser(userID)
	if rooms == nil {
		rooms = []models.Room{}
	}

	return c.JSON(fiber.Map{
		"user": UserDetails{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			Provider:  user.Provider,
			IsActive:  user.IsActive,
			IsAdmin:   containsAccess(user.Accesses, "admin"),
			Accesses:  user.Accesses,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		"rooms": rooms,
	})
}
