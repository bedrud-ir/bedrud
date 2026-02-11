package com.bedrud.app.core.call

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import android.util.Log
import androidx.core.app.NotificationCompat
import com.bedrud.app.MainActivity
import com.bedrud.app.R
import com.bedrud.app.core.instance.InstanceManager
import com.bedrud.app.core.livekit.RoomManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import org.koin.android.ext.android.inject

class CallService : Service() {

    private val instanceManager: InstanceManager by inject()
    private var roomManager: RoomManager? = null
    private var serviceScope: CoroutineScope? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var callStartTime: Long = 0L

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_HANG_UP -> {
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_TOGGLE_MUTE -> {
                serviceScope?.launch {
                    roomManager?.toggleMicrophone()
                }
                return START_NOT_STICKY
            }
        }

        val roomName = intent?.getStringExtra(EXTRA_ROOM_NAME) ?: run {
            stopSelf()
            return START_NOT_STICKY
        }
        val url = intent.getStringExtra(EXTRA_URL) ?: run {
            stopSelf()
            return START_NOT_STICKY
        }
        val token = intent.getStringExtra(EXTRA_TOKEN) ?: run {
            stopSelf()
            return START_NOT_STICKY
        }
        val avatarUrl = intent.getStringExtra(EXTRA_AVATAR_URL)

        // Grab the current RoomManager before any instance switch
        val rm = instanceManager.roomManager.value ?: run {
            Log.e(TAG, "No RoomManager available")
            stopSelf()
            return START_NOT_STICKY
        }
        roomManager = rm
        callStartTime = SystemClock.elapsedRealtime()

        // Create notification channel and start foreground immediately (Android 12+ 10s rule)
        createNotificationChannel()
        val notification = buildNotification(roomName, isMuted = false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID, notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        // Request audio focus
        requestAudioFocus()

        // Place system call via ConnectionService
        CallConnectionService.placeCall(this, roomName)

        // Connect to LiveKit
        serviceScope?.cancel()
        serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
        serviceScope?.launch {
            rm.connect(url, token, roomName, avatarUrl)
        }

        // Set callback for server-side disconnects
        rm.onDisconnected = {
            Log.d(TAG, "Room disconnected by server, stopping service")
            stopSelf()
        }

        // Observe mute state to update notification
        serviceScope?.launch {
            rm.isMicEnabled.collectLatest { micEnabled ->
                val updatedNotification = buildNotification(roomName, isMuted = !micEnabled)
                val nm = getSystemService(NotificationManager::class.java)
                nm.notify(NOTIFICATION_ID, updatedNotification)
                CallConnectionService.updateMuteState(!micEnabled)
            }
        }

        isRunning = true
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false

        roomManager?.onDisconnected = null
        roomManager?.disconnect()
        roomManager = null

        abandonAudioFocus()
        CallConnectionService.endCall()

        serviceScope?.cancel()
        serviceScope = null

        Log.d(TAG, "CallService destroyed")
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Active Calls",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Ongoing call notifications"
            setShowBadge(false)
        }
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(channel)
    }

    private fun buildNotification(roomName: String, isMuted: Boolean): Notification {
        // Content tap opens app
        val contentIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Mute action
        val muteIntent = PendingIntent.getService(
            this, 1,
            Intent(this, CallService::class.java).apply { action = ACTION_TOGGLE_MUTE },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val muteAction = NotificationCompat.Action.Builder(
            if (isMuted) android.R.drawable.ic_lock_silent_mode
            else android.R.drawable.ic_lock_silent_mode_off,
            if (isMuted) "Unmute" else "Mute",
            muteIntent
        ).build()

        // Hang up action
        val hangUpIntent = PendingIntent.getService(
            this, 2,
            Intent(this, CallService::class.java).apply { action = ACTION_HANG_UP },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val hangUpAction = NotificationCompat.Action.Builder(
            android.R.drawable.ic_menu_close_clear_cancel,
            "Hang Up",
            hangUpIntent
        ).build()

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Call: $roomName")
            .setContentText("Ongoing call")
            .setSmallIcon(R.drawable.ic_call_notification)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setOngoing(true)
            .setUsesChronometer(true)
            .setWhen(System.currentTimeMillis() - (SystemClock.elapsedRealtime() - callStartTime))
            .setContentIntent(contentIntent)
            .addAction(muteAction)
            .addAction(hangUpAction)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build()
    }

    private fun requestAudioFocus() {
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()
        audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
            .setAudioAttributes(attrs)
            .setOnAudioFocusChangeListener { focusChange ->
                when (focusChange) {
                    AudioManager.AUDIOFOCUS_LOSS -> {
                        Log.d(TAG, "Audio focus lost, stopping call")
                        stopSelf()
                    }
                    AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                        Log.d(TAG, "Audio focus lost transiently")
                    }
                }
            }
            .build()
        audioManager?.requestAudioFocus(audioFocusRequest!!)
    }

    private fun abandonAudioFocus() {
        audioFocusRequest?.let { audioManager?.abandonAudioFocusRequest(it) }
        audioFocusRequest = null
        audioManager = null
    }

    companion object {
        private const val TAG = "CallService"
        private const val CHANNEL_ID = "bedrud_call"
        private const val NOTIFICATION_ID = 1001
        private const val EXTRA_ROOM_NAME = "room_name"
        private const val EXTRA_URL = "url"
        private const val EXTRA_TOKEN = "token"
        private const val EXTRA_AVATAR_URL = "avatar_url"
        private const val ACTION_HANG_UP = "com.bedrud.app.HANG_UP"
        private const val ACTION_TOGGLE_MUTE = "com.bedrud.app.TOGGLE_MUTE"

        var isRunning = false
            private set

        fun start(context: Context, roomName: String, url: String, token: String, avatarUrl: String? = null) {
            val intent = Intent(context, CallService::class.java).apply {
                putExtra(EXTRA_ROOM_NAME, roomName)
                putExtra(EXTRA_URL, url)
                putExtra(EXTRA_TOKEN, token)
                avatarUrl?.let { putExtra(EXTRA_AVATAR_URL, it) }
            }
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, CallService::class.java))
        }
    }
}
