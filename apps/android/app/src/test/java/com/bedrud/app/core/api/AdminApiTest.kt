package com.bedrud.app.core.api

import com.bedrud.app.models.*
import com.google.gson.Gson
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class AdminApiTest {

    private lateinit var server: MockWebServer
    private lateinit var adminApi: AdminApi
    private val gson = Gson()

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        val retrofit = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        adminApi = retrofit.create(AdminApi::class.java)
    }

    @After
    fun tearDown() { server.shutdown() }

    // MARK: - Users

    @Test
    fun `listUsers sends GET to admin-users and parses list`() = runBlocking {
        val users = listOf(
            AdminUser(id = "u1", email = "a@b.com", name = "Alice", isActive = true,
                isAdmin = false, provider = "local", createdAt = "2025-01-01")
        )
        server.enqueue(MockResponse().setBody(gson.toJson(users)).setResponseCode(200))

        val response = adminApi.listUsers()
        val request = server.takeRequest()

        assertEquals("GET", request.method)
        assertEquals("/admin/users", request.path)
        assertTrue(response.isSuccessful)
        assertEquals(1, response.body()!!.size)
        assertEquals("u1", response.body()!![0].id)
        assertEquals("Alice", response.body()!![0].name)
    }

    @Test
    fun `listUsers returns empty list on empty response`() = runBlocking {
        server.enqueue(MockResponse().setBody("[]").setResponseCode(200))
        val response = adminApi.listUsers()
        assertTrue(response.isSuccessful)
        assertEquals(0, response.body()!!.size)
    }

    @Test
    fun `setUserStatus sends PUT to admin-users-id-status`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        val response = adminApi.setUserStatus("user123", mapOf("active" to false))
        val request = server.takeRequest()

        assertEquals("PUT", request.method)
        assertEquals("/admin/users/user123/status", request.path)
        val body = request.body.readUtf8()
        assertTrue(body.contains("\"active\":false"))
        assertTrue(response.isSuccessful)
    }

    @Test
    fun `setUserStatus activate sends active true`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        adminApi.setUserStatus("u1", mapOf("active" to true))
        val request = server.takeRequest()

        val body = request.body.readUtf8()
        assertTrue(body.contains("\"active\":true"))
    }

    @Test
    fun `setUserAccesses sends PUT with accesses array`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        val response = adminApi.setUserAccesses("user123", mapOf("accesses" to listOf("admin", "moderator")))
        val request = server.takeRequest()

        assertEquals("PUT", request.method)
        assertEquals("/admin/users/user123/accesses", request.path)
        val body = request.body.readUtf8()
        assertTrue(body.contains("admin"))
        assertTrue(body.contains("moderator"))
        assertTrue(response.isSuccessful)
    }

    // MARK: - Rooms

    @Test
    fun `listRooms sends GET to admin-rooms and parses list`() = runBlocking {
        val rooms = listOf(
            AdminRoom(id = "r1", name = "Main Room", isActive = true,
                isPublic = true, maxParticipants = 50, createdAt = "2025-01-01")
        )
        server.enqueue(MockResponse().setBody(gson.toJson(rooms)).setResponseCode(200))

        val response = adminApi.listRooms()
        val request = server.takeRequest()

        assertEquals("GET", request.method)
        assertEquals("/admin/rooms", request.path)
        assertTrue(response.isSuccessful)
        assertEquals(1, response.body()!!.size)
        assertEquals("r1", response.body()!![0].id)
        assertTrue(response.body()!![0].isActive)
    }

    @Test
    fun `deleteRoom sends DELETE to admin-rooms-id`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        val response = adminApi.deleteRoom("room456")
        val request = server.takeRequest()

        assertEquals("DELETE", request.method)
        assertEquals("/admin/rooms/room456", request.path)
        assertTrue(response.isSuccessful)
    }

    @Test
    fun `updateRoom sends PUT with maxParticipants`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        val response = adminApi.updateRoom("room789", mapOf("maxParticipants" to 100))
        val request = server.takeRequest()

        assertEquals("PUT", request.method)
        assertEquals("/admin/rooms/room789", request.path)
        val body = request.body.readUtf8()
        assertTrue(body.contains("100"))
        assertTrue(response.isSuccessful)
    }

    // MARK: - Settings

    @Test
    fun `getSettings sends GET to admin-settings and parses response`() = runBlocking {
        val settings = AdminSettings(allowRegistrations = true, requireInviteToken = false)
        server.enqueue(MockResponse().setBody(gson.toJson(settings)).setResponseCode(200))

        val response = adminApi.getSettings()
        val request = server.takeRequest()

        assertEquals("GET", request.method)
        assertEquals("/admin/settings", request.path)
        assertTrue(response.isSuccessful)
        assertTrue(response.body()!!.allowRegistrations)
        assertFalse(response.body()!!.requireInviteToken)
    }

    @Test
    fun `updateSettings sends PUT with all fields`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        val settings = AdminSettings(allowRegistrations = false, requireInviteToken = true)
        val response = adminApi.updateSettings(settings)
        val request = server.takeRequest()

        assertEquals("PUT", request.method)
        assertEquals("/admin/settings", request.path)
        val body = request.body.readUtf8()
        assertTrue(body.contains("\"allowRegistrations\":false"))
        assertTrue(body.contains("\"requireInviteToken\":true"))
        assertTrue(response.isSuccessful)
    }

    // MARK: - Invite Tokens

    @Test
    fun `listInviteTokens sends GET to admin-invite-tokens`() = runBlocking {
        val tokens = listOf(
            InviteToken(id = "t1", token = "tok-abc123", email = "x@y.com",
                expiresAt = "2025-12-31", usedAt = null, used = false)
        )
        server.enqueue(MockResponse().setBody(gson.toJson(tokens)).setResponseCode(200))

        val response = adminApi.listInviteTokens()
        val request = server.takeRequest()

        assertEquals("GET", request.method)
        assertEquals("/admin/invite-tokens", request.path)
        assertTrue(response.isSuccessful)
        assertEquals("t1", response.body()!![0].id)
        assertEquals("tok-abc123", response.body()!![0].token)
    }

    @Test
    fun `createInviteToken sends POST with email and expiresInHours`() = runBlocking {
        val token = InviteToken(id = "t2", token = "new-token", email = "new@user.com",
            expiresAt = "2025-06-01", usedAt = null, used = false)
        server.enqueue(MockResponse().setBody(gson.toJson(token)).setResponseCode(200))

        val body = mapOf("email" to "new@user.com", "expiresInHours" to 48)
        val response = adminApi.createInviteToken(body)
        val request = server.takeRequest()

        assertEquals("POST", request.method)
        assertEquals("/admin/invite-tokens", request.path)
        val reqBody = request.body.readUtf8()
        assertTrue(reqBody.contains("new@user.com"))
        assertTrue(reqBody.contains("48"))
        assertTrue(response.isSuccessful)
        assertEquals("t2", response.body()!!.id)
    }

    @Test
    fun `createInviteToken without email sends null email`() = runBlocking {
        val token = InviteToken(id = "t3", token = "anon-token", email = null,
            expiresAt = null, usedAt = null, used = false)
        server.enqueue(MockResponse().setBody(gson.toJson(token)).setResponseCode(200))

        val body = mapOf("email" to null, "expiresInHours" to 24)
        adminApi.createInviteToken(body)
        val request = server.takeRequest()

        val reqBody = request.body.readUtf8()
        assertTrue(reqBody.contains("24"))
    }

    @Test
    fun `deleteInviteToken sends DELETE to admin-invite-tokens-id`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        val response = adminApi.deleteInviteToken("token-id-999")
        val request = server.takeRequest()

        assertEquals("DELETE", request.method)
        assertEquals("/admin/invite-tokens/token-id-999", request.path)
        assertTrue(response.isSuccessful)
    }

    // MARK: - Online Count

    @Test
    fun `getOnlineCount sends GET to admin-online-count and parses count`() = runBlocking {
        server.enqueue(MockResponse().setBody("{\"count\":42}").setResponseCode(200))

        val response = adminApi.getOnlineCount()
        val request = server.takeRequest()

        assertEquals("GET", request.method)
        assertEquals("/admin/online-count", request.path)
        assertTrue(response.isSuccessful)
        assertEquals(42, response.body()!!["count"])
    }

    @Test
    fun `getOnlineCount returns 0 when count is zero`() = runBlocking {
        server.enqueue(MockResponse().setBody("{\"count\":0}").setResponseCode(200))

        val response = adminApi.getOnlineCount()
        assertEquals(0, response.body()!!["count"])
    }

    // MARK: - Error Responses

    @Test
    fun `listUsers returns error on 403`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(403))
        val response = adminApi.listUsers()
        assertFalse(response.isSuccessful)
        assertEquals(403, response.code())
    }

    @Test
    fun `deleteRoom returns error on 404`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(404))
        val response = adminApi.deleteRoom("nonexistent")
        assertFalse(response.isSuccessful)
        assertEquals(404, response.code())
    }

    @Test
    fun `updateSettings returns error on 500`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(500))
        val response = adminApi.updateSettings(AdminSettings(allowRegistrations = true, requireInviteToken = false))
        assertFalse(response.isSuccessful)
        assertEquals(500, response.code())
    }
}
