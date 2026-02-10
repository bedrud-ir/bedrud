package com.bedrud.app.models

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

class RoomTest {

    private val gson = Gson()

    @Test
    fun `Room default values`() {
        val room = Room(id = "r1", name = "Room 1", createdBy = "u1")
        assertEquals("", room.adminId)
        assertTrue(room.isActive)
        assertTrue(room.isPublic)
        assertEquals(50, room.maxParticipants)
        assertEquals("", room.expiresAt)
        assertNotNull(room.settings)
        assertNull(room.relationship)
        assertEquals("meeting", room.mode)
        assertNull(room.participants)
    }

    @Test
    fun `RoomSettings default values`() {
        val settings = RoomSettings()
        assertTrue(settings.allowChat)
        assertTrue(settings.allowVideo)
        assertTrue(settings.allowAudio)
        assertFalse(settings.requireApproval)
        assertFalse(settings.e2ee)
    }

    @Test
    fun `RoomParticipant default values`() {
        val p = RoomParticipant(
            id = "p1", userId = "u1", email = "a@b.com",
            name = "Alice", joinedAt = "2024-01-01"
        )
        assertTrue(p.isActive)
        assertFalse(p.isMuted)
        assertFalse(p.isVideoOff)
        assertFalse(p.isChatBlocked)
        assertEquals("", p.permissions)
    }

    @Test
    fun `Room Gson serialization with SerializedName fields`() {
        val room = Room(
            id = "r1", name = "Room 1", createdBy = "u1",
            adminId = "a1", isActive = false, isPublic = false,
            maxParticipants = 10, expiresAt = "2025-01-01",
            mode = "webinar"
        )
        val json = gson.toJson(room)
        assertTrue(json.contains("\"createdBy\""))
        assertTrue(json.contains("\"adminId\""))
        assertTrue(json.contains("\"isActive\""))
        assertTrue(json.contains("\"maxParticipants\""))
        val deserialized = gson.fromJson(json, Room::class.java)
        assertEquals(room.id, deserialized.id)
        assertEquals(room.createdBy, deserialized.createdBy)
        assertEquals(room.maxParticipants, deserialized.maxParticipants)
        assertFalse(deserialized.isActive)
    }

    @Test
    fun `Nested Room with RoomSettings Gson round-trip`() {
        val settings = RoomSettings(
            allowChat = false, allowVideo = false,
            allowAudio = true, requireApproval = true, e2ee = true
        )
        val room = Room(id = "r1", name = "Room 1", createdBy = "u1", settings = settings)
        val json = gson.toJson(room)
        val deserialized = gson.fromJson(json, Room::class.java)
        assertFalse(deserialized.settings.allowChat)
        assertFalse(deserialized.settings.allowVideo)
        assertTrue(deserialized.settings.allowAudio)
        assertTrue(deserialized.settings.requireApproval)
        assertTrue(deserialized.settings.e2ee)
    }

    @Test
    fun `RoomParticipant Gson round-trip`() {
        val p = RoomParticipant(
            id = "p1", userId = "u1", email = "a@b.com",
            name = "Alice", joinedAt = "2024-01-01",
            isActive = false, isMuted = true, isVideoOff = true,
            isChatBlocked = true, permissions = "admin"
        )
        val json = gson.toJson(p)
        val deserialized = gson.fromJson(json, RoomParticipant::class.java)
        assertEquals(p.id, deserialized.id)
        assertEquals(p.userId, deserialized.userId)
        assertFalse(deserialized.isActive)
        assertTrue(deserialized.isMuted)
        assertTrue(deserialized.isVideoOff)
        assertTrue(deserialized.isChatBlocked)
        assertEquals("admin", deserialized.permissions)
    }
}
