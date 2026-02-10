package com.bedrud.app.core.instance

import android.app.Application
import com.bedrud.app.core.api.ApiClientFactory
import com.bedrud.app.core.api.AuthApi
import com.bedrud.app.core.api.AuthInterceptor
import com.bedrud.app.core.api.RoomApi
import com.bedrud.app.core.api.TokenAuthenticator
import com.bedrud.app.core.auth.AuthManager
import com.bedrud.app.core.auth.PasskeyManager
import com.bedrud.app.core.livekit.RoomManager
import com.bedrud.app.models.HealthResponse
import com.google.gson.GsonBuilder
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class InstanceManager(
    private val application: Application,
    val store: InstanceStore
) {
    private val _authManager = MutableStateFlow<AuthManager?>(null)
    val authManager: StateFlow<AuthManager?> = _authManager.asStateFlow()

    private val _authApi = MutableStateFlow<AuthApi?>(null)
    val authApi: StateFlow<AuthApi?> = _authApi.asStateFlow()

    private val _roomApi = MutableStateFlow<RoomApi?>(null)
    val roomApi: StateFlow<RoomApi?> = _roomApi.asStateFlow()

    private val _passkeyManager = MutableStateFlow<PasskeyManager?>(null)
    val passkeyManager: StateFlow<PasskeyManager?> = _passkeyManager.asStateFlow()

    private val _roomManager = MutableStateFlow<RoomManager?>(null)
    val roomManager: StateFlow<RoomManager?> = _roomManager.asStateFlow()

    init {
        rebuild()
    }

    fun rebuild() {
        val instance = store.activeInstance ?: run {
            _authManager.value = null
            _authApi.value = null
            _roomApi.value = null
            _passkeyManager.value = null
            _roomManager.value = null
            return
        }

        val baseURL = instance.apiBaseURL
        val am = AuthManager(application, instance.id)
        val factory = ApiClientFactory(baseURL)

        val interceptor = AuthInterceptor(am)
        val authenticator = TokenAuthenticator(am, baseURL) { _authApi.value!! }
        val okHttp = factory.createOkHttpClient(interceptor, authenticator)
        val retrofit = factory.createRetrofit(okHttp)

        val auth: AuthApi = factory.createApi(retrofit)
        val room: RoomApi = factory.createApi(retrofit)
        val pk = PasskeyManager(application, auth, am)
        val rm = RoomManager(application)

        _authManager.value = am
        _authApi.value = auth
        _roomApi.value = room
        _passkeyManager.value = pk
        _roomManager.value = rm
    }

    fun switchTo(instanceId: String) {
        store.setActive(instanceId)
        rebuild()
    }

    fun removeInstance(id: String) {
        if (store.activeInstanceId.value == id) {
            _authManager.value?.logout()
        }
        store.removeInstance(id)
        rebuild()
    }

    suspend fun checkHealth(serverURL: String): HealthResponse {
        val baseURL = if (serverURL.endsWith("/")) "${serverURL}api" else "$serverURL/api"
        val plainClient = OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .build()
        val gson = GsonBuilder().setLenient().create()
        val retrofit = Retrofit.Builder()
            .baseUrl(baseURL.trimEnd('/') + "/")
            .client(plainClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()

        val api = retrofit.create(HealthApi::class.java)
        val response = api.health()
        if (response.isSuccessful) {
            return response.body() ?: HealthResponse()
        } else {
            throw Exception("Server returned ${response.code()}")
        }
    }

    suspend fun addInstance(serverURL: String, displayName: String) {
        checkHealth(serverURL)
        val instance = com.bedrud.app.models.Instance(
            serverURL = serverURL,
            displayName = displayName
        )
        store.addInstance(instance)
        store.setActive(instance.id)
        rebuild()
    }
}

interface HealthApi {
    @retrofit2.http.GET("health")
    suspend fun health(): retrofit2.Response<HealthResponse>
}
