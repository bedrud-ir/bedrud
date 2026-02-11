import Foundation

// MARK: - Request Types

struct CreateRoomRequest: Encodable {
    let name: String?
    let maxParticipants: Int?
    let isPublic: Bool?
    let mode: String?
    let settings: RoomSettings?
}

struct JoinRoomRequest: Encodable {
    let roomName: String
}

// MARK: - Response Types

struct JoinRoomResponse: Decodable {
    let id: String
    let name: String
    let token: String
    let livekitHost: String
    let createdBy: String
    let adminId: String
    let isActive: Bool
    let isPublic: Bool?
    let maxParticipants: Int?
    let expiresAt: String?
    let settings: RoomSettings
    let mode: String
}

struct UserRoomResponse: Decodable, Identifiable {
    let id: String
    let name: String
    let createdBy: String
    let isActive: Bool
    let maxParticipants: Int?
    let expiresAt: String?
    let settings: RoomSettings
    let relationship: String?
    let mode: String
}

// MARK: - Room API

struct RoomAPI {
    let client: APIClient
    let authManager: AuthManager

    init(client: APIClient, authManager: AuthManager) {
        self.client = client
        self.authManager = authManager
    }

    func createRoom(
        name: String? = nil,
        maxParticipants: Int? = nil,
        isPublic: Bool? = nil,
        mode: String? = nil,
        settings: RoomSettings? = nil
    ) async throws -> Room {
        try await client.authFetch(
            "/room/create",
            method: "POST",
            body: CreateRoomRequest(
                name: name,
                maxParticipants: maxParticipants,
                isPublic: isPublic,
                mode: mode,
                settings: settings
            ),
            authManager: authManager
        )
    }

    func listRooms() async throws -> [UserRoomResponse] {
        try await client.authFetch("/room/list", authManager: authManager)
    }

    func joinRoom(roomName: String) async throws -> JoinRoomResponse {
        try await client.authFetch(
            "/room/join",
            method: "POST",
            body: JoinRoomRequest(roomName: roomName),
            authManager: authManager
        )
    }

    func deleteRoom(roomId: String) async throws {
        try await client.authFetchVoid(
            "/room/\(roomId)",
            method: "DELETE",
            authManager: authManager
        )
    }

    func kickParticipant(roomId: String, identity: String) async throws {
        try await client.authFetchVoid(
            "/room/\(roomId)/kick/\(identity)",
            method: "POST",
            authManager: authManager
        )
    }

    func muteParticipant(roomId: String, identity: String) async throws {
        try await client.authFetchVoid(
            "/room/\(roomId)/mute/\(identity)",
            method: "POST",
            authManager: authManager
        )
    }

    func disableParticipantVideo(roomId: String, identity: String) async throws {
        try await client.authFetchVoid(
            "/room/\(roomId)/video/\(identity)/off",
            method: "POST",
            authManager: authManager
        )
    }

    func bringToStage(roomId: String, identity: String) async throws {
        try await client.authFetchVoid(
            "/room/\(roomId)/stage/\(identity)/bring",
            method: "POST",
            authManager: authManager
        )
    }

    func removeFromStage(roomId: String, identity: String) async throws {
        try await client.authFetchVoid(
            "/room/\(roomId)/stage/\(identity)/remove",
            method: "POST",
            authManager: authManager
        )
    }

    func updateRoomSettings(roomId: String, settings: RoomSettings) async throws {
        try await client.authFetchVoid(
            "/room/\(roomId)/settings",
            method: "PUT",
            body: settings,
            authManager: authManager
        )
    }
}
