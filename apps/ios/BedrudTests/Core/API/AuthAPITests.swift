import XCTest
@testable import Bedrud

final class AuthAPITests: XCTestCase {
    private var session: URLSession!
    private var client: APIClient!
    private var authAPI: AuthAPI!

    override func setUp() {
        super.setUp()
        session = URLSession.mock()
        client = APIClient(baseURL: "https://test.com/api", session: session)
        authAPI = AuthAPI(client: client)
    }

    override func tearDown() {
        MockURLProtocol.requestHandler = nil
        session = nil
        client = nil
        authAPI = nil
        super.tearDown()
    }

    // MARK: - login

    func testLoginSendsCorrectEndpointAndBody() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/auth/login"))
            XCTAssertEqual(request.httpMethod, "POST")

            let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: Any]
            XCTAssertEqual(body["email"] as? String, "a@b.com")
            XCTAssertEqual(body["password"] as? String, "secret")

            let responseJSON = """
            {
                "tokens": {"access_token": "at", "refresh_token": "rt"},
                "user": {"id": "u1", "email": "a@b.com", "name": "Alice", "avatar_url": null, "is_admin": false}
            }
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let result = try await authAPI.login(email: "a@b.com", password: "secret")
        XCTAssertEqual(result.tokens.accessToken, "at")
        XCTAssertEqual(result.user.id, "u1")
    }

    // MARK: - register

    func testRegisterSendsCorrectEndpointAndBody() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/auth/register"))
            XCTAssertEqual(request.httpMethod, "POST")

            let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: Any]
            XCTAssertEqual(body["email"] as? String, "a@b.com")
            XCTAssertEqual(body["password"] as? String, "pass")
            XCTAssertEqual(body["name"] as? String, "Alice")

            let responseJSON = #"{"access_token": "at", "refresh_token": "rt"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let result = try await authAPI.register(email: "a@b.com", password: "pass", name: "Alice")
        XCTAssertEqual(result.accessToken, "at")
        XCTAssertEqual(result.refreshToken, "rt")
    }

    // MARK: - guestLogin

    func testGuestLoginSendsCorrectEndpointAndBody() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/auth/guest-login"))
            XCTAssertEqual(request.httpMethod, "POST")

            let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: Any]
            XCTAssertEqual(body["name"] as? String, "Guest")

            let responseJSON = """
            {
                "tokens": {"access_token": "gt", "refresh_token": "gr"},
                "user": {"id": "g1", "email": "", "name": "Guest", "avatar_url": null, "is_admin": false}
            }
            """
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let result = try await authAPI.guestLogin(name: "Guest")
        XCTAssertEqual(result.tokens.accessToken, "gt")
        XCTAssertEqual(result.user.name, "Guest")
    }

    // MARK: - refreshToken

    func testRefreshTokenSendsCorrectBody() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/auth/refresh"))
            XCTAssertEqual(request.httpMethod, "POST")

            let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: Any]
            // RefreshTokenRequest uses custom CodingKeys with snake_case
            // But encoder also converts to snake_case, so the key should be "refresh_token"
            XCTAssertEqual(body["refresh_token"] as? String, "old-refresh")

            let responseJSON = #"{"access_token": "new-at", "refresh_token": "new-rt"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, responseJSON.data(using: .utf8)!)
        }

        let result = try await authAPI.refreshToken(refreshToken: "old-refresh")
        XCTAssertEqual(result.accessToken, "new-at")
        XCTAssertEqual(result.refreshToken, "new-rt")
    }

    // MARK: - Login Error

    func testLoginReturnsErrorOnFailure() async {
        MockURLProtocol.requestHandler = { request in
            let errorJSON = #"{"error":"Invalid credentials"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!
            return (response, errorJSON.data(using: .utf8)!)
        }

        do {
            _ = try await authAPI.login(email: "a@b.com", password: "wrong")
            XCTFail("Should throw")
        } catch {
            // Expected
        }
    }
}
