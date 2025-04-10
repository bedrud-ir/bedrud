package handlers

import (
	"bedrud-backend/internal/repository"

	"github.com/gofiber/fiber/v2"
)

type UsersHandler struct {
	userRepo *repository.UserRepository
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

func NewUsersHandler(userRepo *repository.UserRepository) *UsersHandler {
	return &UsersHandler{
		userRepo: userRepo,
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
	users, err := h.userRepo.GetAllUsers()
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
			Accesses:  user.Accesses,
			CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return c.JSON(UserListResponse{Users: response})
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
func (h *UsersHandler) UpdateUserStatus(c *fiber.Ctx) error {
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
