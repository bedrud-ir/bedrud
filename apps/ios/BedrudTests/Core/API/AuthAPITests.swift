import XCTest
import KeychainAccess
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

    // MARK: - getMe

    func testGetMeSendsAuthenticatedRequest() async throws {
        let keychain = Keychain(service: "com.bedrud.tests.authapi.me.\(UUID().uuidString)")
        defer { try? keychain.removeAll() }

        let authAPI2 = AuthAPI(client: client)
        let authManager = await MainActor.run {
            AuthManager(instanceId: "test-me", authAPI: authAPI2, keychain: keychain)
        }

        // Create a valid JWT and set up auth
        let payload: [String: Any] = [
            "userId": "u1", "email": "a@b.com",
            "exp": Date().timeIntervalSince1970 + 3600,
            "iat": Date().timeIntervalSince1970
        ]
        let payloadData = try! JSONSerialization.data(withJSONObject: payload)
        let payloadBase64 = payloadData.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
        let token = "header.\(payloadBase64).signature"

        await MainActor.run {
            let tokens = AuthTokens(accessToken: token, refreshToken: "refresh")
            let user = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil)
            authManager.loginWithTokens(tokens: tokens, user: user)
        }

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.hasSuffix("/auth/me"))
            XCTAssertEqual(request.httpMethod, "GET")
            XCTAssertNotNil(request.value(forHTTPHeaderField: "Authorization"))

            let meJSON = #"{"id":"u1","email":"a@b.com","name":"Alice","avatar_url":"https://img.com/a.png","is_admin":true,"provider":"github"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, meJSON.data(using: .utf8)!)
        }

        let me = try await authAPI2.getMe(authManager: authManager)
        XCTAssertEqual(me.id, "u1")
        XCTAssertEqual(me.name, "Alice")
        XCTAssertEqual(me.avatarUrl, "https://img.com/a.png")
        XCTAssertEqual(me.isAdmin, true)
        XCTAssertEqual(me.provider, "github")
    }

    // MARK: - Response Type Decoding

    func testAuthTokensCodable() throws {
        let json = #"{"access_token":"at","refresh_token":"rt"}"#
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let tokens = try decoder.decode(AuthTokens.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(tokens.accessToken, "at")
        XCTAssertEqual(tokens.refreshToken, "rt")
    }

    func testAuthTokensEquatable() {
        let a = AuthTokens(accessToken: "a", refreshToken: "r")
        let b = AuthTokens(accessToken: "a", refreshToken: "r")
        let c = AuthTokens(accessToken: "different", refreshToken: "r")
        XCTAssertEqual(a, b)
        XCTAssertNotEqual(a, c)
    }

    func testRefreshTokenResponseDecoding() throws {
        let json = #"{"access_token":"new-at","refresh_token":"new-rt"}"#
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(RefreshTokenResponse.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(response.accessToken, "new-at")
        XCTAssertEqual(response.refreshToken, "new-rt")
    }

    func testMeResponseDecoding() throws {
        let json = #"{"id":"u1","email":"a@b.com","name":"Alice","avatar_url":"https://img.com/a.png","is_admin":true,"provider":"github"}"#
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(MeResponse.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(response.id, "u1")
        XCTAssertEqual(response.email, "a@b.com")
        XCTAssertEqual(response.name, "Alice")
        XCTAssertEqual(response.avatarUrl, "https://img.com/a.png")
        XCTAssertEqual(response.isAdmin, true)
        XCTAssertEqual(response.provider, "github")
    }

    func testMeResponseDecodingWithNils() throws {
        let json = #"{"id":"u1","email":"a@b.com","name":"Alice"}"#
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(MeResponse.self, from: json.data(using: .utf8)!)
        XCTAssertNil(response.avatarUrl)
        XCTAssertNil(response.isAdmin)
        XCTAssertNil(response.provider)
    }

    func testRegisterResponseDecoding() throws {
        let json = #"{"access_token":"at","refresh_token":"rt"}"#
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let response = try decoder.decode(RegisterResponse.self, from: json.data(using: .utf8)!)
        XCTAssertEqual(response.accessToken, "at")
        XCTAssertEqual(response.refreshToken, "rt")
    }

    // MARK: - Register Error

    func testRegisterReturnsErrorOnFailure() async {
        MockURLProtocol.requestHandler = { request in
            let errorJSON = #"{"error":"Email already in use"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 409, httpVersion: nil, headerFields: nil)!
            return (response, errorJSON.data(using: .utf8)!)
        }

        do {
            _ = try await authAPI.register(email: "a@b.com", password: "pass", name: "Alice")
            XCTFail("Should throw")
        } catch let error as APIError {
            if case .httpError(let code, let message) = error {
                XCTAssertEqual(code, 409)
                XCTAssertEqual(message, "Email already in use")
            } else {
                XCTFail("Expected httpError, got \(error)")
            }
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    // MARK: - Guest Login Error

    func testGuestLoginReturnsErrorOnFailure() async {
        MockURLProtocol.requestHandler = { request in
            let errorJSON = #"{"error":"Guest login disabled"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 403, httpVersion: nil, headerFields: nil)!
            return (response, errorJSON.data(using: .utf8)!)
        }

        do {
            _ = try await authAPI.guestLogin(name: "Guest")
            XCTFail("Should throw")
        } catch {
            // Expected
        }
    }

    // MARK: - Refresh Token Error

    func testRefreshTokenReturnsErrorOnInvalidToken() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        do {
            _ = try await authAPI.refreshToken(refreshToken: "expired-token")
            XCTFail("Should throw")
        } catch let error as APIError {
            if case .unauthorized = error {
                // Expected
            } else {
                XCTFail("Expected unauthorized, got \(error)")
            }
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
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
