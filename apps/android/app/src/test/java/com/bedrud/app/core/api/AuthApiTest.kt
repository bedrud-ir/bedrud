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

class AuthApiTest {

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
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `login sends POST to auth-login with correct body`() = runBlocking {
        val responseBody = gson.toJson(
            LoginResponse(
                tokens = AuthTokens(accessToken = "acc", refreshToken = "ref"),
                user = User(id = "u1", email = "a@b.com", name = "Alice")
            )
        )
        server.enqueue(MockResponse().setBody(responseBody).setResponseCode(200))

        val response = authApi.login(LoginRequest(email = "a@b.com", password = "pass"))

        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/auth/login", request.path)
        val body = request.body.readUtf8()
        assertTrue(body.contains("a@b.com"))
        assertTrue(body.contains("pass"))

        assertTrue(response.isSuccessful)
        assertEquals("acc", response.body()!!.tokens.accessToken)
        assertEquals("u1", response.body()!!.user.id)
    }

    @Test
    fun `register sends POST to auth-register and parses RegisterResponse`() = runBlocking {
        val responseBody = gson.toJson(
            RegisterResponse(accessToken = "acc", refreshToken = "ref")
        )
        server.enqueue(MockResponse().setBody(responseBody).setResponseCode(200))

        val response = authApi.register(
            RegisterRequest(email = "a@b.com", password = "pass", name = "Alice")
        )

        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/auth/register", request.path)
        assertTrue(response.isSuccessful)
        assertEquals("acc", response.body()!!.accessToken)
    }

    @Test
    fun `guestLogin sends POST to auth-guest-login`() = runBlocking {
        val responseBody = gson.toJson(
            LoginResponse(
                tokens = AuthTokens(accessToken = "acc", refreshToken = "ref"),
                user = User(id = "g1", email = "guest@b.com", name = "Guest")
            )
        )
        server.enqueue(MockResponse().setBody(responseBody).setResponseCode(200))

        val response = authApi.guestLogin(GuestLoginRequest(name = "Guest"))

        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/auth/guest-login", request.path)
        assertTrue(response.isSuccessful)
    }

    @Test
    fun `refreshToken sends POST to auth-refresh with refresh_token key`() = runBlocking {
        val responseBody = gson.toJson(
            RefreshTokenResponse(accessToken = "new_acc", refreshToken = "new_ref")
        )
        server.enqueue(MockResponse().setBody(responseBody).setResponseCode(200))

        val response = authApi.refreshToken(RefreshTokenRequest(refreshToken = "old_ref"))

        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/auth/refresh", request.path)
        val body = request.body.readUtf8()
        assertTrue(body.contains("refresh_token"))
        assertTrue(body.contains("old_ref"))
        assertTrue(response.isSuccessful)
        assertEquals("new_acc", response.body()!!.accessToken)
    }

    @Test
    fun `getMe sends GET to auth-me and parses MeResponse`() = runBlocking {
        val responseBody = gson.toJson(
            MeResponse(id = "u1", email = "a@b.com", name = "Alice")
        )
        server.enqueue(MockResponse().setBody(responseBody).setResponseCode(200))

        val response = authApi.getMe()

        val request = server.takeRequest()
        assertEquals("GET", request.method)
        assertEquals("/auth/me", request.path)
        assertTrue(response.isSuccessful)
        assertEquals("u1", response.body()!!.id)
        assertEquals("Alice", response.body()!!.name)
    }
}
