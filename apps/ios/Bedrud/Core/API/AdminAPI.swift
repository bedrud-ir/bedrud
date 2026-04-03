import Foundation

// MARK: - Admin Models

struct AdminUser: Decodable, Identifiable {
    let id: String
    let email: String
    let name: String
    let isActive: Bool
    let isAdmin: Bool
    let provider: String?
    let createdAt: String?
}

struct AdminRoom: Decodable, Identifiable {
    let id: String
    let name: String
    let isActive: Bool
    let isPublic: Bool?
    let maxParticipants: Int?
    let createdAt: String?
}

struct AdminSettings: Codable {
    var allowRegistrations: Bool
    var requireInviteToken: Bool
}

struct InviteToken: Decodable, Identifiable {
    let id: String
    let token: String
    let email: String?
    let expiresAt: String?
    let usedAt: String?
    let used: Bool?
}

// MARK: - Admin API

struct AdminAPI {
    let client: APIClient
    let authManager: AuthManager

    // MARK: - Users

    func listUsers() async throws -> [AdminUser] {
        try await client.authFetch("/admin/users", authManager: authManager)
    }

    func setUserStatus(id: String, active: Bool) async throws {
        struct Body: Encodable { let active: Bool }
        try await client.authFetchVoid(
            "/admin/users/\(id)/status",
            method: "PUT",
            body: Body(active: active),
            authManager: authManager
        )
    }

    func setUserAccesses(id: String, accesses: [String]) async throws {
        struct Body: Encodable { let accesses: [String] }
        try await client.authFetchVoid(
            "/admin/users/\(id)/accesses",
            method: "PUT",
            body: Body(accesses: accesses),
            authManager: authManager
        )
    }

    // MARK: - Rooms

    func listRooms() async throws -> [AdminRoom] {
        try await client.authFetch("/admin/rooms", authManager: authManager)
    }

    func deleteRoom(id: String) async throws {
        try await client.authFetchVoid(
            "/admin/rooms/\(id)",
            method: "DELETE",
            authManager: authManager
        )
    }

    func updateRoom(id: String, maxParticipants: Int) async throws {
        struct Body: Encodable { let maxParticipants: Int }
        try await client.authFetchVoid(
            "/admin/rooms/\(id)",
            method: "PUT",
            body: Body(maxParticipants: maxParticipants),
            authManager: authManager
        )
    }

    // MARK: - Settings

    func getSettings() async throws -> AdminSettings {
        try await client.authFetch("/admin/settings", authManager: authManager)
    }

    func updateSettings(_ settings: AdminSettings) async throws {
        try await client.authFetchVoid(
            "/admin/settings",
            method: "PUT",
            body: settings,
            authManager: authManager
        )
    }

    // MARK: - Invite Tokens

    func listInviteTokens() async throws -> [InviteToken] {
        try await client.authFetch("/admin/invite-tokens", authManager: authManager)
    }

    func createInviteToken(email: String?, expiresInHours: Int) async throws -> InviteToken {
        struct Body: Encodable { let email: String?; let expiresInHours: Int }
        return try await client.authFetch(
            "/admin/invite-tokens",
            method: "POST",
            body: Body(email: email, expiresInHours: expiresInHours),
            authManager: authManager
        )
    }

    func deleteInviteToken(id: String) async throws {
        try await client.authFetchVoid(
            "/admin/invite-tokens/\(id)",
            method: "DELETE",
            authManager: authManager
        )
    }

    // MARK: - Stats

    func getOnlineCount() async throws -> Int {
        struct Response: Decodable { let count: Int }
        let r: Response = try await client.authFetch("/admin/online-count", authManager: authManager)
        return r.count
    }
}
