import XCTest
@testable import Bedrud

final class PasskeyTypesTests: XCTestCase {

    // MARK: - PasskeyBeginResponse

    func testPasskeyBeginResponseDecoding() throws {
        let json = """
        {
            "challenge": "dGVzdC1jaGFsbGVuZ2U",
            "rp_id": "bedrud.com",
            "rp": {"id": "bedrud.com", "name": "Bedrud"},
            "user": {"id": "dXNlci0x", "name": "alice", "display_name": "Alice Smith"}
        }
        """
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(PasskeyBeginResponse.self, from: json.data(using: .utf8)!)

        XCTAssertEqual(response.challenge, "dGVzdC1jaGFsbGVuZ2U")
        XCTAssertEqual(response.rpId, "bedrud.com")
        XCTAssertEqual(response.rp?.id, "bedrud.com")
        XCTAssertEqual(response.rp?.name, "Bedrud")
        XCTAssertEqual(response.user?.id, "dXNlci0x")
        XCTAssertEqual(response.user?.name, "alice")
        XCTAssertEqual(response.user?.displayName, "Alice Smith")
    }

    func testPasskeyBeginResponseWithMinimalFields() throws {
        let json = #"{"challenge": "abc123"}"#
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(PasskeyBeginResponse.self, from: json.data(using: .utf8)!)

        XCTAssertEqual(response.challenge, "abc123")
        XCTAssertNil(response.rpId)
        XCTAssertNil(response.rp)
        XCTAssertNil(response.user)
    }

    // MARK: - PasskeyRP

    func testPasskeyRPDecoding() throws {
        let json = #"{"id": "example.com", "name": "Example"}"#
        let rp = try JSONDecoder().decode(PasskeyRP.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(rp.id, "example.com")
        XCTAssertEqual(rp.name, "Example")
    }

    // MARK: - PasskeyUser

    func testPasskeyUserDecoding() throws {
        let json = """
        {"id": "base64userid", "name": "alice", "display_name": "Alice Smith"}
        """
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let user = try decoder.decode(PasskeyUser.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(user.id, "base64userid")
        XCTAssertEqual(user.name, "alice")
        XCTAssertEqual(user.displayName, "Alice Smith")
    }

    // MARK: - PasskeySignupBeginRequest

    func testPasskeySignupBeginRequestEncoding() throws {
        let request = PasskeySignupBeginRequest(email: "alice@example.com", name: "Alice")
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        XCTAssertEqual(json["email"] as? String, "alice@example.com")
        XCTAssertEqual(json["name"] as? String, "Alice")
    }

    // MARK: - LoginResponse

    func testLoginResponseDecoding() throws {
        let json = """
        {
            "tokens": {"access_token": "at-123", "refresh_token": "rt-456"},
            "user": {"id": "u1", "email": "a@b.com", "name": "Alice", "avatar_url": "https://img.com/a.png", "is_admin": true}
        }
        """
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(LoginResponse.self, from: json.data(using: .utf8)!)

        XCTAssertEqual(response.tokens.accessToken, "at-123")
        XCTAssertEqual(response.tokens.refreshToken, "rt-456")
        XCTAssertEqual(response.user.id, "u1")
        XCTAssertEqual(response.user.email, "a@b.com")
        XCTAssertEqual(response.user.name, "Alice")
        XCTAssertEqual(response.user.avatarUrl, "https://img.com/a.png")
        XCTAssertEqual(response.user.isAdmin, true)
    }

    func testLoginResponseWithNullOptionals() throws {
        let json = """
        {
            "tokens": {"access_token": "at", "refresh_token": "rt"},
            "user": {"id": "u1", "email": "a@b.com", "name": "Alice", "avatar_url": null, "is_admin": null}
        }
        """
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(LoginResponse.self, from: json.data(using: .utf8)!)

        XCTAssertNil(response.user.avatarUrl)
        XCTAssertNil(response.user.isAdmin)
    }

    // MARK: - UserResponse

    func testUserResponseDecoding() throws {
        let json = #"{"id":"u1","email":"a@b.com","name":"Alice","avatar_url":"url","is_admin":false}"#
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let user = try decoder.decode(UserResponse.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(user.id, "u1")
        XCTAssertEqual(user.avatarUrl, "url")
        XCTAssertEqual(user.isAdmin, false)
    }

    // MARK: - RefreshTokenRequest Encoding

    func testRefreshTokenRequestEncodesWithSnakeCase() throws {
        let request = RefreshTokenRequest(refreshToken: "my-refresh-token")
        let data = try JSONEncoder().encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        // RefreshTokenRequest has custom CodingKeys with "refresh_token"
        XCTAssertEqual(json["refresh_token"] as? String, "my-refresh-token")
        XCTAssertNil(json["refreshToken"], "Should use custom coding key")
    }
}
