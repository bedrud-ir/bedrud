import XCTest
import KeychainAccess
@testable import Bedrud

final class APIClientTests: XCTestCase {
    private var session: URLSession!
    private var client: APIClient!

    override func setUp() {
        super.setUp()
        session = URLSession.mock()
        client = APIClient(baseURL: "https://test.com/api", session: session)
    }

    override func tearDown() {
        MockURLProtocol.requestHandler = nil
        session = nil
        client = nil
        super.tearDown()
    }

    // MARK: - fetch success

    func testFetchSuccessWithValidJSON() async throws {
        let json = #"{"status":"ok","version":"1.0"}"#

        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.url?.absoluteString, "https://test.com/api/health")
            XCTAssertEqual(request.httpMethod, "GET")
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, json.data(using: .utf8)!)
        }

        let result: HealthResponse = try await client.fetch("/health")
        XCTAssertEqual(result.status, "ok")
        XCTAssertEqual(result.version, "1.0")
    }

    // MARK: - fetch HTTP errors

    func testFetchHTTPError400() async throws {
        MockURLProtocol.requestHandler = { request in
            let errorJSON = #"{"error":"Bad request"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 400, httpVersion: nil, headerFields: nil)!
            return (response, errorJSON.data(using: .utf8)!)
        }

        do {
            let _: HealthResponse = try await client.fetch("/test")
            XCTFail("Should throw")
        } catch let error as APIError {
            if case .httpError(let code, let message) = error {
                XCTAssertEqual(code, 400)
                XCTAssertEqual(message, "Bad request")
            } else {
                XCTFail("Expected httpError, got \(error)")
            }
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    func testFetchHTTPError500() async throws {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        do {
            let _: HealthResponse = try await client.fetch("/test")
            XCTFail("Should throw")
        } catch let error as APIError {
            if case .httpError(let code, _) = error {
                XCTAssertEqual(code, 500)
            } else {
                XCTFail("Expected httpError, got \(error)")
            }
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    // MARK: - fetch 401 returns unauthorized

    func testFetch401ReturnsUnauthorized() async throws {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        do {
            let _: HealthResponse = try await client.fetch("/test")
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

    // MARK: - fetch network error

    func testFetchNetworkError() async throws {
        MockURLProtocol.requestHandler = { _ in
            throw URLError(.notConnectedToInternet)
        }

        do {
            let _: HealthResponse = try await client.fetch("/test")
            XCTFail("Should throw")
        } catch let error as APIError {
            if case .networkError = error {
                // Expected
            } else {
                XCTFail("Expected networkError, got \(error)")
            }
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    // MARK: - fetch decoding error

    func testFetchDecodingError() async throws {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, "not json".data(using: .utf8)!)
        }

        do {
            let _: HealthResponse = try await client.fetch("/test")
            XCTFail("Should throw")
        } catch let error as APIError {
            if case .decodingError = error {
                // Expected
            } else {
                XCTFail("Expected decodingError, got \(error)")
            }
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    // MARK: - Request Building

    func testRequestBuildingPOSTWithBody() async throws {
        struct TestBody: Encodable {
            let name: String
            let count: Int
        }

        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")

            let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: Any]
            XCTAssertEqual(body["name"] as? String, "test")
            XCTAssertEqual(body["count"] as? Int, 42)

            let json = #"{"status":"ok"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, json.data(using: .utf8)!)
        }

        let _: HealthResponse = try await client.fetch("/test", method: "POST", body: TestBody(name: "test", count: 42))
    }

    // MARK: - Snake Case Key Strategy

    func testSnakeCaseKeyStrategy() async throws {
        struct SnakeTest: Decodable {
            let firstName: String
            let lastName: String
        }

        let json = #"{"first_name":"Alice","last_name":"Smith"}"#

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, json.data(using: .utf8)!)
        }

        let result: SnakeTest = try await client.fetch("/test")
        XCTAssertEqual(result.firstName, "Alice")
        XCTAssertEqual(result.lastName, "Smith")
    }

    // MARK: - Invalid URL

    func testFetchInvalidURLThrows() async throws {
        // Use a base URL with spaces/newlines that make URL(string:) return nil
        let badClient = APIClient(baseURL: "ht tp://bad host\n", session: session)
        do {
            let _: HealthResponse = try await badClient.fetch(" invalid path")
            XCTFail("Should throw")
        } catch let error as APIError {
            // May throw invalidURL or networkError depending on URL construction
            switch error {
            case .invalidURL, .networkError:
                break // Either is acceptable for a malformed URL
            default:
                XCTFail("Expected invalidURL or networkError, got \(error)")
            }
        }
    }

    // MARK: - HTTP Error Without JSON Body

    func testFetchHTTPErrorWithoutJSONBody() async throws {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 403, httpVersion: nil, headerFields: nil)!
            return (response, "plain text error".data(using: .utf8)!)
        }

        do {
            let _: HealthResponse = try await client.fetch("/test")
            XCTFail("Should throw")
        } catch let error as APIError {
            if case .httpError(let code, let message) = error {
                XCTAssertEqual(code, 403)
                XCTAssertTrue(message.contains("HTTP error"))
            } else {
                XCTFail("Expected httpError, got \(error)")
            }
        }
    }

    // MARK: - GET Request Has No Body

    func testGETRequestHasNoBody() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.httpMethod, "GET")
            XCTAssertNil(request.httpBody)
            XCTAssertNil(request.value(forHTTPHeaderField: "Content-Type"))

            let json = #"{"status":"ok"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, json.data(using: .utf8)!)
        }

        let _: HealthResponse = try await client.fetch("/test")
    }

    // MARK: - PUT and DELETE Methods

    func testPUTMethod() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.httpMethod, "PUT")
            let json = #"{"status":"ok"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, json.data(using: .utf8)!)
        }

        let _: HealthResponse = try await client.fetch("/test", method: "PUT")
    }

    func testDELETEMethod() async throws {
        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.httpMethod, "DELETE")
            let json = #"{"status":"ok"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, json.data(using: .utf8)!)
        }

        let _: HealthResponse = try await client.fetch("/test", method: "DELETE")
    }

    // MARK: - authFetch with Token

    func testAuthFetchSendsBearerToken() async throws {
        let keychain = Keychain(service: "org.bedrud.tests.apiclient.\(UUID().uuidString)")
        defer { try? keychain.removeAll() }

        let mockSession = URLSession.mock()
        let authClient = APIClient(baseURL: "https://test.com/api", session: mockSession)
        let authAPI = AuthAPI(client: authClient)
        let authManager = await MainActor.run {
            AuthManager(instanceId: "test", authAPI: authAPI, keychain: keychain)
        }

        // Create a valid JWT token
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
            let authHeader = request.value(forHTTPHeaderField: "Authorization")
            XCTAssertNotNil(authHeader)
            XCTAssertTrue(authHeader!.hasPrefix("Bearer "))

            let json = #"{"status":"ok"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, json.data(using: .utf8)!)
        }

        let _: HealthResponse = try await authClient.authFetch("/test", authManager: authManager)
    }

    // MARK: - Encoder Snake Case

    func testEncoderKeepsPropertyNames() async throws {
        struct CamelBody: Encodable {
            let firstName: String
        }

        MockURLProtocol.requestHandler = { request in
            let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: Any]
            // APIClient encoder does NOT use convertToSnakeCase — keys stay camelCase
            XCTAssertNotNil(body["firstName"], "Encoder should keep camelCase keys")
            XCTAssertEqual(body["firstName"] as? String, "Alice")

            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, #"{"status":"ok"}"#.data(using: .utf8)!)
        }

        let _: HealthResponse = try await client.fetch("/test", method: "POST", body: CamelBody(firstName: "Alice"))
    }
}
