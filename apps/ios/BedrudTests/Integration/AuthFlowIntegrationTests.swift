import XCTest
import KeychainAccess
@testable import Bedrud

/// Integration tests that verify the full authentication flow from API through
/// AuthManager to token storage and authenticated API calls.
@MainActor
final class AuthFlowIntegrationTests: XCTestCase {
    private var session: URLSession!
    private var keychain: Keychain!
    private var client: APIClient!
    private var authAPI: AuthAPI!
    private var authManager: AuthManager!
    private var roomAPI: RoomAPI!

    override func setUp() {
        super.setUp()
        let id = UUID().uuidString
        session = URLSession.mock()
        keychain = Keychain(service: "org.bedrud.tests.integration.auth.\(id)")
        client = APIClient(baseURL: "https://test.com/api", session: session)
        authAPI = AuthAPI(client: client)
        authManager = AuthManager(instanceId: "integration-test", authAPI: authAPI, keychain: keychain)
        roomAPI = RoomAPI(client: client, authManager: authManager)
    }

    override func tearDown() {
        MockURLProtocol.requestHandler = nil
        try? keychain.removeAll()
        session = nil
        keychain = nil
        client = nil
        authAPI = nil
        authManager = nil
        roomAPI = nil
        super.tearDown()
    }

    private func fakeJWT(userId: String = "u1", email: String = "a@b.com", exp: TimeInterval? = nil) -> String {
        let expValue = exp ?? (Date().timeIntervalSince1970 + 3600)
        let payload: [String: Any] = [
            "userId": userId,
            "email": email,
            "exp": expValue,
            "iat": Date().timeIntervalSince1970
        ]
        let payloadData = try! JSONSerialization.data(withJSONObject: payload)
        let payloadBase64 = payloadData.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
        return "header.\(payloadBase64).signature"
    }

    // MARK: - Full Login → Authenticated API Call

    func testLoginThenAuthenticatedAPICall() async throws {
        let token = fakeJWT()

        var requestCount = 0
        MockURLProtocol.requestHandler = { request in
            requestCount += 1
            let url = request.url!.absoluteString

            if url.hasSuffix("/auth/login") {
                let responseJSON = """
                {
                    "tokens": {"access_token": "\(token)", "refresh_token": "refresh-1"},
                    "user": {"id": "u1", "email": "a@b.com", "name": "Alice", "avatar_url": null, "is_admin": false}
                }
                """
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, responseJSON.data(using: .utf8)!)
            }

            if url.hasSuffix("/room/list") {
                // Verify auth header is present
                XCTAssertTrue(request.value(forHTTPHeaderField: "Authorization")!.contains(token))

                let listJSON = """
                [{"id": "r1", "name": "Room 1", "created_by": "u1", "is_active": true, "max_participants": 10, "expires_at": "2025-12-31", "settings": {"allow_chat": true, "allow_video": true, "allow_audio": true, "require_approval": false, "e2ee": false}, "relationship": null, "mode": "meeting"}]
                """
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, listJSON.data(using: .utf8)!)
            }

            XCTFail("Unexpected request: \(url)")
            let response = HTTPURLResponse(url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        // Step 1: Login
        let user = try await authManager.login(email: "a@b.com", password: "pass")
        XCTAssertEqual(user.id, "u1")
        XCTAssertTrue(authManager.isAuthenticated)

        // Step 2: Make authenticated API call
        let rooms = try await roomAPI.listRooms()
        XCTAssertEqual(rooms.count, 1)
        XCTAssertEqual(rooms[0].name, "Room 1")

        XCTAssertEqual(requestCount, 2)
    }

    // MARK: - Login → Logout → Unauthenticated

    func testLoginThenLogoutClearsState() async throws {
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

        _ = try await authManager.login(email: "a@b.com", password: "pass")
        XCTAssertTrue(authManager.isAuthenticated)

        await authManager.logout()
        XCTAssertFalse(authManager.isAuthenticated)
        XCTAssertNil(authManager.currentUser)

        // Trying to call authenticated endpoint should fail
        do {
            _ = try await roomAPI.listRooms()
            XCTFail("Should throw unauthorized")
        } catch let error as APIError {
            if case .unauthorized = error {
                // Expected
            } else {
                XCTFail("Expected unauthorized, got \(error)")
            }
        }
    }

    // MARK: - Session Restoration → Authenticated Call

    func testSessionRestorationThenAPICall() async throws {
        let token = fakeJWT()

        // Pre-populate keychain as if user was previously logged in
        keychain["integration-test_access_token"] = token
        keychain["integration-test_refresh_token"] = "refresh"
        let userData = try! JSONEncoder().encode(User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil))
        keychain["integration-test_user_data"] = String(data: userData, encoding: .utf8)

        MockURLProtocol.requestHandler = { request in
            let url = request.url!.absoluteString

            if url.hasSuffix("/auth/me") {
                let meJSON = #"{"id":"u1","email":"a@b.com","name":"Alice","avatar_url":null,"is_admin":false,"provider":null}"#
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, meJSON.data(using: .utf8)!)
            }

