package com.bedrud.app.core.api

import com.bedrud.app.models.AdminRoom
import com.bedrud.app.models.AdminSettings
import com.bedrud.app.models.AdminUser
import com.bedrud.app.models.InviteToken
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface AdminApi {

    // ── Users ─────────────────────────────────────────────────────────────────

    @GET("admin/users")
    suspend fun listUsers(): Response<List<AdminUser>>

    @PUT("admin/users/{id}/status")
    suspend fun setUserStatus(
        @Path("id") id: String,
        @Body body: Map<String, Boolean>
    ): Response<Unit>

    @PUT("admin/users/{id}/accesses")
    suspend fun setUserAccesses(
        @Path("id") id: String,
        @Body body: Map<String, List<String>>
    ): Response<Unit>

    // ── Rooms ─────────────────────────────────────────────────────────────────

    @GET("admin/rooms")
    suspend fun listRooms(): Response<List<AdminRoom>>

    @DELETE("admin/rooms/{id}")
    suspend fun deleteRoom(@Path("id") id: String): Response<Unit>

    @PUT("admin/rooms/{id}")
    suspend fun updateRoom(
        @Path("id") id: String,
        @Body body: Map<String, Int>
    ): Response<Unit>

    // ── Settings ──────────────────────────────────────────────────────────────

    @GET("admin/settings")
    suspend fun getSettings(): Response<AdminSettings>

    @PUT("admin/settings")
    suspend fun updateSettings(@Body settings: AdminSettings): Response<Unit>

    // ── Invite Tokens ─────────────────────────────────────────────────────────

    @GET("admin/invite-tokens")
    suspend fun listInviteTokens(): Response<List<InviteToken>>

    @POST("admin/invite-tokens")
    suspend fun createInviteToken(@Body body: Map<String, Any>): Response<InviteToken>

    @DELETE("admin/invite-tokens/{id}")
    suspend fun deleteInviteToken(@Path("id") id: String): Response<Unit>

    // ── Stats ─────────────────────────────────────────────────────────────────

    @GET("admin/online-count")
    suspend fun getOnlineCount(): Response<Map<String, Int>>
}
