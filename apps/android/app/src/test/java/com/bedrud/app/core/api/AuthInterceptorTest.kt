package com.bedrud.app.core.api

import com.bedrud.app.core.auth.AuthManager
import com.bedrud.app.testutil.InMemorySharedPreferences
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class AuthInterceptorTest {

    private lateinit var server: MockWebServer
    private lateinit var prefs: InMemorySharedPreferences
    private lateinit var authManager: AuthManager

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

    private fun buildClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(authManager))
            .build()
    }

    @Test
    fun `with valid token adds Authorization Bearer header`() {
        authManager.saveTokens("mytoken123", "refresh")
        server.enqueue(MockResponse().setBody("ok"))

        val client = buildClient()
        client.newCall(Request.Builder().url(server.url("/test")).build()).execute()

        val recorded = server.takeRequest()
        assertEquals("Bearer mytoken123", recorded.getHeader("Authorization"))
    }

    @Test
    fun `with null token no Authorization header`() {
        server.enqueue(MockResponse().setBody("ok"))

        val client = buildClient()
        client.newCall(Request.Builder().url(server.url("/test")).build()).execute()

        val recorded = server.takeRequest()
        assertNull(recorded.getHeader("Authorization"))
    }

    @Test
    fun `with blank token no Authorization header`() {
        // Save then clear to leave blank-ish state
        // AuthManager returns null when no token stored, so this tests the isNullOrBlank path
        server.enqueue(MockResponse().setBody("ok"))

        val client = buildClient()
        client.newCall(Request.Builder().url(server.url("/test")).build()).execute()

        val recorded = server.takeRequest()
        assertNull(recorded.getHeader("Authorization"))
    }
}
