import XCTest
@testable import Bedrud

final class RoomTests: XCTestCase {

    // MARK: - RoomSettings

    func testRoomSettingsDefaultValues() {
        let settings = RoomSettings.default
        XCTAssertTrue(settings.allowChat)
        XCTAssertTrue(settings.allowVideo)
        XCTAssertTrue(settings.allowAudio)
        XCTAssertFalse(settings.requireApproval)
        XCTAssertFalse(settings.e2ee)
    }

    func testRoomSettingsCodable() throws {
        let settings = RoomSettings(allowChat: false, allowVideo: true, allowAudio: false, requireApproval: true, e2ee: true)
        let data = try JSONEncoder().encode(settings)
        let decoded = try JSONDecoder().decode(RoomSettings.self, from: data)
        XCTAssertEqual(decoded, settings)
    }

    // MARK: - Room Equality (id-based)

    func testRoomEqualitySameId() {
        let settings = RoomSettings.default
        let a = Room(id: "r1", name: "Room A", createdBy: "u1", adminId: "u1", isActive: true, isPublic: true, maxParticipants: 10, expiresAt: "2025-01-01", settings: settings, relationship: nil, mode: "meeting", participants: nil)
        let b = Room(id: "r1", name: "Room B", createdBy: "u2", adminId: "u2", isActive: false, isPublic: false, maxParticipants: 5, expiresAt: "2026-01-01", settings: settings, relationship: "admin", mode: "webinar", participants: nil)
        XCTAssertEqual(a, b, "Room equality is id-based")
    }

    func testRoomEqualityDifferentId() {
        let settings = RoomSettings.default
        let a = Room(id: "r1", name: "Room", createdBy: "u1", adminId: "u1", isActive: true, isPublic: true, maxParticipants: 10, expiresAt: "", settings: settings, relationship: nil, mode: "meeting", participants: nil)
        let b = Room(id: "r2", name: "Room", createdBy: "u1", adminId: "u1", isActive: true, isPublic: true, maxParticipants: 10, expiresAt: "", settings: settings, relationship: nil, mode: "meeting", participants: nil)
        XCTAssertNotEqual(a, b)
    }

    // MARK: - RoomParticipant Codable

    func testRoomParticipantCodable() throws {
        let json = """
        {
            "id": "p1",
            "userId": "u1",
            "email": "a@b.com",
            "name": "Alice",
            "joinedAt": "2024-01-01T00:00:00Z",
            "isActive": true,
            "isMuted": false,
            "isVideoOff": false,
            "isChatBlocked": false,
            "permissions": "all"
        }
        """
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let participant = try decoder.decode(RoomParticipant.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(participant.id, "p1")
        XCTAssertEqual(participant.userId, "u1")
        XCTAssertEqual(participant.name, "Alice")
        XCTAssertTrue(participant.isActive)
        XCTAssertFalse(participant.isMuted)
    }

    // MARK: - JoinRoomResponse

    func testJoinRoomResponseDecodable() throws {
        let json = """
        {
            "id": "r1",
            "name": "Test Room",
            "token": "lk-token-123",
            "livekit_host": "wss://lk.example.com",
            "created_by": "u1",
            "admin_id": "u1",
            "is_active": true,
            "is_public": false,
            "max_participants": 10,
            "expires_at": "2025-12-31T23:59:59Z",
            "settings": {
                "allow_chat": true,
                "allow_video": true,
                "allow_audio": true,
                "require_approval": false,
                "e2ee": false
            },
            "mode": "meeting"
        }
        """
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(JoinRoomResponse.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(response.id, "r1")
        XCTAssertEqual(response.token, "lk-token-123")
        XCTAssertEqual(response.livekitHost, "wss://lk.example.com")
        XCTAssertTrue(response.settings.allowChat)
    }

    // MARK: - UserRoomResponse

    func testUserRoomResponseDecodable() throws {
        let json = """
        {
            "id": "r1",
            "name": "My Room",
            "created_by": "u1",
            "is_active": true,
            "max_participants": 50,
            "expires_at": "2025-06-01",
            "settings": {
                "allow_chat": true,
                "allow_video": false,
                "allow_audio": true,
                "require_approval": true,
                "e2ee": true
            },
            "relationship": "admin",
            "mode": "webinar"
        }
        """
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(UserRoomResponse.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(response.id, "r1")
        XCTAssertEqual(response.name, "My Room")
        XCTAssertEqual(response.relationship, "admin")
        XCTAssertEqual(response.mode, "webinar")
        XCTAssertTrue(response.settings.requireApproval)
        XCTAssertTrue(response.settings.e2ee)
    }

    // MARK: - CreateRoomRequest Encodable

    func testCreateRoomRequestEncodable() throws {
        let request = CreateRoomRequest(name: "Room", maxParticipants: 10, isPublic: true, mode: "meeting", settings: .default)
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        XCTAssertEqual(json["name"] as? String, "Room")
        XCTAssertEqual(json["max_participants"] as? Int, 10)
        XCTAssertEqual(json["is_public"] as? Bool, true)
    }

    // MARK: - JoinRoomRequest Encodable

    func testJoinRoomRequestEncodable() throws {
        let request = JoinRoomRequest(roomName: "my-room")
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        XCTAssertEqual(json["room_name"] as? String, "my-room")
    }
}
