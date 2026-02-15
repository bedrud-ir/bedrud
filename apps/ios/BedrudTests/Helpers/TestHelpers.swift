import Foundation
import KeychainAccess
@testable import Bedrud

// MARK: - Test Helpers

/// Reusable test helpers for reducing test code duplication

enum TestHelpers {

    // MARK: - JWT Helpers

    /// Creates a fake JWT token for testing purposes
    /// - Parameters:
    ///   - userId: The user ID to include in the token
    ///   - email: The email to include in the token
    ///   - exp: Optional expiration timestamp (defaults to 1 hour from now)
    ///   - accesses: Optional array of access roles
    /// - Returns: A base64URL-encoded fake JWT string
    static func fakeJWT(
        userId: String = "u1",
        email: String = "a@b.com",
        exp: TimeInterval? = nil,
        accesses: [String]? = nil
    ) -> String {
        let expValue = exp ?? (Date().timeIntervalSince1970 + 3600)
        var payload: [String: Any] = [
            "userId": userId,
            "email": email,
            "exp": expValue,
            "iat": Date().timeIntervalSince1970
        ]
        if let accesses = accesses {
            payload["accesses"] = accesses
        }
        let payloadData = try! JSONSerialization.data(withJSONObject: payload)
        let payloadBase64 = payloadData.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
        return "header.\(payloadBase64).signature"
    }

    /// Creates an expired JWT token
    /// - Returns: A fake JWT token that expired 100 seconds ago
    static func expiredJWT() -> String {
        fakeJWT(exp: Date().timeIntervalSince1970 - 100)
    }

    // MARK: - AuthManager Helpers

    /// Creates an authenticated AuthManager instance
    /// - Parameters:
    ///   - instanceId: The instance ID for the manager
    ///   - keychain: Optional custom keychain (creates isolated one by default)
    ///   - session: Optional mock URLSession
    /// - Returns: An AuthManager with a logged-in user
    @MainActor
    static func createAuthenticatedAuthManager(
        instanceId: String = "test-instance",
        keychain: Keychain? = nil,
        session: URLSession? = nil
    ) -> AuthManager {
        let testKeychain = keychain ?? Keychain(service: "org.bedrud.tests.helpers.\(UUID().uuidString)")
        let testSession = session ?? URLSession.mock()

        let client = APIClient(baseURL: "https://test.com/api", session: testSession)
        let authAPI = AuthAPI(client: client)
        let manager = AuthManager(instanceId: instanceId, authAPI: authAPI, keychain: testKeychain)

        // Login with test tokens
        let tokens = AuthTokens(accessToken: fakeJWT(), refreshToken: "refresh")
        let user = User(id: "u1", email: "a@b.com", name: "Test User", avatarUrl: nil, isAdmin: false, provider: nil)
        manager.loginWithTokens(tokens: tokens, user: user)

        return manager
    }

    /// Creates an AuthManager instance without authentication
    /// - Parameters:
    ///   - instanceId: The instance ID for the manager
    ///   - keychain: Optional custom keychain (creates isolated one by default)
    ///   - session: Optional mock URLSession
    /// - Returns: An unauthenticated AuthManager
    @MainActor
    static func createUnauthenticatedAuthManager(
        instanceId: String = "test-instance",
        keychain: Keychain? = nil,
        session: URLSession? = nil
    ) -> AuthManager {
        let testKeychain = keychain ?? Keychain(service: "org.bedrud.tests.helpers.\(UUID().uuidString)")
        let testSession = session ?? URLSession.mock()

        let client = APIClient(baseURL: "https://test.com/api", session: testSession)
        let authAPI = AuthAPI(client: client)
        return AuthManager(instanceId: instanceId, authAPI: authAPI, keychain: testKeychain)
    }

    // MARK: - Mock Response Helpers

    /// Creates a mock health check success response
    /// - Parameters:
    ///   - status: The status value (default: "ok")
    ///   - version: The version string (default: "1.0.0")
    /// - Returns: A tuple of (HTTPURLResponse, Data) for use in MockURLProtocol
    static func healthResponseJSON(status: String = "ok", version: String = "1.0.0") -> (HTTPURLResponse, Data) {
        let json = #"{"status":"\(status)","version":"\(version)"}"#
        let response = HTTPURLResponse(
            url: URL(string: "https://test.com/health")!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: nil
        )!
        return (response, json.data(using: .utf8)!)
    }

    /// Creates a mock success response
    /// - Parameters:
    ///   - statusCode: The HTTP status code (default: 200)
    ///   - body: Optional response body as JSON string
    /// - Returns: A tuple of (HTTPURLResponse, Data) for use in MockURLProtocol
    static func successResponse(statusCode: Int = 200, body: String? = #"{"status":"ok"}"#) -> (HTTPURLResponse, Data) {
        let responseData = body?.data(using: .utf8) ?? Data()
        let response = HTTPURLResponse(
            url: URL(string: "https://test.com")!,
            statusCode: statusCode,
            httpVersion: nil,
            headerFields: nil
        )!
        return (response, responseData)
    }

    /// Creates a mock error response
    /// - Parameters:
    ///   - statusCode: The HTTP status code (default: 400)
    ///   - message: The error message
    /// - Returns: A tuple of (HTTPURLResponse, Data) for use in MockURLProtocol
    static func errorResponse(statusCode: Int = 400, message: String = "Bad request") -> (HTTPURLResponse, Data) {
        let json = #"{"error":"\(message)"}"#
        let response = HTTPURLResponse(
            url: URL(string: "https://test.com")!,
            statusCode: statusCode,
            httpVersion: nil,
            headerFields: nil
        )!
        return (response, json.data(using: .utf8)!)
    }

    /// Creates a mock 401 unauthorized response
    /// - Returns: A tuple of (HTTPURLResponse, Data) for use in MockURLProtocol
    static func unauthorizedResponse() -> (HTTPURLResponse, Data) {
        let response = HTTPURLResponse(
            url: URL(string: "https://test.com")!,
            statusCode: 401,
            httpVersion: nil,
            headerFields: nil
        )!
        return (response, Data())
    }

    // MARK: - User Helpers

    /// Creates a test User instance
    /// - Parameters:
    ///   - id: User ID (default: "u1")
    ///   - email: User email (default: "test@example.com")
    ///   - name: User name (default: "Test User")
    ///   - isAdmin: Whether user is admin (default: false)
    /// - Returns: A User instance
    static func createUser(
        id: String = "u1",
        email: String = "test@example.com",
        name: String = "Test User",
        isAdmin: Bool = false
    ) -> User {
        User(id: id, email: email, name: name, avatarUrl: nil, isAdmin: isAdmin, provider: nil)
    }

    /// Creates an admin user instance
    /// - Returns: A User instance with isAdmin = true
    static func createAdminUser() -> User {
        createUser(isAdmin: true)
    }
}
