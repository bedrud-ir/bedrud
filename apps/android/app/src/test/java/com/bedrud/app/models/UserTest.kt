package com.bedrud.app.models

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

class UserTest {

    private val gson = Gson()

    @Test
    fun `init with all fields`() {
        val user = User(
            id = "u1",
            email = "a@b.com",
            name = "Alice",
            avatarUrl = "https://img.com/a.png",
            isAdmin = true,
            provider = "google"
        )
        assertEquals("u1", user.id)
        assertEquals("a@b.com", user.email)
        assertEquals("Alice", user.name)
        assertEquals("https://img.com/a.png", user.avatarUrl)
        assertTrue(user.isAdmin)
        assertEquals("google", user.provider)
    }

    @Test
    fun `default values`() {
        val user = User(id = "u1", email = "a@b.com", name = "Alice")
        assertNull(user.avatarUrl)
        assertFalse(user.isAdmin)
        assertNull(user.provider)
    }

    @Test
    fun `Gson serialization round-trip with SerializedName annotations`() {
        val user = User(
            id = "u1",
            email = "a@b.com",
            name = "Alice",
            avatarUrl = "https://img.com/a.png",
            isAdmin = true,
            provider = "google"
        )
        val json = gson.toJson(user)
        val deserialized = gson.fromJson(json, User::class.java)
        assertEquals(user.id, deserialized.id)
        assertEquals(user.email, deserialized.email)
        assertEquals(user.name, deserialized.name)
        assertEquals(user.avatarUrl, deserialized.avatarUrl)
        assertEquals(user.isAdmin, deserialized.isAdmin)
        assertEquals(user.provider, deserialized.provider)
    }

    @Test
    fun `AuthTokens Gson round-trip`() {
        val tokens = AuthTokens(accessToken = "acc123", refreshToken = "ref456")
        val json = gson.toJson(tokens)
        val deserialized = gson.fromJson(json, AuthTokens::class.java)
        assertEquals("acc123", deserialized.accessToken)
        assertEquals("ref456", deserialized.refreshToken)
    }
}
