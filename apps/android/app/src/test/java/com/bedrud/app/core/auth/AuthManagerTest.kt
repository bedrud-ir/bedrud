package com.bedrud.app.core.auth

import com.bedrud.app.models.AuthTokens
import com.bedrud.app.models.User
import com.bedrud.app.testutil.InMemorySharedPreferences
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class AuthManagerTest {

    private lateinit var prefs: InMemorySharedPreferences
    private lateinit var authManager: AuthManager

    @Before
    fun setUp() {
        prefs = InMemorySharedPreferences()
        authManager = AuthManager(prefs)
    }

    @Test
    fun `init with empty prefs - isLoggedIn false and currentUser null`() {
        assertFalse(authManager.isLoggedIn.value)
        assertNull(authManager.currentUser.value)
    }

    @Test
    fun `saveTokens stores and sets isLoggedIn true`() {
        authManager.saveTokens("access123", "refresh456")

        assertTrue(authManager.isLoggedIn.value)
        assertEquals("access123", authManager.getAccessToken())
        assertEquals("refresh456", authManager.getRefreshToken())
    }

    @Test
    fun `getAccessToken and getRefreshToken return stored values`() {
        authManager.saveTokens("acc", "ref")

        assertEquals("acc", authManager.getAccessToken())
        assertEquals("ref", authManager.getRefreshToken())
    }

    @Test
    fun `saveTokens AuthTokens overload works`() {
        val tokens = AuthTokens(accessToken = "acc2", refreshToken = "ref2")
        authManager.saveTokens(tokens)

        assertTrue(authManager.isLoggedIn.value)
        assertEquals("acc2", authManager.getAccessToken())
        assertEquals("ref2", authManager.getRefreshToken())
    }

    @Test
    fun `saveUser stores and updates currentUser StateFlow`() {
        val user = User(id = "u1", email = "a@b.com", name = "Alice")
        authManager.saveUser(user)

        val current = authManager.currentUser.value
        assertNotNull(current)
        assertEquals("u1", current!!.id)
        assertEquals("a@b.com", current.email)
        assertEquals("Alice", current.name)
    }

    @Test
    fun `loadUser on init restores user from prefs`() {
        val user = User(id = "u1", email = "a@b.com", name = "Alice", isAdmin = true)
        authManager.saveUser(user)

        // Create a new AuthManager with the same prefs
        val authManager2 = AuthManager(prefs)
        val loaded = authManager2.currentUser.value
        assertNotNull(loaded)
        assertEquals("u1", loaded!!.id)
        assertEquals("a@b.com", loaded.email)
        assertTrue(loaded.isAdmin)
    }

    @Test
    fun `logout clears tokens and user, sets isLoggedIn false`() {
        authManager.saveTokens("acc", "ref")
        authManager.saveUser(User(id = "u1", email = "a@b.com", name = "Alice"))

        authManager.logout()

        assertFalse(authManager.isLoggedIn.value)
        assertNull(authManager.currentUser.value)
        assertNull(authManager.getAccessToken())
        assertNull(authManager.getRefreshToken())
    }

    @Test
    fun `isAuthenticated returns true when token exists`() {
        assertFalse(authManager.isAuthenticated())
        authManager.saveTokens("acc", "ref")
        assertTrue(authManager.isAuthenticated())
    }

    @Test
    fun `Gson round-trip of User through prefs`() {
        val user = User(
            id = "u1", email = "a@b.com", name = "Alice",
            avatarUrl = "https://img.com/a.png", isAdmin = true, provider = "google"
        )
        authManager.saveUser(user)

        val authManager2 = AuthManager(prefs)
        val loaded = authManager2.currentUser.value
        assertNotNull(loaded)
        assertEquals(user.id, loaded!!.id)
        assertEquals(user.email, loaded.email)
        assertEquals(user.name, loaded.name)
        assertEquals(user.avatarUrl, loaded.avatarUrl)
        assertEquals(user.isAdmin, loaded.isAdmin)
        assertEquals(user.provider, loaded.provider)
    }
}
