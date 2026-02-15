import XCTest
@testable import Bedrud

final class PasskeyManagerTests: XCTestCase {

    // MARK: - PasskeyError Tests

    func testPasskeyErrorInvalidChallengeDescription() {
        let error = PasskeyError.invalidChallenge
        XCTAssertEqual(error.errorDescription, "Invalid passkey challenge from server")
    }

    func testPasskeyErrorInvalidCredentialDescription() {
        let error = PasskeyError.invalidCredential
        XCTAssertEqual(error.errorDescription, "Invalid credential response")
    }

    func testPasskeyErrorCancelledDescription() {
        let error = PasskeyError.cancelled
        XCTAssertEqual(error.errorDescription, "Passkey operation was cancelled")
    }

    func testPasskeyErrorAuthorizationFailedDescription() {
        let underlyingError = NSError(domain: "test", code: 1, userInfo: nil)
        let error = PasskeyError.authorizationFailed(underlyingError)
        XCTAssertTrue(error.errorDescription?.contains("Authorization failed") ?? false)
        XCTAssertTrue(error.errorDescription?.contains("test") ?? false)
    }

    // MARK: - Base64URL Encoding Tests

    func testBase64URLEncodingReplacesPlusAndSlash() {
        let data = Data([0xFF, 0xFF, 0xFF])
        let encoded = data.base64URLEncodedString()

        // Standard base64 would be "////"
        // Base64URL should replace "/" with "_" and "+" with "-"
        XCTAssertFalse(encoded.contains("/"))
        XCTAssertFalse(encoded.contains("+"))
        XCTAssertTrue(encoded.contains("_"))
    }

    func testBase64URLEncodingRemovesPadding() {
        // Data that would produce padding
        let data = Data([0xFF])
        let encoded = data.base64URLEncodedString()
        XCTAssertFalse(encoded.contains("="))
    }

    func testBase64URLDecodingWithPlusAndSlash() {
        let base64URL = "abc-xyz_test"
        let data = Data(base64URLEncoded: base64URL)

        XCTAssertNotNil(data)
    }

    func testBase64URLDecodingHandlesPadding() {
        // Add padding to test reconstruction
        let base64URL = "YWI"
        let data = Data(base64URLEncoded: base64URL)
        XCTAssertNotNil(data)
        XCTAssertEqual(data, Data([0x61, 0x62]))
    }

    func testBase64URLDecodingEmptyString() {
        let data = Data(base64URLEncoded: "")
        XCTAssertNil(data)
    }

    func testBase64URLDecodingInvalidBase64() {
        let data = Data(base64URLEncoded: "!!!")
        XCTAssertNil(data)
    }

    // MARK: - Base64URL Round-Trip Tests

    func testBase64URLRoundTrip() {
        let originalData = Data([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD])
        let encoded = originalData.base64URLEncodedString()
        let decoded = Data(base64URLEncoded: encoded)

        XCTAssertEqual(decoded, originalData)
    }

    func testBase64URLRoundTripWithSpecialChars() {
        let originalData = Data([0xFB, 0xFF, 0xFF])
        let encoded = originalData.base64URLEncodedString()
        let decoded = Data(base64URLEncoded: encoded)

        XCTAssertEqual(decoded, originalData)
    }

    // MARK: - Empty and Edge Case Data

    func testBase64URLEncodingEmptyData() {
        let data = Data()
        let encoded = data.base64URLEncodedString()
        XCTAssertEqual(encoded, "")
    }

    func testBase64URLDecodingEmptyEncodedString() {
        let data = Data(base64URLEncoded: "")
        XCTAssertNotNil(data)
        XCTAssertTrue(data!.isEmpty)
    }

    func testBase64URLEncodingSingleByte() {
        let data = Data([0x41]) // 'A'
        let encoded = data.base64URLEncodedString()
        // Should be a valid base64URL string without padding
        XCTAssertFalse(encoded.contains("="))
        XCTAssertFalse(encoded.contains("/"))
        XCTAssertFalse(encoded.contains("+"))
    }

    func testBase64URLDecodingSingleByte() {
        let data = Data(base64URLEncoded: "QQ")
        XCTAssertEqual(data, Data([0x41])) // 'A'
    }
}
