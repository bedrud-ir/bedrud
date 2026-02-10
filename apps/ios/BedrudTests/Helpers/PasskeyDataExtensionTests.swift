import XCTest
@testable import Bedrud

final class PasskeyDataExtensionTests: XCTestCase {

    // MARK: - Data(base64URLEncoded:)

    func testBase64URLDecodingWithStandardCharacters() {
        // "Hello" in base64 = "SGVsbG8="
        let data = Data(base64URLEncoded: "SGVsbG8")
        XCTAssertNotNil(data)
        XCTAssertEqual(String(data: data!, encoding: .utf8), "Hello")
    }

    func testBase64URLDecodingReplacesMinusWithPlus() {
        // Create data that has '+' in standard base64
        let original = Data([0xFB, 0xFF]) // base64: "+/8=" -> base64url: "-_8"
        let base64url = original.base64URLEncodedString()
        let decoded = Data(base64URLEncoded: base64url)
        XCTAssertEqual(decoded, original)
    }

    func testBase64URLDecodingReplacesUnderscoreWithSlash() {
        // Test a value that produces '/' in standard base64
        let original = Data([0xFF, 0xFF]) // base64: "//8=" -> base64url: "__8"
        let base64url = original.base64URLEncodedString()
        let decoded = Data(base64URLEncoded: base64url)
        XCTAssertEqual(decoded, original)
    }

    // MARK: - base64URLEncodedString()

    func testBase64URLEncodedStringRemovesPadding() {
        let data = "Hello".data(using: .utf8)!
        let result = data.base64URLEncodedString()
        XCTAssertFalse(result.contains("="))
    }

    func testBase64URLEncodedStringReplacesPlus() {
        let data = Data([0xFB, 0xFF])
        let result = data.base64URLEncodedString()
        XCTAssertFalse(result.contains("+"))
    }

    func testBase64URLEncodedStringReplacesSlash() {
        let data = Data([0xFF, 0xFF])
        let result = data.base64URLEncodedString()
        XCTAssertFalse(result.contains("/"))
    }

    // MARK: - Round-Trip

    func testRoundTripEncodeAndDecode() {
        let original = "This is a test string with special chars: <>!@#$%".data(using: .utf8)!
        let encoded = original.base64URLEncodedString()
        let decoded = Data(base64URLEncoded: encoded)
        XCTAssertEqual(decoded, original)
    }

    func testRoundTripWithBinaryData() {
        let original = Data((0..<256).map { UInt8($0) })
        let encoded = original.base64URLEncodedString()
        let decoded = Data(base64URLEncoded: encoded)
        XCTAssertEqual(decoded, original)
    }

    // MARK: - Padding Edge Cases

    func testPaddingRemainder0() {
        // 3 bytes = 4 base64 chars, no padding needed
        let data = Data([0x41, 0x42, 0x43]) // "ABC"
        let encoded = data.base64URLEncodedString()
        let decoded = Data(base64URLEncoded: encoded)
        XCTAssertEqual(decoded, data)
    }

    func testPaddingRemainder2() {
        // 1 byte = 2 base64 chars, needs 2 padding
        let data = Data([0x41]) // "A"
        let encoded = data.base64URLEncodedString()
        XCTAssertEqual(encoded.count % 4, 2) // 2 chars, remainder 2
        let decoded = Data(base64URLEncoded: encoded)
        XCTAssertEqual(decoded, data)
    }

    func testPaddingRemainder3() {
        // 2 bytes = 3 base64 chars, needs 1 padding
        let data = Data([0x41, 0x42]) // "AB"
        let encoded = data.base64URLEncodedString()
        XCTAssertEqual(encoded.count % 4, 3) // 3 chars, remainder 3
        let decoded = Data(base64URLEncoded: encoded)
        XCTAssertEqual(decoded, data)
    }

    // MARK: - Empty Data

    func testEmptyDataRoundTrip() {
        let data = Data()
        let encoded = data.base64URLEncodedString()
        XCTAssertEqual(encoded, "")
        let decoded = Data(base64URLEncoded: encoded)
        XCTAssertEqual(decoded, data)
    }
}
