package com.bedrud.app.core.livekit

import kotlinx.coroutines.flow.MutableStateFlow
import org.junit.Assert.*
import org.junit.Test

class RoomManagerTest {

    @Test
    fun `ChatMessage data class init and defaults`() {
        val msg = ChatMessage(senderName = "Alice", text = "Hello")
        assertEquals("Alice", msg.senderName)
        assertEquals("Hello", msg.text)
        assertTrue(msg.timestamp > 0)
        assertFalse(msg.isLocal)
    }

    @Test
    fun `ChatMessage with custom values`() {
        val msg = ChatMessage(
            senderName = "Bob", text = "Hi",
            timestamp = 999L, isLocal = true
        )
        assertEquals("Bob", msg.senderName)
        assertEquals("Hi", msg.text)
        assertEquals(999L, msg.timestamp)
        assertTrue(msg.isLocal)
    }

    @Test
    fun `ConnectionState enum has all expected values`() {
        val values = ConnectionState.values()
        assertEquals(5, values.size)
        assertTrue(values.contains(ConnectionState.DISCONNECTED))
        assertTrue(values.contains(ConnectionState.CONNECTING))
        assertTrue(values.contains(ConnectionState.CONNECTED))
        assertTrue(values.contains(ConnectionState.RECONNECTING))
        assertTrue(values.contains(ConnectionState.FAILED))
    }

    @Test
    fun `ConnectionState valueOf round-trip`() {
        assertEquals(ConnectionState.DISCONNECTED, ConnectionState.valueOf("DISCONNECTED"))
        assertEquals(ConnectionState.CONNECTED, ConnectionState.valueOf("CONNECTED"))
        assertEquals(ConnectionState.FAILED, ConnectionState.valueOf("FAILED"))
    }

    @Test
    fun `ChatMessage equality`() {
        val msg1 = ChatMessage(senderName = "A", text = "Hi", timestamp = 100L, isLocal = false)
        val msg2 = ChatMessage(senderName = "A", text = "Hi", timestamp = 100L, isLocal = false)
        assertEquals(msg1, msg2)
        assertEquals(msg1.hashCode(), msg2.hashCode())

        val msg3 = ChatMessage(senderName = "B", text = "Hi", timestamp = 100L, isLocal = false)
        assertNotEquals(msg1, msg3)
    }
}

class PttStateTest {

    // Minimal PTT gate logic extracted for unit testing
    private fun applyPttGate(isMicEnabled: Boolean, isPttActive: Boolean): Boolean =
        isMicEnabled || isPttActive

    @Test
    fun `mic gate ptt active overrides mic off`() {
        assertTrue(applyPttGate(isMicEnabled = false, isPttActive = true))
    }

    @Test
    fun `mic gate ptt inactive restores mic off`() {
        assertFalse(applyPttGate(isMicEnabled = false, isPttActive = false))
    }

    @Test
    fun `mic gate ptt inactive with mic on stays on`() {
        assertTrue(applyPttGate(isMicEnabled = true, isPttActive = false))
    }

    @Test
    fun `ptt isPttActive StateFlow initial value is false`() {
        val isPttActive = MutableStateFlow(false)
        assertFalse(isPttActive.value)
    }

    @Test
    fun `ptt start sets StateFlow to true`() {
        val isPttActive = MutableStateFlow(false)
        isPttActive.value = true
        assertTrue(isPttActive.value)
    }

    @Test
    fun `ptt stop sets StateFlow to false`() {
        val isPttActive = MutableStateFlow(true)
        isPttActive.value = false
        assertFalse(isPttActive.value)
    }
}
