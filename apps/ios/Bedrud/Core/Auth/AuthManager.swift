import Foundation
import KeychainAccess
import Combine

// MARK: - Auth Manager

@MainActor
final class AuthManager: ObservableObject {
    let instanceId: String
    private let authAPI: AuthAPI

    // MARK: - Published State

    @Published private(set) var currentUser: User?
    @Published private(set) var isAuthenticated: Bool = false
    @Published private(set) var isLoading: Bool = false

    // MARK: - Keychain

    private let keychain: Keychain
    private var accessTokenKey: String { "\(instanceId)_access_token" }
    private var refreshTokenKey: String { "\(instanceId)_refresh_token" }
    private var userDataKey: String { "\(instanceId)_user_data" }

    // MARK: - Init

    init(instanceId: String, authAPI: AuthAPI, keychain: Keychain = Keychain(service: "org.bedrud.ios")) {
        self.instanceId = instanceId
        self.authAPI = authAPI
        self.keychain = keychain
        restoreSession()
    }

    // MARK: - Session Restoration

    private func restoreSession() {
        guard let accessToken = keychain[accessTokenKey],
              let refreshToken = keychain[refreshTokenKey],
              !accessToken.isEmpty,
              !refreshToken.isEmpty
        else {
            isAuthenticated = false
            return
        }

        // Restore cached user data
        if let userData = keychain[userDataKey],
           let data = userData.data(using: .utf8),
           let user = try? JSONDecoder().decode(User.self, from: data) {
            currentUser = user
        }

        isAuthenticated = true

        // Validate token in the background
        Task {
            do {
                let me = try await authAPI.getMe(authManager: self)
                let user = User(
                    id: me.id,
                    email: me.email,
                    name: me.name,
                    avatarUrl: me.avatarUrl,
                    isAdmin: me.isAdmin ?? false,
                    provider: me.provider
                )
                currentUser = user
                cacheUser(user)
            } catch {
                // Token may be expired; attempt refresh
                if (try? await refreshAccessToken()) == nil {
                    await logout()
                }
            }
        }
    }

    // MARK: - Login

    func login(email: String, password: String) async throws -> User {
        isLoading = true
        defer { isLoading = false }

        let response = try await authAPI.login(email: email, password: password)

        let tokens = response.tokens
        storeTokens(accessToken: tokens.accessToken, refreshToken: tokens.refreshToken)

        let user = User(
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            avatarUrl: response.user.avatarUrl,
            isAdmin: response.user.isAdmin ?? false,
            provider: nil
        )

        currentUser = user
        isAuthenticated = true
        cacheUser(user)

        return user
    }

    // MARK: - Passkey Login (tokens already obtained)

    func loginWithTokens(tokens: AuthTokens, user: User) {
        storeTokens(accessToken: tokens.accessToken, refreshToken: tokens.refreshToken)
        currentUser = user
        isAuthenticated = true
        cacheUser(user)
    }

    // MARK: - Register

    func register(email: String, password: String, name: String) async throws -> User {
        isLoading = true
        defer { isLoading = false }

        let response = try await authAPI.register(email: email, password: password, name: name)

        storeTokens(accessToken: response.accessToken, refreshToken: response.refreshToken)

        // Decode user info from the JWT
        let decoded = try decodeJWT(response.accessToken)
        let user = User(
            id: decoded.userId,
            email: decoded.email,
            name: name,
            avatarUrl: nil,
            isAdmin: decoded.accesses?.contains("admin") ?? false,
            provider: nil
        )

        currentUser = user
        isAuthenticated = true
        cacheUser(user)

        return user
    }

    // MARK: - Guest Login

    func guestLogin(name: String) async throws -> User {
        isLoading = true
        defer { isLoading = false }

        let response = try await authAPI.guestLogin(name: name)

        let tokens = response.tokens
        storeTokens(accessToken: tokens.accessToken, refreshToken: tokens.refreshToken)

        let user = User(
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            avatarUrl: response.user.avatarUrl,
            isAdmin: response.user.isAdmin ?? false,
            provider: nil
        )

        currentUser = user
        isAuthenticated = true
        cacheUser(user)

        return user
    }

    // MARK: - Logout

    func logout() async {
        keychain[accessTokenKey] = nil
        keychain[refreshTokenKey] = nil
        keychain[userDataKey] = nil
        currentUser = nil
        isAuthenticated = false
    }

    // MARK: - Token Access

    /// Returns a valid access token, or nil if not authenticated.
    nonisolated func getValidAccessToken() async throws -> String? {
        let token = await MainActor.run { [keychain, accessTokenKey] in
            keychain[accessTokenKey]
        }

        guard let token, !token.isEmpty else { return nil }

        // Check if token is expired
        if let decoded = try? decodeJWTNonisolated(token), decoded.exp > Date().timeIntervalSince1970 {
            return token
        }

        // Token expired, attempt refresh
        return try await refreshAccessToken()
    }

    /// Refreshes the access token using the stored refresh token.
    nonisolated func refreshAccessToken() async throws -> String? {
        let refreshToken = await MainActor.run { [keychain, refreshTokenKey] in
            keychain[refreshTokenKey]
        }

        guard let refreshToken, !refreshToken.isEmpty else { return nil }

        let response = try await authAPI.refreshToken(refreshToken: refreshToken)

        await MainActor.run { [weak self] in
            self?.storeTokens(accessToken: response.accessToken, refreshToken: response.refreshToken)
        }

        return response.accessToken
    }

    // MARK: - Token Storage

    private func storeTokens(accessToken: String, refreshToken: String) {
        keychain[accessTokenKey] = accessToken
        keychain[refreshTokenKey] = refreshToken
    }

    private func cacheUser(_ user: User) {
        if let data = try? JSONEncoder().encode(user),
           let string = String(data: data, encoding: .utf8) {
            keychain[userDataKey] = string
        }
    }

    // MARK: - JWT Decoding

    private struct JWTPayload {
        let userId: String
        let email: String
        let accesses: [String]?
        let provider: String?
        let exp: TimeInterval
        let iat: TimeInterval
    }

    private func decodeJWT(_ token: String) throws -> JWTPayload {
        try Self.decodeJWTStatic(token)
    }

    private nonisolated func decodeJWTNonisolated(_ token: String) throws -> JWTPayload {
        try Self.decodeJWTStatic(token)
    }

    private nonisolated static func decodeJWTStatic(_ token: String) throws -> JWTPayload {
        let segments = token.split(separator: ".")
        guard segments.count >= 2 else {
            throw APIError.unknown
        }

        var base64 = String(segments[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")

        // Pad to multiple of 4
        let remainder = base64.count % 4
        if remainder > 0 {
            base64 += String(repeating: "=", count: 4 - remainder)
        }

        guard let data = Data(base64Encoded: base64) else {
            throw APIError.unknown
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw APIError.unknown
        }

        return JWTPayload(
            userId: json["userId"] as? String ?? "",
            email: json["email"] as? String ?? "",
            accesses: json["accesses"] as? [String],
            provider: json["provider"] as? String,
            exp: json["exp"] as? TimeInterval ?? 0,
            iat: json["iat"] as? TimeInterval ?? 0
        )
    }
}
