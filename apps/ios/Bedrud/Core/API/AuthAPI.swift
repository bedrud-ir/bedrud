import Foundation

// MARK: - Request Types

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct RegisterRequest: Encodable {
    let email: String
    let password: String
    let name: String
}

struct GuestLoginRequest: Encodable {
    let name: String
}

struct RefreshTokenRequest: Encodable {
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
        case refreshToken = "refresh_token"
    }
}

// MARK: - Response Types

struct AuthTokens: Codable, Equatable {
    let accessToken: String
    let refreshToken: String
}

struct LoginResponse: Decodable {
    let tokens: AuthTokens
    let user: UserResponse
}

struct UserResponse: Decodable {
    let id: String
    let email: String
    let name: String
    let avatarUrl: String?
    let isAdmin: Bool?
}

struct RegisterResponse: Decodable {
    let accessToken: String
    let refreshToken: String
}

struct RefreshTokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String
}

struct MeResponse: Decodable {
    let id: String
    let email: String
    let name: String
    let avatarUrl: String?
    let isAdmin: Bool?
    let provider: String?
}

// MARK: - Passkey Types

struct PasskeyBeginResponse: Decodable {
    let challenge: String
    let rpId: String?
    let rp: PasskeyRP?
    let user: PasskeyUser?
}

struct PasskeyRP: Decodable {
    let id: String
    let name: String
}

struct PasskeyUser: Decodable {
    let id: String
    let name: String
    let displayName: String
}

struct PasskeySignupBeginRequest: Encodable {
    let email: String
    let name: String
}

// MARK: - Auth API

struct AuthAPI {
    let client: APIClient

    init(client: APIClient) {
        self.client = client
    }

    func login(email: String, password: String) async throws -> LoginResponse {
        try await client.fetch(
            "/auth/login",
            method: "POST",
            body: LoginRequest(email: email, password: password)
        )
    }

    func register(email: String, password: String, name: String) async throws -> RegisterResponse {
        try await client.fetch(
            "/auth/register",
            method: "POST",
            body: RegisterRequest(email: email, password: password, name: name)
        )
    }

    func guestLogin(name: String) async throws -> LoginResponse {
        try await client.fetch(
            "/auth/guest-login",
            method: "POST",
            body: GuestLoginRequest(name: name)
        )
    }

    func refreshToken(refreshToken: String) async throws -> RefreshTokenResponse {
        try await client.fetch(
            "/auth/refresh",
            method: "POST",
            body: RefreshTokenRequest(refreshToken: refreshToken)
        )
    }

    func getMe(authManager: AuthManager) async throws -> MeResponse {
        try await client.authFetch("/auth/me", authManager: authManager)
    }

    // MARK: - Passkey Endpoints

    func passkeyRegisterBegin(authManager: AuthManager) async throws -> PasskeyBeginResponse {
        try await client.authFetch("/auth/passkey/register/begin", method: "POST", authManager: authManager)
    }

    func passkeyRegisterFinish(data: [String: String], authManager: AuthManager) async throws -> Data {
        let url = URL(string: "\(client.baseURL)/auth/passkey/register/finish")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = try await authManager.getValidAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: data)
        let (responseData, _) = try await URLSession.shared.data(for: request)
        return responseData
    }

    func passkeyLoginBegin() async throws -> PasskeyBeginResponse {
        let url = URL(string: "\(client.baseURL)/auth/passkey/login/begin")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(PasskeyBeginResponse.self, from: data)
    }

    func passkeyLoginFinish(data: [String: String]) async throws -> LoginResponse {
        let url = URL(string: "\(client.baseURL)/auth/passkey/login/finish")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: data)
        let (responseData, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw APIError.httpError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0, message: "Passkey login failed")
        }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(LoginResponse.self, from: responseData)
    }

    func passkeySignupBegin(email: String, name: String) async throws -> PasskeyBeginResponse {
        let url = URL(string: "\(client.baseURL)/auth/passkey/signup/begin")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        request.httpBody = try encoder.encode(PasskeySignupBeginRequest(email: email, name: name))
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw APIError.httpError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0, message: "Failed to start passkey signup")
        }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(PasskeyBeginResponse.self, from: data)
    }

    func passkeySignupFinish(data: [String: String]) async throws -> LoginResponse {
        let url = URL(string: "\(client.baseURL)/auth/passkey/signup/finish")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: data)
        let (responseData, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw APIError.httpError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0, message: "Passkey signup failed")
        }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(LoginResponse.self, from: responseData)
    }
}
