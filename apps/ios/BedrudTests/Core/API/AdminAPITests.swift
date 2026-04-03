import XCTest
import KeychainAccess
@testable import Bedrud

@MainActor
final class AdminAPITests: XCTestCase {
    private var session: URLSession!
    private var client: APIClient!
    private var authManager: AuthManager!
    private var adminAPI: AdminAPI!
    private var keychain: Keychain!

    override func setUp() {
        super.setUp()
        let id = UUID().uuidString
        session = URLSession.mock()
        client = APIClient(baseURL: "https://test.com/api", session: session)
        keychain = Keychain(service: "org.bedrud.tests.adminapi.\(id)")
        let authAPI = AuthAPI(client: client)
        authManager = AuthManager(instanceId: "test", authAPI: authAPI, keychain: keychain)
        adminAPI = AdminAPI(client: client, authManager: authManager)
        // Authenticate so auth header is included
        let tokens = AuthTokens(accessToken: TestHelpers.fakeJWT(), refreshToken: "r")
        authManager.loginWithTokens(tokens: tokens, user: TestHelpers.createAdminUser())
    }

    override func tearDown() {
        MockURLProtocol.requestHandler = nil
        try? keychain.removeAll()
        session = nil; client = nil; authManager = nil; adminAPI = nil; keychain = nil
        super.tearDown()
    }

    // MARK: - Users

