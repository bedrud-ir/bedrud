package com.bedrud.app.core.api

import com.bedrud.app.core.auth.AuthManager
import com.bedrud.app.models.RefreshTokenResponse
import com.bedrud.app.testutil.InMemorySharedPreferences
import com.google.gson.Gson
import io.mockk.mockk
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.util.concurrent.TimeUnit

class TokenAuthenticatorTest {

    private lateinit var server: MockWebServer
    private lateinit var prefs: InMemorySharedPreferences
    private lateinit var authManager: AuthManager
    private val gson = Gson()

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        prefs = InMemorySharedPreferences()
        authManager = AuthManager(prefs)
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    private fun buildAuthenticator(): TokenAuthenticator {
        val baseUrl = server.url("/").toString()
        return TokenAuthenticator(
            authManager = authManager,
            baseURL = baseUrl,
            authApiProvider = { mockk<AuthApi>() }
        )
    }

    @Test
    fun `successful refresh saves new tokens and retries with new token`() {
        authManager.saveTokens("old_access", "old_refresh")

        val authenticator = buildAuthenticator()
        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(authManager))
            .authenticator(authenticator)
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .build()

        // First: 401 on the original request
        server.enqueue(MockResponse().setResponseCode(401))
        // Second: refresh endpoint returns new tokens (called by internal Retrofit)
        val refreshBody = gson.toJson(
            RefreshTokenResponse(accessToken = "new_access", refreshToken = "new_refresh")
        )
        server.enqueue(MockResponse().setBody(refreshBody).setResponseCode(200))
        // Third: retried request succeeds
        server.enqueue(MockResponse().setBody("success").setResponseCode(200))

        val response = client.newCall(
            Request.Builder().url(server.url("/api/test")).build()
        ).execute()

        assertEquals(200, response.code)
        assertEquals("new_access", authManager.getAccessToken())
        assertEquals("new_refresh", authManager.getRefreshToken())

        // Verify the retry had the new token
        server.takeRequest() // original
        server.takeRequest() // refresh call
        val retry = server.takeRequest()
        assertEquals("Bearer new_access", retry.getHeader("Authorization"))
    }

    @Test
    fun `no refresh token calls logout and returns null`() {
        // Don't save any tokens → getRefreshToken() returns null
        val authenticator = buildAuthenticator()

        val client = OkHttpClient.Builder()
            .authenticator(authenticator)
            .build()

        server.enqueue(MockResponse().setResponseCode(401))

        val response = client.newCall(
            Request.Builder().url(server.url("/api/test")).build()
        ).execute()

        assertEquals(401, response.code)
        assertFalse(authManager.isLoggedIn.value)
    }

    @Test
    fun `failed refresh returns 401 and logs out`() {
        authManager.saveTokens("acc", "ref")

        val authenticator = buildAuthenticator()
        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(authManager))
            .authenticator(authenticator)
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .build()

        // First: 401 on the original request
        server.enqueue(MockResponse().setResponseCode(401))
        // Second: refresh endpoint also fails
        server.enqueue(MockResponse().setResponseCode(401))

        val response = client.newCall(
            Request.Builder().url(server.url("/api/test")).build()
        ).execute()

        assertEquals(401, response.code)
        assertFalse(authManager.isLoggedIn.value)
    }

    @Test
    fun `max retries exceeded calls logout`() {
        authManager.saveTokens("acc", "ref")

        val authenticator = buildAuthenticator()
        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(authManager))
            .authenticator(authenticator)
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.SECONDS)
            .build()

        // First: 401 on original
        server.enqueue(MockResponse().setResponseCode(401))
        // Second: refresh succeeds with new tokens
        val refreshBody = gson.toJson(
            RefreshTokenResponse(accessToken = "new_acc", refreshToken = "new_ref")
        )
        server.enqueue(MockResponse().setBody(refreshBody).setResponseCode(200))
        // Third: retried request also 401 → triggers authenticator again with responseCount >= 2
        server.enqueue(MockResponse().setResponseCode(401))

        val response = client.newCall(
            Request.Builder().url(server.url("/api/test")).build()
        ).execute()

        // After second 401, responseCount >= 2, so authenticator returns null
        assertEquals(401, response.code)
        assertFalse(authManager.isLoggedIn.value)
    }
}
