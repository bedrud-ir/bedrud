import XCTest
import KeychainAccess
@testable import Bedrud

@MainActor
final class RoomAPITests: XCTestCase {
    private var session: URLSession!
    private var client: APIClient!
    private var authManager: AuthManager!
    private var roomAPI: RoomAPI!
    private var keychain: Keychain!

    override func setUp() {
        super.setUp()
        let id = UUID().uuidString
        session = URLSession.mock()
        client = APIClient(baseURL: "https://test.com/api", session: session)
        keychain = Keychain(service: "com.bedrud.tests.roomapi.\(id)")

        let authAPI = AuthAPI(client: client)
        authManager = AuthManager(instanceId: "test", authAPI: authAPI, keychain: keychain)
        roomAPI = RoomAPI(client: client, authManager: authManager)
    }

    override func tearDown() {
        MockURLProtocol.requestHandler = nil
        try? keychain.removeAll()
        session = nil
        client = nil
        authManager = nil
        roomAPI = nil
        keychain = nil
        super.tearDown()
    }

    private func fakeJWT() -> String {
        let payload: [String: Any] = [
            "userId": "u1",
            "email": "a@b.com",
            "exp": Date().timeIntervalSince1970 + 3600,
            "iat": Date().timeIntervalSince1970
        ]
        let payloadData = try! JSONSerialization.data(withJSONObject: payload)
        let payloadBase64 = payloadData.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
        return "header.\(payloadBase64).signature"
    }

