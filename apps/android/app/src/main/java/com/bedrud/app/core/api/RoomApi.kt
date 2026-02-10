package com.bedrud.app.core.api

import com.bedrud.app.models.CreateRoomRequest
import com.bedrud.app.models.JoinRoomRequest
import com.bedrud.app.models.JoinRoomResponse
import com.bedrud.app.models.Room
import com.bedrud.app.models.RoomSettings
import com.bedrud.app.models.UserRoomResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface RoomApi {

    @POST("room/create")
    suspend fun createRoom(@Body request: CreateRoomRequest): Response<Room>

    @GET("room/list")
    suspend fun listRooms(): Response<List<UserRoomResponse>>

    @POST("room/join")
    suspend fun joinRoom(@Body request: JoinRoomRequest): Response<JoinRoomResponse>

    @POST("room/{roomId}/kick/{identity}")
    suspend fun kickParticipant(
        @Path("roomId") roomId: String,
        @Path("identity") identity: String
    ): Response<Unit>

    @POST("room/{roomId}/mute/{identity}")
    suspend fun muteParticipant(
        @Path("roomId") roomId: String,
        @Path("identity") identity: String
    ): Response<Unit>

    @POST("room/{roomId}/video/{identity}/off")
    suspend fun disableParticipantVideo(
        @Path("roomId") roomId: String,
        @Path("identity") identity: String
    ): Response<Unit>

    @POST("room/{roomId}/stage/{identity}/bring")
    suspend fun bringToStage(
        @Path("roomId") roomId: String,
        @Path("identity") identity: String
    ): Response<Unit>

    @POST("room/{roomId}/stage/{identity}/remove")
    suspend fun removeFromStage(
        @Path("roomId") roomId: String,
        @Path("identity") identity: String
    ): Response<Unit>

    @PUT("room/{roomId}/settings")
    suspend fun updateRoomSettings(
        @Path("roomId") roomId: String,
        @Body settings: RoomSettings
    ): Response<Unit>
}
