package com.bedrud.app.models

import com.google.gson.annotations.SerializedName

data class Room(
    val id: String,
    val name: String,
    @SerializedName("createdBy")
    val createdBy: String,
    @SerializedName("adminId")
    val adminId: String = "",
    @SerializedName("isActive")
    val isActive: Boolean = true,
    @SerializedName("isPublic")
    val isPublic: Boolean = true,
    @SerializedName("maxParticipants")
    val maxParticipants: Int = 50,
    @SerializedName("expiresAt")
    val expiresAt: String = "",
    val settings: RoomSettings = RoomSettings(),
    val relationship: String? = null,
    val mode: String = "meeting",
    val participants: List<RoomParticipant>? = null
)

data class RoomSettings(
    @SerializedName("allowChat")
    val allowChat: Boolean = true,
    @SerializedName("allowVideo")
    val allowVideo: Boolean = true,
    @SerializedName("allowAudio")
    val allowAudio: Boolean = true,
    @SerializedName("requireApproval")
    val requireApproval: Boolean = false,
    val e2ee: Boolean = false
)

data class RoomParticipant(
    val id: String,
    @SerializedName("userId")
    val userId: String,
    val email: String,
    val name: String,
    @SerializedName("joinedAt")
    val joinedAt: String,
    @SerializedName("isActive")
    val isActive: Boolean = true,
    @SerializedName("isMuted")
    val isMuted: Boolean = false,
    @SerializedName("isVideoOff")
    val isVideoOff: Boolean = false,
    @SerializedName("isChatBlocked")
    val isChatBlocked: Boolean = false,
    val permissions: String = ""
)
