import XCTest
@testable import Bedrud

final class PasskeyErrorTests: XCTestCase {

    func testInvalidChallengeDescription() {
        let error = PasskeyError.invalidChallenge
        XCTAssertNotNil(error.errorDescription)
        XCTAssertEqual(error.errorDescription, "Invalid passkey challenge from server")
    }

    func testInvalidCredentialDescription() {
        let error = PasskeyError.invalidCredential
        XCTAssertNotNil(error.errorDescription)
        XCTAssertEqual(error.errorDescription, "Invalid credential response")
    }

    func testAuthorizationFailedDescription() {
        let underlyingError = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "test error"])
        let error = PasskeyError.authorizationFailed(underlyingError)
        XCTAssertNotNil(error.errorDescription)
        XCTAssertTrue(error.errorDescription!.contains("Authorization failed"))
        XCTAssertTrue(error.errorDescription!.contains("test error"))
    }

    func testCancelledDescription() {
        let error = PasskeyError.cancelled
        XCTAssertNotNil(error.errorDescription)
        XCTAssertEqual(error.errorDescription, "Passkey operation was cancelled")
    }
}
