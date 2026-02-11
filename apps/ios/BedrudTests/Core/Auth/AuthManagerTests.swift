import XCTest
import KeychainAccess
@testable import Bedrud

@MainActor
final class AuthManagerTests: XCTestCase {
    private var keychain: Keychain!
    private var session: URLSession!
    private var serviceName: String!

    override func setUp() {
        super.setUp()
        let id = UUID().uuidString
        serviceName = "com.bedrud.tests.auth.\(id)"
        keychain = Keychain(service: serviceName)
        session = URLSession.mock()
    }

    override func tearDown() {
        try? keychain.removeAll()
        MockURLProtocol.requestHandler = nil
        keychain = nil
        session = nil
        super.tearDown()
    }

    private func makeAuthManager(instanceId: String = "test-instance") -> AuthManager {
        let client = APIClient(baseURL: "https://test.com/api", session: session)
        let authAPI = AuthAPI(client: client)
        return AuthManager(instanceId: instanceId, authAPI: authAPI, keychain: keychain)
    }

    // MARK: - Helper: Create a fake JWT

    private func fakeJWT(userId: String = "u1", email: String = "a@b.com", exp: TimeInterval? = nil, accesses: [String]? = nil) -> String {
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

    // MARK: - Restore Session

    func testRestoreSessionWithNoTokens() {
        // Set up a handler that will fail the /auth/me call
        MockURLProtocol.requestHandler = { _ in
            let response = HTTPURLResponse(url: URL(string: "https://test.com")!, statusCode: 401, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let manager = makeAuthManager()
        XCTAssertFalse(manager.isAuthenticated)
        XCTAssertNil(manager.currentUser)
    }

    func testRestoreSessionWithStoredTokens() {
        let token = fakeJWT()
        keychain["test-instance_access_token"] = token
        keychain["test-instance_refresh_token"] = "refresh-token"

        let userData = try! JSONEncoder().encode(User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil))
        keychain["test-instance_user_data"] = String(data: userData, encoding: .utf8)

        // Mock the /auth/me call
        MockURLProtocol.requestHandler = { request in
            let meJSON = #"{"id":"u1","email":"a@b.com","name":"Alice","avatar_url":null,"is_admin":false,"provider":null}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, meJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        XCTAssertTrue(manager.isAuthenticated)
        XCTAssertNotNil(manager.currentUser)
        XCTAssertEqual(manager.currentUser?.id, "u1")
    }

    // MARK: - Login

    func testLoginStoresTokensAndSetsUser() async throws {
        MockURLProtocol.requestHandler = { request in
            let responseJSON = """
            {
                "tokens": {"access_token": "new-access", "refresh_token": "new-refresh"},
                "user": {"id": "u1", "email": "a@b.com", "name": "Alice", "avatar_url": null, "is_admin": false}
            }
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        let user = try await manager.login(email: "a@b.com", password: "pass")

        XCTAssertEqual(user.id, "u1")
        XCTAssertEqual(user.name, "Alice")
        XCTAssertTrue(manager.isAuthenticated)
        XCTAssertEqual(keychain["test-instance_access_token"], "new-access")
        XCTAssertEqual(keychain["test-instance_refresh_token"], "new-refresh")
    }

    // MARK: - Register

    func testRegisterStoresTokensAndDecodesJWT() async throws {
        let token = fakeJWT(userId: "u2", email: "b@c.com", accesses: ["admin"])

        MockURLProtocol.requestHandler = { request in
            let responseJSON = """
            {"access_token": "\(token)", "refresh_token": "reg-refresh"}
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        let user = try await manager.register(email: "b@c.com", password: "pass", name: "Bob")

        XCTAssertEqual(user.id, "u2")
        XCTAssertEqual(user.name, "Bob")
        XCTAssertTrue(user.isAdmin)
        XCTAssertTrue(manager.isAuthenticated)
    }

    // MARK: - Guest Login

    func testGuestLoginStoresTokensAndSetsUser() async throws {
        MockURLProtocol.requestHandler = { request in
            let responseJSON = """
            {
                "tokens": {"access_token": "guest-access", "refresh_token": "guest-refresh"},
                "user": {"id": "g1", "email": "", "name": "Guest", "avatar_url": null, "is_admin": false}
            }
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        let user = try await manager.guestLogin(name: "Guest")

        XCTAssertEqual(user.id, "g1")
        XCTAssertEqual(user.name, "Guest")
        XCTAssertTrue(manager.isAuthenticated)
    }

    // MARK: - Logout

    func testLogoutClearsKeychainAndState() async throws {
        keychain["test-instance_access_token"] = "token"
        keychain["test-instance_refresh_token"] = "refresh"
        keychain["test-instance_user_data"] = "{}"

        // Mock /auth/me to succeed
        MockURLProtocol.requestHandler = { request in
            let meJSON = #"{"id":"u1","email":"a@b.com","name":"Alice","avatar_url":null,"is_admin":false,"provider":null}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, meJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        await manager.logout()

        XCTAssertFalse(manager.isAuthenticated)
        XCTAssertNil(manager.currentUser)
        XCTAssertNil(keychain["test-instance_access_token"])
        XCTAssertNil(keychain["test-instance_refresh_token"])
        XCTAssertNil(keychain["test-instance_user_data"])
    }

    // MARK: - loginWithTokens

    func testLoginWithTokensSetsStateDirect() {
        let manager = makeAuthManager()
        let tokens = AuthTokens(accessToken: "a", refreshToken: "r")
        let user = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil)

        manager.loginWithTokens(tokens: tokens, user: user)

        XCTAssertTrue(manager.isAuthenticated)
        XCTAssertEqual(manager.currentUser?.id, "u1")
        XCTAssertEqual(keychain["test-instance_access_token"], "a")
        XCTAssertEqual(keychain["test-instance_refresh_token"], "r")
    }

    // MARK: - getValidAccessToken

    func testGetValidAccessTokenReturnsTokenWhenValid() async throws {
        let token = fakeJWT(exp: Date().timeIntervalSince1970 + 3600)
        keychain["test-instance_access_token"] = token
        keychain["test-instance_refresh_token"] = "refresh"

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let manager = makeAuthManager()
        let result = try await manager.getValidAccessToken()
        XCTAssertEqual(result, token)
    }

    func testGetValidAccessTokenReturnsNilWhenNoToken() async throws {
        let manager = makeAuthManager()
        let result = try await manager.getValidAccessToken()
        XCTAssertNil(result)
    }

    func testGetValidAccessTokenRefreshesWhenExpired() async throws {
        let expiredToken = fakeJWT(exp: Date().timeIntervalSince1970 - 100)
        keychain["test-instance_access_token"] = expiredToken
        keychain["test-instance_refresh_token"] = "old-refresh"

        let newToken = fakeJWT(exp: Date().timeIntervalSince1970 + 3600)

        MockURLProtocol.requestHandler = { request in
            if request.url!.absoluteString.contains("/auth/refresh") {
                let responseJSON = """
                {"access_token": "\(newToken)", "refresh_token": "new-refresh"}
                """
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, responseJSON.data(using: .utf8)!)
            }
            // /auth/me call
            let response = HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let manager = makeAuthManager()
        let result = try await manager.getValidAccessToken()
        XCTAssertEqual(result, newToken)
    }

    // MARK: - refreshAccessToken

    func testRefreshAccessTokenSuccess() async throws {
        keychain["test-instance_refresh_token"] = "old-refresh"
        let newToken = "new-access-token"

        MockURLProtocol.requestHandler = { request in
            if request.url!.absoluteString.contains("/auth/refresh") {
                let responseJSON = """
                {"access_token": "\(newToken)", "refresh_token": "new-refresh"}
                """
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, responseJSON.data(using: .utf8)!)
            }
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let manager = makeAuthManager()
        let result = try await manager.refreshAccessToken()
        XCTAssertEqual(result, newToken)
    }

    func testRefreshAccessTokenReturnsNilWhenNoRefreshToken() async throws {
        let manager = makeAuthManager()
        let result = try await manager.refreshAccessToken()
        XCTAssertNil(result)
    }

    // MARK: - isLoading State

    func testLoginSetsIsLoadingDuringRequest() async throws {
        MockURLProtocol.requestHandler = { request in
            let responseJSON = """
            {
                "tokens": {"access_token": "at", "refresh_token": "rt"},
                "user": {"id": "u1", "email": "a@b.com", "name": "Alice", "avatar_url": null, "is_admin": false}
            }
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        XCTAssertFalse(manager.isLoading)

        _ = try await manager.login(email: "a@b.com", password: "pass")

        // After completion, isLoading should be false
        XCTAssertFalse(manager.isLoading)
    }

    func testRegisterSetsIsLoadingDuringRequest() async throws {
        let token = fakeJWT(userId: "u1", email: "a@b.com")

        MockURLProtocol.requestHandler = { request in
            let responseJSON = #"{"access_token": "\#(token)", "refresh_token": "rt"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        XCTAssertFalse(manager.isLoading)

        _ = try await manager.register(email: "a@b.com", password: "pass", name: "Alice")

        XCTAssertFalse(manager.isLoading)
    }

    func testGuestLoginSetsIsLoadingDuringRequest() async throws {
        MockURLProtocol.requestHandler = { request in
            let responseJSON = """
            {
                "tokens": {"access_token": "gt", "refresh_token": "gr"},
                "user": {"id": "g1", "email": "", "name": "Guest", "avatar_url": null, "is_admin": false}
            }
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        _ = try await manager.guestLogin(name: "Guest")
        XCTAssertFalse(manager.isLoading)
    }

    // MARK: - isLoading Reset on Failure

    func testLoginResetsIsLoadingOnError() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let manager = makeAuthManager()
        do {
            _ = try await manager.login(email: "a@b.com", password: "wrong")
            XCTFail("Should throw")
        } catch {
            XCTAssertFalse(manager.isLoading)
        }
    }

    // MARK: - User Caching in Keychain

    func testLoginCachesUserDataInKeychain() async throws {
        MockURLProtocol.requestHandler = { request in
            let responseJSON = """
            {
                "tokens": {"access_token": "at", "refresh_token": "rt"},
                "user": {"id": "u1", "email": "a@b.com", "name": "Alice", "avatar_url": null, "is_admin": false}
            }
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        _ = try await manager.login(email: "a@b.com", password: "pass")

        // Verify user data is cached
        let cachedUserData = keychain["test-instance_user_data"]
        XCTAssertNotNil(cachedUserData)

        // Verify we can decode it
        let data = cachedUserData!.data(using: .utf8)!
        let cachedUser = try JSONDecoder().decode(User.self, from: data)
        XCTAssertEqual(cachedUser.id, "u1")
        XCTAssertEqual(cachedUser.name, "Alice")
    }

    // MARK: - loginWithTokens Caches User

    func testLoginWithTokensCachesUserData() {
        let manager = makeAuthManager()
        let tokens = AuthTokens(accessToken: "a", refreshToken: "r")
        let user = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil)

        manager.loginWithTokens(tokens: tokens, user: user)

        let cachedUserData = keychain["test-instance_user_data"]
        XCTAssertNotNil(cachedUserData)
    }

    // MARK: - Instance ID Scoping

    func testTokensAreScopedToInstanceId() async throws {
        MockURLProtocol.requestHandler = { request in
            let responseJSON = """
            {
                "tokens": {"access_token": "at", "refresh_token": "rt"},
                "user": {"id": "u1", "email": "a@b.com", "name": "Alice", "avatar_url": null, "is_admin": false}
            }
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let manager1 = makeAuthManager(instanceId: "instance-1")
        let manager2 = makeAuthManager(instanceId: "instance-2")

        _ = try await manager1.login(email: "a@b.com", password: "pass")

        // Manager 1 should have tokens
        XCTAssertNotNil(keychain["instance-1_access_token"])
        XCTAssertNotNil(keychain["instance-1_refresh_token"])

        // Manager 2 should NOT have tokens
        XCTAssertNil(keychain["instance-2_access_token"])
        XCTAssertNil(keychain["instance-2_refresh_token"])

        // Manager 2 should not be authenticated
        XCTAssertFalse(manager2.isAuthenticated)
    }

    // MARK: - Login Error Does Not Set Auth State

    func testLoginFailureDoesNotSetAuthenticated() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let manager = makeAuthManager()
        do {
            _ = try await manager.login(email: "a@b.com", password: "wrong")
            XCTFail("Should throw")
        } catch {
            XCTAssertFalse(manager.isAuthenticated)
            XCTAssertNil(manager.currentUser)
        }
    }

    // MARK: - Register Returns User with Admin from JWT

    func testRegisterReturnsAdminUser() async throws {
        let token = fakeJWT(userId: "u1", email: "admin@test.com", accesses: ["admin", "moderator"])

        MockURLProtocol.requestHandler = { request in
            let responseJSON = #"{"access_token": "\#(token)", "refresh_token": "rt"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        let user = try await manager.register(email: "admin@test.com", password: "pass", name: "Admin")

        XCTAssertTrue(user.isAdmin)
    }

    func testRegisterReturnsNonAdminUser() async throws {
        let token = fakeJWT(userId: "u1", email: "user@test.com", accesses: ["user"])

        MockURLProtocol.requestHandler = { request in
            let responseJSON = #"{"access_token": "\#(token)", "refresh_token": "rt"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let manager = makeAuthManager()
        let user = try await manager.register(email: "user@test.com", password: "pass", name: "User")

        XCTAssertFalse(user.isAdmin)
    }

    // MARK: - Logout Idempotent

    func testLogoutWhenNotAuthenticatedIsNoop() async {
        let manager = makeAuthManager()
        XCTAssertFalse(manager.isAuthenticated)

        await manager.logout()

        XCTAssertFalse(manager.isAuthenticated)
        XCTAssertNil(manager.currentUser)
    }
}