            if url.hasSuffix("/room/list") {
                let listJSON = "[]"
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, listJSON.data(using: .utf8)!)
            }

            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, "{}".data(using: .utf8)!)
        }

        // Create new AuthManager which should restore session
        let restoredManager = AuthManager(instanceId: "integration-test", authAPI: authAPI, keychain: keychain)
        let restoredRoomAPI = RoomAPI(client: client, authManager: restoredManager)

        XCTAssertTrue(restoredManager.isAuthenticated)
        XCTAssertEqual(restoredManager.currentUser?.id, "u1")

        // Should be able to make authenticated call
        let rooms = try await restoredRoomAPI.listRooms()
        XCTAssertNotNil(rooms)
    }

    // MARK: - Token Refresh During API Call

    func testTokenRefreshDuringAPICall() async throws {
        let expiredToken = fakeJWT(exp: Date().timeIntervalSince1970 - 100)
        let newToken = fakeJWT(exp: Date().timeIntervalSince1970 + 3600)

        // Pre-populate with expired token
        keychain["integration-test_access_token"] = expiredToken
        keychain["integration-test_refresh_token"] = "old-refresh"
        let userData = try! JSONEncoder().encode(User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil))
        keychain["integration-test_user_data"] = String(data: userData, encoding: .utf8)

        var refreshCalled = false
        MockURLProtocol.requestHandler = { request in
            let url = request.url!.absoluteString

            if url.hasSuffix("/auth/me") {
                let response = HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!
                return (response, Data())
            }

            if url.hasSuffix("/auth/refresh") {
                refreshCalled = true
                let responseJSON = #"{"access_token": "\#(newToken)", "refresh_token": "new-refresh"}"#
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, responseJSON.data(using: .utf8)!)
            }

            if url.hasSuffix("/room/list") {
                let listJSON = "[]"
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, listJSON.data(using: .utf8)!)
            }

            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, "{}".data(using: .utf8)!)
        }

        let restoredManager = AuthManager(instanceId: "integration-test", authAPI: authAPI, keychain: keychain)
        let restoredRoomAPI = RoomAPI(client: client, authManager: restoredManager)

        // Wait a moment for the background token validation
        try await Task.sleep(nanoseconds: 200_000_000)

        let rooms = try await restoredRoomAPI.listRooms()
        XCTAssertNotNil(rooms)
        XCTAssertTrue(refreshCalled, "Token refresh should have been called")
    }

    // MARK: - Register → Authenticated

    func testRegisterThenAuthenticated() async throws {
        let token = fakeJWT(userId: "u2", email: "new@test.com")

        MockURLProtocol.requestHandler = { request in
            let url = request.url!.absoluteString

            if url.hasSuffix("/auth/register") {
                let responseJSON = #"{"access_token": "\#(token)", "refresh_token": "reg-refresh"}"#
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, responseJSON.data(using: .utf8)!)
            }

            if url.hasSuffix("/room/create") {
                let roomJSON = """
                {"id": "r1", "name": "New Room", "created_by": "u2", "admin_id": "u2", "is_active": true, "is_public": false, "max_participants": 10, "expires_at": "2025-12-31", "settings": {"allow_chat": true, "allow_video": true, "allow_audio": true, "require_approval": false, "e2ee": false}, "relationship": null, "mode": "meeting", "participants": null}
                """
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, roomJSON.data(using: .utf8)!)
            }

            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, "{}".data(using: .utf8)!)
        }

        let user = try await authManager.register(email: "new@test.com", password: "pass", name: "New User")
        XCTAssertEqual(user.email, "new@test.com")
        XCTAssertTrue(authManager.isAuthenticated)

        // Should be able to create a room
        let room = try await roomAPI.createRoom(name: "New Room")
        XCTAssertEqual(room.name, "New Room")
    }

    // MARK: - Guest Login → Limited Access

    func testGuestLoginThenAPICall() async throws {
        // Guest token must be a valid JWT for getValidAccessToken() to work
        let guestToken = fakeJWT(userId: "g1", email: "")

        MockURLProtocol.requestHandler = { request in
            let url = request.url!.absoluteString

            if url.hasSuffix("/auth/guest-login") {
                let responseJSON = """
                {
                    "tokens": {"access_token": "\(guestToken)", "refresh_token": "guest-refresh"},
                    "user": {"id": "g1", "email": "", "name": "Guest", "avatar_url": null, "is_admin": false}
                }
                """
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, responseJSON.data(using: .utf8)!)
            }

            if url.hasSuffix("/room/join") {
                let joinJSON = """
                {"id": "r1", "name": "Room", "token": "lk-token", "livekit_host": "wss://lk.test.com", "created_by": "u1", "admin_id": "u1", "is_active": true, "is_public": false, "max_participants": 10, "expires_at": "2025-12-31", "settings": {"allow_chat": true, "allow_video": true, "allow_audio": true, "require_approval": false, "e2ee": false}, "mode": "meeting"}
                """
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, joinJSON.data(using: .utf8)!)
            }

            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, "{}".data(using: .utf8)!)
        }

        let user = try await authManager.guestLogin(name: "Guest")
        XCTAssertEqual(user.name, "Guest")
        XCTAssertTrue(authManager.isAuthenticated)

        let joinResponse = try await roomAPI.joinRoom(roomName: "my-room")
        XCTAssertEqual(joinResponse.token, "lk-token")
    }
}
