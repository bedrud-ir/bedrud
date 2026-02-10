import XCTest
@testable import Bedrud

final class APIErrorTests: XCTestCase {

    func testInvalidURLDescription() {
        let error = APIError.invalidURL
        XCTAssertEqual(error.errorDescription, "Invalid URL")
    }

    func testUnauthorizedDescription() {
        let error = APIError.unauthorized
        XCTAssertEqual(error.errorDescription, "Unauthorized. Please log in again.")
    }

    func testHttpErrorDescription() {
        let error = APIError.httpError(statusCode: 404, message: "Not Found")
        XCTAssertEqual(error.errorDescription, "HTTP 404: Not Found")
    }

    func testDecodingErrorDescription() {
        let underlyingError = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "missing key"])
        let error = APIError.decodingError(underlyingError)
        XCTAssertNotNil(error.errorDescription)
        XCTAssertTrue(error.errorDescription!.contains("Failed to decode response"))
    }

    func testNetworkErrorDescription() {
        let underlyingError = URLError(.notConnectedToInternet)
        let error = APIError.networkError(underlyingError)
        XCTAssertNotNil(error.errorDescription)
        XCTAssertTrue(error.errorDescription!.contains("Network error"))
    }

    func testUnknownDescription() {
        let error = APIError.unknown
        XCTAssertEqual(error.errorDescription, "An unknown error occurred")
    }

    func testAllCasesHaveNonNilDescription() {
        let cases: [APIError] = [
            .invalidURL,
            .unauthorized,
            .httpError(statusCode: 500, message: "Server Error"),
            .decodingError(NSError(domain: "", code: 0)),
            .networkError(URLError(.badURL)),
            .unknown
        ]

        for error in cases {
            XCTAssertNotNil(error.errorDescription, "Error \(error) should have non-nil description")
        }
    }
}
