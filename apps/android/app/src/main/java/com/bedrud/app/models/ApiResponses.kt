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
    @SerializedName("maxParticipants")
    val maxParticipants: Int,
    @SerializedName("expiresAt")
    val expiresAt: String,
    val settings: RoomSettings,
    val relationship: String,
    val mode: String
)

// --- Generic ---

data class ApiError(
    val error: String,
    val message: String? = null
)
