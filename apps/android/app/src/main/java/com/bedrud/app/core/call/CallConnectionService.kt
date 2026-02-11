package com.bedrud.app.core.call

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telecom.Connection
import android.telecom.ConnectionRequest
import android.telecom.ConnectionService
import android.telecom.PhoneAccount
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.util.Log

class CallConnectionService : ConnectionService() {

    override fun onCreateOutgoingConnection(
        connectionManagerPhoneAccount: PhoneAccountHandle?,
        request: ConnectionRequest?
    ): Connection {
        val connection = BedrudConnection(applicationContext)
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
        // If connection fails, we should probably stop the service to avoid stuck state
        applicationContextRef?.let { CallService.stop(it) }
    }

    private class BedrudConnection(private val context: Context) : Connection() {
        init {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                connectionProperties = PROPERTY_SELF_MANAGED
            }
            connectionCapabilities = CAPABILITY_MUTE or CAPABILITY_SUPPORT_HOLD
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioModeIsVoip = true
            }
        }

        override fun onDisconnect() {
            setDisconnected(android.telecom.DisconnectCause(android.telecom.DisconnectCause.LOCAL))
            destroy()
            activeConnection = null
            CallService.stop(context)
        }

        override fun onCallAudioStateChanged(state: android.telecom.CallAudioState?) {
            // System audio routing changes handled by LiveKit
        }
    }

    companion object {
        private const val TAG = "CallConnectionService"
        private const val PHONE_ACCOUNT_ID = "bedrud_call"
        private var activeConnection: Connection? = null
        private var applicationContextRef: Context? = null

        fun placeCall(context: Context, roomName: String) {
            applicationContextRef = context.applicationContext
            val telecom = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
                ?: return

            val componentName = ComponentName(context, CallConnectionService::class.java)
            val phoneAccountHandle = PhoneAccountHandle(componentName, PHONE_ACCOUNT_ID)

            // Register PhoneAccount if needed
            val builder = PhoneAccount.builder(phoneAccountHandle, "Bedrud")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder.setCapabilities(PhoneAccount.CAPABILITY_SELF_MANAGED)
            }
            val phoneAccount = builder.build()
            
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    telecom.registerPhoneAccount(phoneAccount)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to register PhoneAccount", e)
            }

            val extras = Bundle().apply {
                putParcelable(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, phoneAccountHandle)
            }

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    telecom.placeCall(
                        Uri.fromParts("tel", roomName, null),
                        extras
                    )
                }
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
