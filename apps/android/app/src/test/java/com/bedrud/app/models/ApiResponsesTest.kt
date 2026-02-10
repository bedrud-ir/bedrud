package com.bedrud.app.models

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

class ApiResponsesTest {

    private val gson = Gson()

    @Test
    fun `LoginRequest Gson serialization`() {
        val req = LoginRequest(email = "a@b.com", password = "pass123")
        val json = gson.toJson(req)
        assertTrue(json.contains("\"email\":\"a@b.com\""))
        assertTrue(json.contains("\"password\":\"pass123\""))
    }

    @Test
    fun `LoginResponse Gson deserialization`() {
        val json = """
            {
                "tokens": {"accessToken": "acc", "refreshToken": "ref"},
                "user": {"id": "u1", "email": "a@b.com", "name": "Alice"}
            }
        """.trimIndent()
        val resp = gson.fromJson(json, LoginResponse::class.java)
        assertEquals("acc", resp.tokens.accessToken)
        assertEquals("ref", resp.tokens.refreshToken)
        assertEquals("u1", resp.user.id)
        assertEquals("Alice", resp.user.name)
    }

    @Test
    fun `RegisterRequest Gson serialization`() {
        val req = RegisterRequest(email = "a@b.com", password = "pass", name = "Alice")
        val json = gson.toJson(req)
        assertTrue(json.contains("\"email\""))
        assertTrue(json.contains("\"password\""))
        assertTrue(json.contains("\"name\""))
    }

    @Test
    fun `RegisterResponse Gson with SerializedName`() {
        val json = """{"access_token": "acc123", "refresh_token": "ref456"}"""
        val resp = gson.fromJson(json, RegisterResponse::class.java)
        assertEquals("acc123", resp.accessToken)
        assertEquals("ref456", resp.refreshToken)
    }

    @Test
    fun `RefreshTokenRequest Gson serialization uses refresh_token key`() {
        val req = RefreshTokenRequest(refreshToken = "mytoken")
        val json = gson.toJson(req)
        assertTrue(json.contains("\"refresh_token\""))
        assertTrue(json.contains("mytoken"))
    }

    @Test
    fun `RefreshTokenResponse Gson deserialization`() {
        val json = """{"access_token": "new_acc", "refresh_token": "new_ref"}"""
        val resp = gson.fromJson(json, RefreshTokenResponse::class.java)
        assertEquals("new_acc", resp.accessToken)
        assertEquals("new_ref", resp.refreshToken)
    }

    @Test
    fun `MeResponse Gson deserialization`() {
        val json = """
            {"id":"u1","email":"a@b.com","name":"Alice","avatarUrl":"https://img.com/a.png","isAdmin":true,"provider":"google"}
        """.trimIndent()
        val resp = gson.fromJson(json, MeResponse::class.java)
        assertEquals("u1", resp.id)
        assertEquals("a@b.com", resp.email)
        assertEquals("Alice", resp.name)
        assertEquals("https://img.com/a.png", resp.avatarUrl)
        assertTrue(resp.isAdmin)
        assertEquals("google", resp.provider)
    }

    @Test
    fun `CreateRoomRequest with null optional fields`() {
        val req = CreateRoomRequest()
        val json = gson.toJson(req)
        val deserialized = gson.fromJson(json, CreateRoomRequest::class.java)
        assertNull(deserialized.name)
        assertNull(deserialized.maxParticipants)
        assertNull(deserialized.isPublic)
        assertNull(deserialized.mode)
        assertNull(deserialized.settings)
    }

    @Test
    fun `JoinRoomRequest and JoinRoomResponse Gson round-trip`() {
        val req = JoinRoomRequest(roomName = "my-room")
        val reqJson = gson.toJson(req)
        assertTrue(reqJson.contains("\"roomName\""))

        val respJson = """
            {
                "id":"r1","name":"my-room","token":"tok123","livekitHost":"wss://lk.example.com",
                "createdBy":"u1","adminId":"u1","isActive":true,"isPublic":true,
                "maxParticipants":50,"expiresAt":"","settings":{"allowChat":true,"allowVideo":true,"allowAudio":true,"requireApproval":false,"e2ee":false},
                "mode":"meeting"
            }
        """.trimIndent()
        val resp = gson.fromJson(respJson, JoinRoomResponse::class.java)
        assertEquals("r1", resp.id)
        assertEquals("tok123", resp.token)
        assertEquals("wss://lk.example.com", resp.livekitHost)
        assertTrue(resp.settings.allowChat)
    }

    @Test
    fun `UserRoomResponse Gson deserialization`() {
        val json = """
            {
                "id":"r1","name":"Room 1","createdBy":"u1","isActive":true,
                "maxParticipants":50,"expiresAt":"",
                "settings":{"allowChat":true,"allowVideo":true,"allowAudio":true,"requireApproval":false,"e2ee":false},
                "relationship":"owner","mode":"meeting"
            }
        """.trimIndent()
        val resp = gson.fromJson(json, UserRoomResponse::class.java)
        assertEquals("r1", resp.id)
        assertEquals("owner", resp.relationship)
        assertEquals("meeting", resp.mode)
    }

    @Test
    fun `ApiError Gson deserialization`() {
        val json = """{"error": "not_found", "message": "Room not found"}"""
        val err = gson.fromJson(json, ApiError::class.java)
        assertEquals("not_found", err.error)
        assertEquals("Room not found", err.message)
    }
}