    private func authenticateManager() {
        let token = fakeJWT()
        let tokens = AuthTokens(accessToken: token, refreshToken: "refresh")
        let user = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil)
        authManager.loginWithTokens(tokens: tokens, user: user)
    }

    // MARK: - createRoom

    func testCreateRoomSendsCorrectRequest() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/room/create"))
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertTrue(request.value(forHTTPHeaderField: "Authorization")!.hasPrefix("Bearer "))

            let roomJSON = """
            {
                "id": "r1", "name": "Test", "created_by": "u1", "admin_id": "u1",
                "is_active": true, "is_public": false, "max_participants": 10,
                "expires_at": "2025-12-31", "settings": {"allow_chat": true, "allow_video": true, "allow_audio": true, "require_approval": false, "e2ee": false},
                "relationship": null, "mode": "meeting", "participants": null
            }
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, roomJSON.data(using: .utf8)!)
        }

        let room = try await roomAPI.createRoom(name: "Test", maxParticipants: 10)
        XCTAssertEqual(room.id, "r1")
        XCTAssertEqual(room.name, "Test")
    }

    // MARK: - listRooms

    func testListRoomsReturnsArray() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/room/list"))

            let listJSON = """
            [
                {"id": "r1", "name": "Room 1", "created_by": "u1", "is_active": true, "max_participants": 10, "expires_at": "2025-12-31", "settings": {"allow_chat": true, "allow_video": true, "allow_audio": true, "require_approval": false, "e2ee": false}, "relationship": null, "mode": "meeting"},
                {"id": "r2", "name": "Room 2", "created_by": "u1", "is_active": false, "max_participants": 5, "expires_at": "2025-06-30", "settings": {"allow_chat": false, "allow_video": true, "allow_audio": true, "require_approval": true, "e2ee": true}, "relationship": "admin", "mode": "webinar"}
            ]
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, listJSON.data(using: .utf8)!)
        }

        let rooms = try await roomAPI.listRooms()
        XCTAssertEqual(rooms.count, 2)
        XCTAssertEqual(rooms[0].name, "Room 1")
        XCTAssertEqual(rooms[1].name, "Room 2")
    }

    // MARK: - joinRoom

    func testJoinRoomReturnsDetailedResponse() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/room/join"))
            XCTAssertEqual(request.httpMethod, "POST")

            let joinJSON = """
            {
                "id": "r1", "name": "Room", "token": "lk-token", "livekit_host": "wss://lk.test.com",
                "created_by": "u1", "admin_id": "u1", "is_active": true, "is_public": false,
                "max_participants": 10, "expires_at": "2025-12-31",
                "settings": {"allow_chat": true, "allow_video": true, "allow_audio": true, "require_approval": false, "e2ee": false},
                "mode": "meeting"
            }
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, joinJSON.data(using: .utf8)!)
        }

        let result = try await roomAPI.joinRoom(roomName: "my-room")
        XCTAssertEqual(result.token, "lk-token")
        XCTAssertEqual(result.livekitHost, "wss://lk.test.com")
    }

    // MARK: - kickParticipant

    func testKickParticipantSendsCorrectEndpoint() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/room/r1/kick/user1"))
            XCTAssertEqual(request.httpMethod, "POST")
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        try await roomAPI.kickParticipant(roomId: "r1", identity: "user1")
    }

    // MARK: - muteParticipant

    func testMuteParticipantSendsCorrectEndpoint() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/room/r1/mute/user1"))
            XCTAssertEqual(request.httpMethod, "POST")
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        try await roomAPI.muteParticipant(roomId: "r1", identity: "user1")
    }

    // MARK: - updateRoomSettings

    func testUpdateRoomSettingsSendsPUT() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/room/r1/settings"))
            XCTAssertEqual(request.httpMethod, "PUT")
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        try await roomAPI.updateRoomSettings(roomId: "r1", settings: .default)
    }

    // MARK: - deleteRoom

    func testDeleteRoomSendsCorrectEndpoint() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/room/r1"))
            XCTAssertEqual(request.httpMethod, "DELETE")
            XCTAssertNotNil(request.value(forHTTPHeaderField: "Authorization"))
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        try await roomAPI.deleteRoom(roomId: "r1")
    }

    // MARK: - disableParticipantVideo

    func testDisableParticipantVideoSendsCorrectEndpoint() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/room/r1/video/user1/off"))
            XCTAssertEqual(request.httpMethod, "POST")
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        try await roomAPI.disableParticipantVideo(roomId: "r1", identity: "user1")
    }

    // MARK: - bringToStage

    func testBringToStageSendsCorrectEndpoint() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/room/r1/stage/user1/bring"))
            XCTAssertEqual(request.httpMethod, "POST")
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        try await roomAPI.bringToStage(roomId: "r1", identity: "user1")
    }

    // MARK: - removeFromStage

    func testRemoveFromStageSendsCorrectEndpoint() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/room/r1/stage/user1/remove"))
            XCTAssertEqual(request.httpMethod, "POST")
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        try await roomAPI.removeFromStage(roomId: "r1", identity: "user1")
    }

    // MARK: - createRoom with All Parameters

    func testCreateRoomWithAllParameters() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: Any]
            XCTAssertEqual(body["name"] as? String, "Full Room")
            // APIClient encoder uses camelCase (no convertToSnakeCase strategy)
            XCTAssertEqual(body["maxParticipants"] as? Int, 50)
            XCTAssertEqual(body["isPublic"] as? Bool, true)
            XCTAssertEqual(body["mode"] as? String, "webinar")
            XCTAssertNotNil(body["settings"])

            let roomJSON = """
            {"id": "r1", "name": "Full Room", "created_by": "u1", "admin_id": "u1", "is_active": true, "is_public": true, "max_participants": 50, "expires_at": "2025-12-31", "settings": {"allow_chat": false, "allow_video": true, "allow_audio": true, "require_approval": true, "e2ee": true}, "relationship": null, "mode": "webinar", "participants": null}
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, roomJSON.data(using: .utf8)!)
        }

        let settings = RoomSettings(allowChat: false, allowVideo: true, allowAudio: true, requireApproval: true, e2ee: true)
        let room = try await roomAPI.createRoom(name: "Full Room", maxParticipants: 50, isPublic: true, mode: "webinar", settings: settings)
        XCTAssertEqual(room.name, "Full Room")
    }

    // MARK: - joinRoom Sends Correct Body

    func testJoinRoomSendsCorrectBody() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: Any]
            // APIClient encoder uses camelCase (no convertToSnakeCase strategy)
            XCTAssertEqual(body["roomName"] as? String, "specific-room")

            let joinJSON = """
            {"id": "r1", "name": "specific-room", "token": "lk-token", "livekit_host": "wss://lk.test.com", "created_by": "u1", "admin_id": "u1", "is_active": true, "is_public": false, "max_participants": 10, "expires_at": "2025-12-31", "settings": {"allow_chat": true, "allow_video": true, "allow_audio": true, "require_approval": false, "e2ee": false}, "mode": "meeting"}
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, joinJSON.data(using: .utf8)!)
        }

        let result = try await roomAPI.joinRoom(roomName: "specific-room")
        XCTAssertEqual(result.name, "specific-room")
    }

    // MARK: - listRooms Empty

    func testListRoomsEmptyArray() async throws {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, "[]".data(using: .utf8)!)
        }

        let rooms = try await roomAPI.listRooms()
        XCTAssertTrue(rooms.isEmpty)
    }

    // MARK: - API Error Propagation

    func testCreateRoomServerError() async {
        authenticateManager()

        MockURLProtocol.requestHandler = { request in
            let errorJSON = #"{"error":"Room limit reached"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 403, httpVersion: nil, headerFields: nil)!
            return (response, errorJSON.data(using: .utf8)!)
        }

        do {
            _ = try await roomAPI.createRoom(name: "Test")
            XCTFail("Should throw")
        } catch let error as APIError {
            if case .httpError(let code, let message) = error {
                XCTAssertEqual(code, 403)
                XCTAssertEqual(message, "Room limit reached")
            } else {
                XCTFail("Expected httpError, got \(error)")
            }
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    // MARK: - Unauthorized

    func testCreateRoomUnauthorized() async {
        // No tokens set - should throw unauthorized
        do {
            _ = try await roomAPI.createRoom(name: "Test")
            XCTFail("Should throw")
        } catch let error as APIError {
            if case .unauthorized = error {
                // Expected
            } else {
                XCTFail("Expected unauthorized, got \(error)")
            }
        } catch {
            XCTFail("Unexpected error type: \(error)")
        }
    }
}
