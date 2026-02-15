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

    func testFetchInvalidURLThrows() async {
        // Use a base URL with spaces/newlines that make URL(string:) return nil
        let badClient = APIClient(baseURL: "ht tp://bad host\n", session: session)
        do {
            let _: HealthResponse = try await badClient.fetch(" invalid path")
            XCTFail("Should throw")
        } catch {
            // May throw invalidURL or networkError depending on URL construction
            // Handle all possible errors to avoid exhaustiveness warnings
            if error is APIError.invalidURL || error is APIError.networkError {
                // Acceptable for a malformed URL
            } else {
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

    // MARK: - Error Scenario Tests

    func testFetchTimeout() async {
        MockURLProtocol.requestHandler = { _ in
            throw URLError(.timedOut)
        }

        do {
            let _: HealthResponse = try await client.fetch("/test")
            XCTFail("Should throw")
        } catch {
            if let apiError = error as? APIError {
                if case .networkError = apiError {
                    // Expected
                } else {
                    XCTFail("Expected networkError, got \(error)")
                }
            }
        }
    }

    func testFetchEmptyResponse() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        do {
            let _: HealthResponse = try await client.fetch("/test")
            XCTFail("Should throw on empty JSON")
        } catch {
            if let apiError = error as? APIError {
                if case .decodingError = apiError {
                    // Expected - empty data cannot be decoded
                } else {
                    XCTFail("Expected decodingError, got \(error)")
                }
            }
        }
    }

    func testFetchLargeResponse() async throws {
        // Create a large JSON response
        var largeArray: [String] = []
        for i in 0..<1000 {
            largeArray.append("item_\(i)")
        }
        let largeJSON = try JSONEncoder().encode(largeArray)

        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, largeJSON)
        }

        let result: [String] = try await client.fetch("/test")
        XCTAssertEqual(result.count, 1000)
        XCTAssertEqual(result[0], "item_0")
        XCTAssertEqual(result[999], "item_999")
    }

    func testFetchMalformedJSON() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            // Invalid JSON: missing closing brace
            return (response, #"{"status":"ok","incomplete"#.data(using: .utf8)!)
        }

        do {
            let _: HealthResponse = try await client.fetch("/test")
            XCTFail("Should throw")
        } catch {
            if let apiError = error as? APIError {
                if case .decodingError = apiError {
                    // Expected
                } else {
                    XCTFail("Expected decodingError, got \(error)")
                }
            }
        }
    }

    func testAuthFetchRetriesOn401() async {
        let keychain = Keychain(service: "org.bedrud.tests.apiclient.\(UUID().uuidString)")
        defer { try? keychain.removeAll() }

        let mockSession = URLSession.mock()
        let authClient = APIClient(baseURL: "https://test.com/api", session: mockSession)
        let authAPI = AuthAPI(client: authClient)
        let authManager = await MainActor.run {
            AuthManager(instanceId: "test", authAPI: authAPI, keychain: keychain)
        }

        // Setup: initial valid token
        let initialToken = fakeJWT(exp: Date().timeIntervalSince1970 + 3600)
        let newToken = fakeJWT(exp: Date().timeIntervalSince1970 + 3600)

        keychain["test_access_token"] = initialToken
        keychain["test_refresh_token"] = "refresh"

        var callCount = 0

        MockURLProtocol.requestHandler = { request in
            callCount += 1

            if callCount == 1 {
                // First call returns 401 - token expired
                let response = HTTPURLResponse(url: request.url!, statusCode: 401, httpVersion: nil, headerFields: nil)!
                return (response, Data())
            } else if callCount == 2 {
                // Refresh call
                if request.url!.absoluteString.contains("/auth/refresh") {
                    let responseJSON = #"{"access_token": "\#(newToken)", "refresh_token": "new-refresh"}"#
                    let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                    return (response, responseJSON.data(using: .utf8)!)
                }
                XCTFail("Unexpected request: \(request.url!)")
            } else if callCount == 3 {
                // Second call after retry should succeed
                let json = #"{"status":"ok"}"#
                let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
                return (response, json.data(using: .utf8)!)
            }

            XCTFail("Too many calls")
            let response = HTTPURLResponse(url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        // Manually login to set up auth state
        await MainActor.run {
            let user = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil)
            let tokens = AuthTokens(accessToken: initialToken, refreshToken: "refresh")
            authManager.loginWithTokens(tokens: tokens, user: user)
        }

        // authFetch should retry after 401
        let result: HealthResponse = try await authClient.authFetch("/test", authManager: authManager)

        XCTAssertEqual(result.status, "ok")
        XCTAssertEqual(callCount, 3) // Initial (401) + Refresh + Retry (success)
    }

    func testAuthFetchDoesNotRetryOnNon401() async {
        let keychain = Keychain(service: "org.bedrud.tests.apiclient.\(UUID().uuidString)")
        defer { try? keychain.removeAll() }

        let mockSession = URLSession.mock()
        let authClient = APIClient(baseURL: "https://test.com/api", session: mockSession)
        let authAPI = AuthAPI(client: authClient)
        let authManager = await MainActor.run {
            AuthManager(instanceId: "test", authAPI: authAPI, keychain: keychain)
        }

        let token = fakeJWT(exp: Date().timeIntervalSince1970 + 3600)
        keychain["test_access_token"] = token
        keychain["test_refresh_token"] = "refresh"

        var callCount = 0

        MockURLProtocol.requestHandler = { request in
            callCount += 1
            // First call returns 403 - not 401, should not retry
            let response = HTTPURLResponse(url: request.url!, statusCode: 403, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        // Manually login to set up auth state
        await MainActor.run {
            let user = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil)
            let tokens = AuthTokens(accessToken: token, refreshToken: "refresh")
            authManager.loginWithTokens(tokens: tokens, user: user)
        }

        do {
            let _: HealthResponse = try await authClient.authFetch("/test", authManager: authManager)
            XCTFail("Should throw 403")
        } catch {
            if let apiError = error as? APIError {
                if case .httpError(let code, _) = apiError {
                    XCTAssertEqual(code, 403)
                } else {
                    XCTFail("Expected httpError, got \(error)")
                }
            }
        }

        XCTAssertEqual(callCount, 1) // Only one call, no retry
    }

    // MARK: - Helper for fakeJWT (reused from AuthManagerTests pattern)

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
}
