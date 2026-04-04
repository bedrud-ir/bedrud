import Foundation

// MARK: - Admin Models

struct AdminUser: Codable, Identifiable, Equatable {
    let id: String
    let email: String
    let name: String
    let provider: String?
    let isActive: Bool
    let isAdmin: Bool
    let accesses: [String]?
    let createdAt: String?

    static func == (lhs: AdminUser, rhs: AdminUser) -> Bool { lhs.id == rhs.id }

    enum CodingKeys: String, CodingKey {
        case id, email, name, provider, isActive, isAdmin, accesses, createdAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        email = try c.decode(String.self, forKey: .email)
        name = try c.decode(String.self, forKey: .name)
        provider = try c.decodeIfPresent(String.self, forKey: .provider)
        isActive = try c.decodeIfPresent(Bool.self, forKey: .isActive) ?? false
        isAdmin = try c.decodeIfPresent(Bool.self, forKey: .isAdmin) ?? false
        accesses = try c.decodeIfPresent([String].self, forKey: .accesses)
        createdAt = try c.decodeIfPresent(String.self, forKey: .createdAt)
    }

    init(id: String, email: String, name: String, provider: String? = nil,
         isActive: Bool, isAdmin: Bool = false, accesses: [String]? = nil, createdAt: String? = nil) {
        self.id = id; self.email = email; self.name = name; self.provider = provider
        self.isActive = isActive; self.isAdmin = isAdmin; self.accesses = accesses; self.createdAt = createdAt
    }
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
    var registrationEnabled: Bool
    var tokenRegistrationOnly: Bool

    enum CodingKeys: String, CodingKey {
        case registrationEnabled, tokenRegistrationOnly
    }
}

struct InviteToken: Decodable, Identifiable {
    let id: String
    let token: String
    let email: String?
    let expiresAt: String?
    let usedAt: String?
    let used: Bool?
}

// MARK: - Admin List Wrappers (server wraps arrays in keyed objects)

private struct UserListResponse: Decodable { let users: [AdminUser] }
private struct RoomListResponse: Decodable { let rooms: [AdminRoom] }
private struct TokenListResponse: Decodable { let tokens: [InviteToken] }

// MARK: - Admin API

struct AdminAPI {
    let client: APIClient
    let authManager: AuthManager

    // MARK: - Users

    func listUsers() async throws -> [AdminUser] {
        let wrapper: UserListResponse = try await client.authFetch("/admin/users", authManager: authManager)
        return wrapper.users
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
        let wrapper: RoomListResponse = try await client.authFetch("/admin/rooms", authManager: authManager)
        return wrapper.rooms
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
        let wrapper: TokenListResponse = try await client.authFetch("/admin/invite-tokens", authManager: authManager)
        return wrapper.tokens
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
