package com.bedrud.app.models

import com.google.gson.annotations.SerializedName

// --- Auth ---

data class LoginRequest(
    val email: String,
    val password: String
)

data class GuestLoginRequest(
    val name: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String
)

data class LoginResponse(
    val tokens: AuthTokens,
    val user: User
)

data class RegisterResponse(
    @SerializedName("access_token")
    val accessToken: String,
    @SerializedName("refresh_token")
    val refreshToken: String
)

data class RefreshTokenRequest(
    @SerializedName("refresh_token")
    val refreshToken: String
)

data class RefreshTokenResponse(
    @SerializedName("access_token")
    val accessToken: String,
    @SerializedName("refresh_token")
    val refreshToken: String
)

data class MeResponse(
    val id: String,
    val email: String,
    val name: String,
    @SerializedName("avatarUrl")
    val avatarUrl: String? = null,
    @SerializedName("isAdmin")
    val isAdmin: Boolean = false,
    val provider: String? = null
)

data class ChangePasswordRequest(
    @SerializedName("currentPassword")
    val currentPassword: String,
    @SerializedName("newPassword")
    val newPassword: String
)

// --- Passkeys ---

data class PasskeySignupBeginRequest(
    val email: String,
    val name: String
)

// --- Rooms ---

data class CreateRoomRequest(
    val name: String? = null,
    @SerializedName("maxParticipants")
    val maxParticipants: Int? = null,
    @SerializedName("isPublic")
    val isPublic: Boolean? = null,
    val mode: String? = null,
    val settings: RoomSettings? = null
)

data class JoinRoomRequest(
    @SerializedName("roomName")
    val roomName: String
)

data class JoinRoomResponse(
    val id: String,
    val name: String,
    val token: String,
    @SerializedName("livekitHost")
    val livekitHost: String,
    @SerializedName("createdBy")
    val createdBy: String,
    @SerializedName("adminId")
    val adminId: String,
    @SerializedName("isActive")
    val isActive: Boolean,
    @SerializedName("isPublic")
    val isPublic: Boolean,
    @SerializedName("maxParticipants")
    val maxParticipants: Int,
    @SerializedName("expiresAt")
    val expiresAt: String,
    val settings: RoomSettings,
    val mode: String
)

data class UserRoomResponse(
    val id: String,
    val name: String,
    @SerializedName("createdBy")
    val createdBy: String,
    @SerializedName("isActive")
    val isActive: Boolean,
    @SerializedName("isPublic")
    val isPublic: Boolean? = null,
    @SerializedName("maxParticipants")
    val maxParticipants: Int,
    @SerializedName("expiresAt")
    val expiresAt: String,
    val settings: RoomSettings,
    val relationship: String,
    val mode: String
)

// --- Admin ---

data class AdminUser(
    val id: String,
    val email: String,
    val name: String,
    @SerializedName("isActive") val isActive: Boolean = true,
    @SerializedName("isAdmin") val isAdmin: Boolean = false,
    val provider: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class AdminRoom(
    val id: String,
    val name: String,
    @SerializedName("isActive") val isActive: Boolean = false,
    @SerializedName("isPublic") val isPublic: Boolean = true,
    @SerializedName("maxParticipants") val maxParticipants: Int = 20,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class AdminSettings(
    @SerializedName("allowRegistrations") val allowRegistrations: Boolean = true,
    @SerializedName("requireInviteToken") val requireInviteToken: Boolean = false
)

data class InviteToken(
    val id: String,
    val token: String,
    val email: String? = null,
    @SerializedName("expiresAt") val expiresAt: String? = null,
    @SerializedName("usedAt") val usedAt: String? = null,
    val used: Boolean = false
)

// --- Admin Requests ---

data class SetAccessesRequest(val accesses: List<String>)

data class CreateInviteTokenRequest(val email: String?, val expiresInHours: Int)

// --- Generic ---

data class ApiError(
    val error: String,
    val message: String? = null
)
