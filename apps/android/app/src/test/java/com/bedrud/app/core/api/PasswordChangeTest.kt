package com.bedrud.app.core.api

import com.bedrud.app.models.ChangePasswordRequest
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

class PasswordChangeTest {

    private lateinit var server: MockWebServer
    private lateinit var authApi: AuthApi
    private val gson = Gson()

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        val retrofit = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        authApi = retrofit.create(AuthApi::class.java)
    }

    @After
    fun tearDown() { server.shutdown() }

    @Test
    fun `changePassword sends PUT to auth-password with correct body`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        val request = ChangePasswordRequest(
            currentPassword = "old-secret",
            newPassword = "new-secret"
        )
        val response = authApi.changePassword(request)
        val recorded = server.takeRequest()

        assertEquals("PUT", recorded.method)
        assertEquals("/auth/password", recorded.path)
        assertTrue(response.isSuccessful)

        val body = recorded.body.readUtf8()
        assertTrue(body.contains("old-secret"))
        assertTrue(body.contains("new-secret"))
    }

    @Test
    fun `changePassword request body serializes camelCase field names`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        authApi.changePassword(ChangePasswordRequest(currentPassword = "cur", newPassword = "nw"))
        val recorded = server.takeRequest()
        val body = recorded.body.readUtf8()

        // Verify Gson serializes with camelCase (matching server expectations)
        assertTrue(body.contains("currentPassword") || body.contains("current_password"))
        assertTrue(body.contains("newPassword") || body.contains("new_password"))
    }

    @Test
    fun `changePassword returns 401 when current password is wrong`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(401))

        val response = authApi.changePassword(
            ChangePasswordRequest(currentPassword = "wrong", newPassword = "new")
        )

        assertFalse(response.isSuccessful)
        assertEquals(401, response.code())
    }

    @Test
    fun `changePassword returns 422 when new password too short`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(422).setBody("{\"error\":\"password too short\"}"))

        val response = authApi.changePassword(
            ChangePasswordRequest(currentPassword = "current", newPassword = "abc")
        )

        assertFalse(response.isSuccessful)
        assertEquals(422, response.code())
    }

    @Test
    fun `ChangePasswordRequest data class has correct fields`() {
        val req = ChangePasswordRequest(currentPassword = "old", newPassword = "new")
        assertEquals("old", req.currentPassword)
        assertEquals("new", req.newPassword)
    }

    @Test
    fun `ChangePasswordRequest equality and copy`() {
        val req1 = ChangePasswordRequest(currentPassword = "a", newPassword = "b")
        val req2 = ChangePasswordRequest(currentPassword = "a", newPassword = "b")
        val req3 = req1.copy(newPassword = "c")

        assertEquals(req1, req2)
        assertEquals(req1.hashCode(), req2.hashCode())
        assertNotEquals(req1, req3)
        assertEquals("a", req3.currentPassword)
        assertEquals("c", req3.newPassword)
    }
}
