package com.bedrud.app.models

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

class InstanceTest {

    private val gson = Gson()

    @Test
    fun `default values are generated`() {
        val instance = Instance(serverURL = "https://example.com", displayName = "Test")
        assertNotNull(instance.id)
        assertTrue(instance.id.isNotEmpty())
        assertNotNull(instance.iconColorHex)
        assertTrue(instance.addedAt > 0)
    }

    @Test
    fun `apiBaseURL without trailing slash`() {
        val instance = Instance(serverURL = "https://example.com", displayName = "Test")
        assertEquals("https://example.com/api", instance.apiBaseURL)
    }

    @Test
    fun `apiBaseURL with trailing slash`() {
        val instance = Instance(serverURL = "https://example.com/", displayName = "Test")
        assertEquals("https://example.com/api", instance.apiBaseURL)
    }

    @Test
    fun `Gson serialization round-trip`() {
        val instance = Instance(
            id = "test-id",
            serverURL = "https://example.com",
            displayName = "Test",
            iconColorHex = "#3B82F6",
            addedAt = 1000L
        )
        val json = gson.toJson(instance)
        val deserialized = gson.fromJson(json, Instance::class.java)
        assertEquals(instance.id, deserialized.id)
        assertEquals(instance.serverURL, deserialized.serverURL)
        assertEquals(instance.displayName, deserialized.displayName)
        assertEquals(instance.iconColorHex, deserialized.iconColorHex)
        assertEquals(instance.addedAt, deserialized.addedAt)
    }

    @Test
    fun `Account default values`() {
        val account = Account(instanceId = "inst-1")
        assertEquals("inst-1", account.instanceId)
        assertNull(account.userId)
        assertNull(account.userName)
        assertNull(account.userEmail)
        assertFalse(account.isLoggedIn)
    }

    @Test
    fun `HealthResponse default null fields`() {
        val health = HealthResponse()
        assertNull(health.status)
        assertNull(health.version)
    }

    @Test
    fun `randomColor returns valid hex from known set`() {
        val knownColors = setOf("#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316")
        repeat(50) {
            val instance = Instance(serverURL = "https://x.com", displayName = "T")
            assertTrue(
                "Color ${instance.iconColorHex} not in known set",
                instance.iconColorHex in knownColors
            )
        }
    }
}
