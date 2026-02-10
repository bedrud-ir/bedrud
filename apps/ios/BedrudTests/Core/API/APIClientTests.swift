import XCTest
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

    // MARK: - Encoder Snake Case

    func testEncoderSnakeCaseKeys() async throws {
        struct CamelBody: Encodable {
            let firstName: String
        }

        MockURLProtocol.requestHandler = { request in
            let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: Any]
            XCTAssertNotNil(body["first_name"], "Encoder should convert to snake_case")
            XCTAssertNil(body["firstName"], "CamelCase key should not be present")

            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, #"{"status":"ok"}"#.data(using: .utf8)!)
        }

        let _: HealthResponse = try await client.fetch("/test", method: "POST", body: CamelBody(firstName: "Alice"))
    }
}
