package com.bedrud.app.core.api

import com.bedrud.app.models.GuestLoginRequest
import com.bedrud.app.models.LoginRequest
import com.bedrud.app.models.LoginResponse
import com.bedrud.app.models.MeResponse
import com.bedrud.app.models.RefreshTokenRequest
import com.bedrud.app.models.RefreshTokenResponse
import com.bedrud.app.models.RegisterRequest
import com.bedrud.app.models.RegisterResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/guest-login")
    suspend fun guestLogin(@Body request: GuestLoginRequest): Response<LoginResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<RefreshTokenResponse>

    @GET("auth/me")
    suspend fun getMe(): Response<MeResponse>

    @POST("auth/passkey/login/begin")
    suspend fun passkeyLoginBegin(): Response<Map<String, Any>>

    @POST("auth/passkey/login/finish")
    suspend fun passkeyLoginFinish(@Body data: Map<String, Any>): Response<LoginResponse>

    @POST("auth/passkey/signup/begin")
    suspend fun passkeySignupBegin(@Body data: Map<String, String>): Response<Map<String, Any>>

    @POST("auth/passkey/signup/finish")
    suspend fun passkeySignupFinish(@Body data: Map<String, Any>): Response<LoginResponse>

    @POST("auth/passkey/register/begin")
    suspend fun passkeyRegisterBegin(): Response<Map<String, Any>>

    @POST("auth/passkey/register/finish")
    suspend fun passkeyRegisterFinish(@Body data: Map<String, Any>): Response<Map<String, Any>>
}
