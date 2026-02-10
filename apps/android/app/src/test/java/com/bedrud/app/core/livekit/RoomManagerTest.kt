package com.bedrud.app.core.livekit

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