    func testListUsersReturnsUserList() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/admin/users"))
            XCTAssertEqual(request.httpMethod, "GET")
            let json = """
            [{"id":"u1","email":"a@b.com","name":"Alice","is_active":true,"is_admin":false,"provider":"local","created_at":"2025-01-01"}]
            """
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, json.data(using: .utf8)!)
        }
        let users = try await adminAPI.listUsers()
        XCTAssertEqual(1, users.count)
        XCTAssertEqual("u1", users[0].id)
        XCTAssertEqual("Alice", users[0].name)
        XCTAssertTrue(users[0].isActive)
        XCTAssertFalse(users[0].isAdmin)
    }

    func testListUsersReturnsEmptyList() async throws {
        MockURLProtocol.requestHandler = { request in
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, "[]".data(using: .utf8)!)
        }
        let users = try await adminAPI.listUsers()
        XCTAssertTrue(users.isEmpty)
    }

    func testListUsersThrowsOnUnauthorized() async {
        MockURLProtocol.requestHandler = { request in
            let res = HTTPURLResponse(url: request.url!, statusCode: 403, httpVersion: nil, headerFields: nil)!
            return (res, Data())
        }
        do {
            _ = try await adminAPI.listUsers()
            XCTFail("Should throw on 403")
        } catch { /* expected */ }
    }

    func testSetUserStatusSendsPUTWithActiveField() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/admin/users/user123/status"))
            XCTAssertEqual(request.httpMethod, "PUT")
            let body = String(data: request.httpBody ?? Data(), encoding: .utf8) ?? ""
            XCTAssertTrue(body.contains("active") || body.contains("false"))
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, Data())
        }
        try await adminAPI.setUserStatus(id: "user123", active: false)
    }

    // MARK: - Rooms

    func testListRoomsReturnsRoomList() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/admin/rooms"))
            let json = """
            [{"id":"r1","name":"Test Room","is_active":true,"is_public":false,"max_participants":20,"created_at":"2025-01-01"}]
            """
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, json.data(using: .utf8)!)
        }
        let rooms = try await adminAPI.listRooms()
        XCTAssertEqual(1, rooms.count)
        XCTAssertEqual("r1", rooms[0].id)
        XCTAssertEqual("Test Room", rooms[0].name)
        XCTAssertTrue(rooms[0].isActive)
        XCTAssertEqual(false, rooms[0].isPublic)
        XCTAssertEqual(20, rooms[0].maxParticipants)
    }

    func testDeleteRoomSendsDELETE() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/admin/rooms/room456"))
            XCTAssertEqual(request.httpMethod, "DELETE")
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, Data())
        }
        try await adminAPI.deleteRoom(id: "room456")
    }

    func testUpdateRoomSendsPUTWithMaxParticipants() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/admin/rooms/room789"))
            XCTAssertEqual(request.httpMethod, "PUT")
            let body = String(data: request.httpBody ?? Data(), encoding: .utf8) ?? ""
            XCTAssertTrue(body.contains("100") || body.contains("maxParticipants"))
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, Data())
        }
        try await adminAPI.updateRoom(id: "room789", maxParticipants: 100)
    }

    // MARK: - Settings

    func testGetSettingsReturnsSettings() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/admin/settings"))
            let json = #"{"allow_registrations":true,"require_invite_token":false}"#
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, json.data(using: .utf8)!)
        }
        let settings = try await adminAPI.getSettings()
        XCTAssertTrue(settings.allowRegistrations)
        XCTAssertFalse(settings.requireInviteToken)
    }

    func testUpdateSettingsSendsPUT() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.httpMethod, "PUT")
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/admin/settings"))
            let body = String(data: request.httpBody ?? Data(), encoding: .utf8) ?? ""
            XCTAssertTrue(body.contains("false") || body.contains("allow_registrations"))
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, Data())
        }
        try await adminAPI.updateSettings(AdminSettings(allowRegistrations: false, requireInviteToken: true))
    }

    // MARK: - Invite Tokens

    func testListInviteTokensReturnsTokenList() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/admin/invite-tokens"))
            let json = """
            [{"id":"t1","token":"tok-abc","email":"x@y.com","expires_at":"2025-12-31","used_at":null,"used":false}]
            """
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, json.data(using: .utf8)!)
        }
        let tokens = try await adminAPI.listInviteTokens()
        XCTAssertEqual(1, tokens.count)
        XCTAssertEqual("t1", tokens[0].id)
        XCTAssertEqual("tok-abc", tokens[0].token)
        XCTAssertEqual(false, tokens[0].used)
    }

    func testCreateInviteTokenSendsPOSTWithEmailAndExpiry() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/admin/invite-tokens"))
            let body = String(data: request.httpBody ?? Data(), encoding: .utf8) ?? ""
            XCTAssertTrue(body.contains("new@user.com"))
            XCTAssertTrue(body.contains("48"))
            let json = #"{"id":"t2","token":"new-tok","email":"new@user.com","expires_at":null,"used_at":null,"used":false}"#
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, json.data(using: .utf8)!)
        }
        let token = try await adminAPI.createInviteToken(email: "new@user.com", expiresInHours: 48)
        XCTAssertEqual("t2", token.id)
        XCTAssertEqual("new-tok", token.token)
    }

    func testCreateInviteTokenWithoutEmail() async throws {
        MockURLProtocol.requestHandler = { request in
            let body = String(data: request.httpBody ?? Data(), encoding: .utf8) ?? ""
            // email should be null or absent
            XCTAssertFalse(body.contains("\"email\":\""))
            let json = #"{"id":"t3","token":"anon-tok","email":null,"expires_at":null,"used_at":null,"used":false}"#
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, json.data(using: .utf8)!)
        }
        let token = try await adminAPI.createInviteToken(email: nil, expiresInHours: 24)
        XCTAssertNil(token.email)
    }

    func testDeleteInviteTokenSendsDELETE() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.httpMethod, "DELETE")
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/admin/invite-tokens/tok-id-999"))
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, Data())
        }
        try await adminAPI.deleteInviteToken(id: "tok-id-999")
    }

    // MARK: - Online Count

    func testGetOnlineCountReturnsCount() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/admin/online-count"))
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, #"{"count":7}"#.data(using: .utf8)!)
        }
        let count = try await adminAPI.getOnlineCount()
        XCTAssertEqual(7, count)
    }

    func testGetOnlineCountReturnsZero() async throws {
        MockURLProtocol.requestHandler = { request in
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, #"{"count":0}"#.data(using: .utf8)!)
        }
        let count = try await adminAPI.getOnlineCount()
        XCTAssertEqual(0, count)
    }

    // MARK: - Auth Header

    func testAllRequestsIncludeAuthorizationHeader() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertNotNil(request.value(forHTTPHeaderField: "Authorization"))
            XCTAssertTrue(request.value(forHTTPHeaderField: "Authorization")!.hasPrefix("Bearer "))
            let res = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (res, "[]".data(using: .utf8)!)
        }
        _ = try await adminAPI.listUsers()
    }
}
