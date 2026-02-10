package com.bedrud.app.core.auth

import android.content.Context
import android.util.Log
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PublicKeyCredential
import com.bedrud.app.core.api.AuthApi
import com.bedrud.app.models.LoginResponse
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class PasskeyManager(
    private val context: Context,
    private val authApi: AuthApi,
    private val authManager: AuthManager
) {
    private val credentialManager = CredentialManager.create(context)
    private val gson = Gson()

    /**
     * Initiates passkey-based login.
     * 1. Calls the backend to get WebAuthn challenge options.
     * 2. Presents the credential picker to the user.
     * 3. Sends the signed assertion back to the backend.
     * 4. Saves tokens and user on success.
     */
    suspend fun loginWithPasskey(activityContext: Context): Result<LoginResponse> =
        withContext(Dispatchers.IO) {
            try {
                // Step 1: Get challenge from server
                val beginResponse = authApi.passkeyLoginBegin()
                if (!beginResponse.isSuccessful) {
                    return@withContext Result.failure(
                        Exception("Failed to start passkey login: ${beginResponse.code()}")
                    )
                }

                val options = beginResponse.body()
                    ?: return@withContext Result.failure(Exception("Empty passkey login options"))

                val optionsJson = gson.toJson(options)

                // Step 2: Present credential picker
                val getCredentialRequest = GetCredentialRequest(
                    listOf(GetPublicKeyCredentialOption(optionsJson))
                )

                val result = withContext(Dispatchers.Main) {
                    credentialManager.getCredential(activityContext, getCredentialRequest)
                }

                val credential = result.credential
                if (credential !is PublicKeyCredential) {
                    return@withContext Result.failure(Exception("Unexpected credential type"))
                }

                // Step 3: Send assertion to server
                @Suppress("UNCHECKED_CAST")
                val assertionData = gson.fromJson(
                    credential.authenticationResponseJson,
                    Map::class.java
                ) as Map<String, Any>

                val finishResponse = authApi.passkeyLoginFinish(assertionData)
                if (!finishResponse.isSuccessful) {
                    return@withContext Result.failure(
                        Exception("Passkey login verification failed: ${finishResponse.code()}")
                    )
                }

                val loginResponse = finishResponse.body()
                    ?: return@withContext Result.failure(Exception("Empty login response"))

                // Step 4: Save tokens and user
                authManager.saveTokens(loginResponse.tokens)
                authManager.saveUser(loginResponse.user)

                Result.success(loginResponse)
            } catch (e: Exception) {
                Log.e(TAG, "Passkey login failed", e)
                Result.failure(e)
            }
        }

    /**
     * Initiates passkey-based signup.
     * 1. Calls the backend with email/name to get WebAuthn creation options.
     * 2. Creates a new credential on the device.
     * 3. Sends the credential back to the backend.
     * 4. Saves tokens and user on success.
     */
    suspend fun signupWithPasskey(
        activityContext: Context,
        email: String,
        name: String
    ): Result<LoginResponse> = withContext(Dispatchers.IO) {
        try {
            // Step 1: Get creation options from server
            val beginResponse = authApi.passkeySignupBegin(
                mapOf("email" to email, "name" to name)
            )
            if (!beginResponse.isSuccessful) {
                return@withContext Result.failure(
                    Exception("Failed to start passkey signup: ${beginResponse.code()}")
                )
            }

            val options = beginResponse.body()
                ?: return@withContext Result.failure(Exception("Empty passkey signup options"))

            val optionsJson = gson.toJson(options)

            // Step 2: Create credential on device
            val createRequest = CreatePublicKeyCredentialRequest(optionsJson)

            val result = withContext(Dispatchers.Main) {
                credentialManager.createCredential(activityContext, createRequest)
            }

            val credential = result
            if (credential !is androidx.credentials.CreatePublicKeyCredentialResponse) {
                return@withContext Result.failure(Exception("Unexpected credential response type"))
            }

            // Step 3: Send attestation to server
            @Suppress("UNCHECKED_CAST")
            val attestationData = gson.fromJson(
                credential.registrationResponseJson,
                Map::class.java
            ) as Map<String, Any>

            val finishResponse = authApi.passkeySignupFinish(attestationData)
            if (!finishResponse.isSuccessful) {
                return@withContext Result.failure(
                    Exception("Passkey signup verification failed: ${finishResponse.code()}")
                )
            }

            val loginResponse = finishResponse.body()
                ?: return@withContext Result.failure(Exception("Empty signup response"))

            // Step 4: Save tokens and user
            authManager.saveTokens(loginResponse.tokens)
            authManager.saveUser(loginResponse.user)

            Result.success(loginResponse)
        } catch (e: Exception) {
            Log.e(TAG, "Passkey signup failed", e)
            Result.failure(e)
        }
    }

    /**
     * Registers a passkey for an already-authenticated user.
     * 1. Calls the backend to get WebAuthn creation options.
     * 2. Creates a new credential on the device.
     * 3. Sends the credential back to the backend.
     */
    suspend fun registerPasskey(activityContext: Context): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val beginResponse = authApi.passkeyRegisterBegin()
                if (!beginResponse.isSuccessful) {
                    return@withContext Result.failure(
                        Exception("Failed to start passkey registration: ${beginResponse.code()}")
                    )
                }

                val options = beginResponse.body()
                    ?: return@withContext Result.failure(Exception("Empty registration options"))

                val optionsJson = gson.toJson(options)

                val createRequest = CreatePublicKeyCredentialRequest(optionsJson)

                val result = withContext(Dispatchers.Main) {
                    credentialManager.createCredential(activityContext, createRequest)
                }

                val credential = result
                if (credential !is androidx.credentials.CreatePublicKeyCredentialResponse) {
                    return@withContext Result.failure(
                        Exception("Unexpected credential response type")
                    )
                }

                @Suppress("UNCHECKED_CAST")
                val attestationData = gson.fromJson(
                    credential.registrationResponseJson,
                    Map::class.java
                ) as Map<String, Any>

                val finishResponse = authApi.passkeyRegisterFinish(attestationData)
                if (!finishResponse.isSuccessful) {
                    return@withContext Result.failure(
                        Exception("Passkey registration failed: ${finishResponse.code()}")
                    )
                }

                Result.success(Unit)
            } catch (e: Exception) {
                Log.e(TAG, "Passkey registration failed", e)
                Result.failure(e)
            }
        }

    companion object {
        private const val TAG = "PasskeyManager"
    }
}
