package com.bedrud.app.core.call

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.telecom.Connection
import android.telecom.ConnectionRequest
import android.telecom.ConnectionService
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.util.Log

class CallConnectionService : ConnectionService() {

    override fun onCreateOutgoingConnection(
        connectionManagerPhoneAccount: PhoneAccountHandle?,
        request: ConnectionRequest?
    ): Connection {
        val connection = BedrudConnection()
        connection.setInitializing()
        connection.setActive()
        activeConnection = connection
        return connection
    }

    override fun onCreateOutgoingConnectionFailed(
        connectionManagerPhoneAccount: PhoneAccountHandle?,
        request: ConnectionRequest?
    ) {
        Log.e(TAG, "Failed to create outgoing connection")
    }

    private class BedrudConnection : Connection() {
        init {
            connectionProperties = PROPERTY_SELF_MANAGED
            connectionCapabilities = CAPABILITY_MUTE or CAPABILITY_SUPPORT_HOLD
            setAudioModeIsVoip(true)
        }

        override fun onDisconnect() {
            setDisconnected(android.telecom.DisconnectCause(android.telecom.DisconnectCause.LOCAL))
            destroy()
            activeConnection = null
            CallService.stop(applicationContextRef ?: return)
        }

        @Suppress("DEPRECATION")
        override fun onCallAudioStateChanged(state: android.telecom.CallAudioState?) {
            // System audio routing changes handled by LiveKit
        }
    }

    companion object {
        private const val TAG = "CallConnectionService"
        private var activeConnection: Connection? = null
        private var applicationContextRef: Context? = null

        fun placeCall(context: Context, roomName: String) {
            applicationContextRef = context.applicationContext
            val telecom = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
                ?: return

            val handle = PhoneAccountHandle(
                ComponentName(context, CallConnectionService::class.java),
                "bedrud_call"
            )

            val extras = Bundle().apply {
                putParcelable(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, handle)
            }

            try {
                telecom.placeCall(
                    Uri.fromParts("tel", roomName, null),
                    extras
                )
            } catch (e: SecurityException) {
                Log.e(TAG, "Cannot place call - missing permission", e)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to place call", e)
            }
        }

        fun endCall() {
            try {
                activeConnection?.apply {
                    setDisconnected(
                        android.telecom.DisconnectCause(android.telecom.DisconnectCause.LOCAL)
                    )
                    destroy()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to end call connection", e)
            }
            activeConnection = null
        }

        fun updateMuteState(muted: Boolean) {
            // Self-managed connections don't use onMute/onUnmute from system
            // but we can update the connection state for system awareness
        }
    }
}
