package com.bedrud.app.core.api

import com.bedrud.app.models.*
import com.google.gson.Gson
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class RoomApiTest {

    private lateinit var server: MockWebServer
    private lateinit var roomApi: RoomApi
    private val gson = Gson()

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()

        val retrofit = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        roomApi = retrofit.create(RoomApi::class.java)
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `createRoom sends POST to room-create`() = runBlocking {
        val room = Room(id = "r1", name = "Room 1", createdBy = "u1")
        server.enqueue(MockResponse().setBody(gson.toJson(room)).setResponseCode(200))

        val response = roomApi.createRoom(CreateRoomRequest(name = "Room 1"))

        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/room/create", request.path)
        assertTrue(response.isSuccessful)
        assertEquals("r1", response.body()!!.id)
    }

    @Test
    fun `listRooms sends GET to room-list and parses list`() = runBlocking {
        val rooms = listOf(
            UserRoomResponse(
                id = "r1", name = "Room 1", createdBy = "u1",
                isActive = true, maxParticipants = 50, expiresAt = "",
                settings = RoomSettings(), relationship = "owner", mode = "meeting"
            )
        )
        server.enqueue(MockResponse().setBody(gson.toJson(rooms)).setResponseCode(200))

        val response = roomApi.listRooms()

        val request = server.takeRequest()
        assertEquals("GET", request.method)
        assertEquals("/room/list", request.path)
        assertTrue(response.isSuccessful)
        assertEquals(1, response.body()!!.size)
        assertEquals("r1", response.body()!![0].id)
    }

    @Test
    fun `joinRoom sends POST to room-join and parses JoinRoomResponse`() = runBlocking {
        val joinResp = JoinRoomResponse(
            id = "r1", name = "my-room", token = "tok123",
            livekitHost = "wss://lk.example.com", createdBy = "u1",
            adminId = "u1", isActive = true, isPublic = true,
            maxParticipants = 50, expiresAt = "",
            settings = RoomSettings(), mode = "meeting"
        )
        server.enqueue(MockResponse().setBody(gson.toJson(joinResp)).setResponseCode(200))

        val response = roomApi.joinRoom(JoinRoomRequest(roomName = "my-room"))

        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/room/join", request.path)
        assertTrue(response.isSuccessful)
        assertEquals("tok123", response.body()!!.token)
        assertEquals("wss://lk.example.com", response.body()!!.livekitHost)
    }

    @Test
    fun `kickParticipant sends POST to correct path`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        val response = roomApi.kickParticipant("room123", "user456")

        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/room/room123/kick/user456", request.path)
        assertTrue(response.isSuccessful)
    }

    @Test
    fun `updateRoomSettings sends PUT to room settings path`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        val settings = RoomSettings(allowChat = false, e2ee = true)
        val response = roomApi.updateRoomSettings("room123", settings)

        val request = server.takeRequest()
        assertEquals("PUT", request.method)
        assertEquals("/room/room123/settings", request.path)
        val body = request.body.readUtf8()
        assertTrue(body.contains("\"allowChat\":false"))
        assertTrue(body.contains("\"e2ee\":true"))
        assertTrue(response.isSuccessful)
    }

    @Test
    fun `muteParticipant sends POST to correct path`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200))

        val response = roomApi.muteParticipant("room123", "user456")

        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/room/room123/mute/user456", request.path)
        assertTrue(response.isSuccessful)
    }
}
