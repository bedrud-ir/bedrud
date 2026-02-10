package com.bedrud.app.core.livekit

import android.app.Application
import android.util.Log
import io.livekit.android.LiveKit
import io.livekit.android.events.RoomEvent
import io.livekit.android.events.collect
import io.livekit.android.room.Room
import io.livekit.android.room.RoomException
import io.livekit.android.room.track.DataPublishReliability
import io.livekit.android.room.participant.LocalParticipant
import io.livekit.android.room.participant.RemoteParticipant
import io.livekit.android.room.track.CameraPosition
import io.livekit.android.room.track.LocalAudioTrack
import io.livekit.android.room.track.LocalVideoTrack
import io.livekit.android.room.track.Track
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject

enum class ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    RECONNECTING,
    FAILED
}

data class ChatMessage(
    val senderName: String,
    val text: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isLocal: Boolean = false
)

class RoomManager(private val application: Application) {

    private var _room: Room? = null
    val room: Room? get() = _room

    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private val _isMicEnabled = MutableStateFlow(true)
    val isMicEnabled: StateFlow<Boolean> = _isMicEnabled.asStateFlow()

    private val _isCameraEnabled = MutableStateFlow(true)
    val isCameraEnabled: StateFlow<Boolean> = _isCameraEnabled.asStateFlow()

    private val _isScreenShareEnabled = MutableStateFlow(false)
    val isScreenShareEnabled: StateFlow<Boolean> = _isScreenShareEnabled.asStateFlow()

    private val _remoteParticipants = MutableStateFlow<List<RemoteParticipant>>(emptyList())
    val remoteParticipants: StateFlow<List<RemoteParticipant>> = _remoteParticipants.asStateFlow()

    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    /**
     * Connect to a LiveKit room with the given server URL and access token.
     */
    suspend fun connect(url: String, token: String) {
        try {
            _connectionState.value = ConnectionState.CONNECTING
            _error.value = null

            val room = LiveKit.create(application)
            _room = room

            room.connect(url, token)

            _connectionState.value = ConnectionState.CONNECTED

            // Listen for data messages (chat)
            CoroutineScope(Dispatchers.Main).launch {
                room.events.collect { event ->
                    when (event) {
                        is RoomEvent.DataReceived -> {
                            try {
                                val json = JSONObject(String(event.data, Charsets.UTF_8))
                                if (json.optString("type") == "chat") {
                                    val msg = ChatMessage(
                                        senderName = json.optString("senderName", "Unknown"),
                                        text = json.optString("message", ""),
                                        isLocal = false
                                    )
                                    _chatMessages.value = _chatMessages.value + msg
                                }
                            } catch (_: Exception) {}
                        }
                        else -> {}
                    }
                }
            }

            Log.d(TAG, "Connected to room: ${room.name}")
        } catch (e: RoomException) {
            Log.e(TAG, "Failed to connect to room", e)
            _connectionState.value = ConnectionState.FAILED
            _error.value = e.message ?: "Connection failed"
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error connecting to room", e)
            _connectionState.value = ConnectionState.FAILED
            _error.value = e.message ?: "Unexpected error"
        }
    }

    /**
     * Disconnect from the current room and clean up resources.
     */
    fun disconnect() {
        _room?.disconnect()
        _room?.release()
        _room = null
        _connectionState.value = ConnectionState.DISCONNECTED
        _isMicEnabled.value = true
        _isCameraEnabled.value = true
        _isScreenShareEnabled.value = false
        _remoteParticipants.value = emptyList()
        _chatMessages.value = emptyList()
        _error.value = null
        Log.d(TAG, "Disconnected from room")
    }

    /**
     * Toggle the local microphone on/off.
     */
    suspend fun toggleMicrophone() {
        val localParticipant = _room?.localParticipant ?: return
        val enabled = !_isMicEnabled.value
        localParticipant.setMicrophoneEnabled(enabled)
        _isMicEnabled.value = enabled
    }

    /**
     * Toggle the local camera on/off.
     */
    suspend fun toggleCamera() {
        val localParticipant = _room?.localParticipant ?: return
        val enabled = !_isCameraEnabled.value
        localParticipant.setCameraEnabled(enabled)
        _isCameraEnabled.value = enabled
    }

    /**
     * Switch between front and back cameras.
     */
    fun switchCamera() {
        val localParticipant = _room?.localParticipant ?: return
        val videoTrack = localParticipant.getTrackPublication(Track.Source.CAMERA)
            ?.track as? LocalVideoTrack ?: return

        val options = videoTrack.options.copy(
            position = if (videoTrack.options.position == CameraPosition.FRONT) {
                CameraPosition.BACK
            } else {
                CameraPosition.FRONT
            }
        )
        videoTrack.restartTrack(options)
    }

    /**
     * Toggle screen sharing on/off.
     */
    suspend fun toggleScreenShare() {
        val localParticipant = _room?.localParticipant ?: return
        val enabled = !_isScreenShareEnabled.value
        localParticipant.setScreenShareEnabled(enabled)
        _isScreenShareEnabled.value = enabled
    }

    /**
     * Send a chat message via LiveKit data messages.
     */
    suspend fun sendChatMessage(text: String) {
        val room = _room ?: return
        val localParticipant = room.localParticipant
        val name = localParticipant.name ?: localParticipant.identity?.value ?: "Unknown"
        val json = JSONObject().apply {
            put("type", "chat")
            put("message", text)
            put("senderName", name)
        }
        localParticipant.publishData(
            json.toString().toByteArray(Charsets.UTF_8),
            DataPublishReliability.RELIABLE
        )
        // Add to local messages
        val msg = ChatMessage(senderName = name, text = text, isLocal = true)
        _chatMessages.value = _chatMessages.value + msg
    }

    /**
     * Get the local participant, if connected.
     */
    fun getLocalParticipant(): LocalParticipant? {
        return _room?.localParticipant
    }

    companion object {
        private const val TAG = "RoomManager"
    }
}
