package handlers

import (
	"bedrud/internal/auth"
	"bedrud/internal/repository"
)

// isRoomModerator returns true if the user is authorised to perform moderation
// actions in the given room. A user qualifies when they are:
//   - a superadmin (global, bypasses all room checks), OR
//   - the room admin (AdminID / CreatedBy), OR
//   - promoted to moderator specifically for this room (is_moderator=true in
//     room_participants for this room).
//
// The roomOwnerID argument should be the resolved adminId (AdminID if set,
// else CreatedBy) that the caller already has available.
func isRoomModerator(claims *auth.Claims, roomOwnerID string, roomID string, roomRepo *repository.RoomRepository) bool {
	if containsAccess(claims.Accesses, "superadmin") {
		return true
	}
	if claims.UserID == roomOwnerID {
		return true
	}
	isMod, err := roomRepo.IsRoomModerator(roomID, claims.UserID)
	if err != nil {
		return false
	}
	return isMod
}
