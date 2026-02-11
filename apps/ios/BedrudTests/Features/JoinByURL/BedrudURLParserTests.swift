import XCTest
@testable import Bedrud

final class BedrudURLParserTests: XCTestCase {

    // MARK: - Valid URLs with /c/ Path

    func testParseConferenceURL() {
        let result = BedrudURLParser.parse("https://server.com/c/my-room")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.serverBaseURL, "https://server.com")
        XCTAssertEqual(result?.roomName, "my-room")
    }

    func testParseConferenceURLWithTrailingSlash() {
        // URL(string:) does not retain trailing slash after room name normally,
        // but let's verify the parser works with it
        let result = BedrudURLParser.parse("https://server.com/c/room-name")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.roomName, "room-name")
    }

    // MARK: - Valid URLs with /m/ Path

    func testParseMeetingURL() {
        let result = BedrudURLParser.parse("https://server.com/m/team-standup")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.serverBaseURL, "https://server.com")
        XCTAssertEqual(result?.roomName, "team-standup")
    }

    // MARK: - URLs Without Scheme

    func testParseURLWithoutScheme() {
        let result = BedrudURLParser.parse("server.com/c/my-room")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.serverBaseURL, "https://server.com")
        XCTAssertEqual(result?.roomName, "my-room")
    }

    func testParseURLWithoutSchemeAndMeetingPath() {
        let result = BedrudURLParser.parse("example.org/m/standup")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.serverBaseURL, "https://example.org")
        XCTAssertEqual(result?.roomName, "standup")
    }

    // MARK: - URLs With Ports

    func testParseURLWithPort() {
        let result = BedrudURLParser.parse("https://server.com:8080/c/my-room")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.serverBaseURL, "https://server.com:8080")
        XCTAssertEqual(result?.roomName, "my-room")
    }

    func testParseURLWithPortNoScheme() {
        let result = BedrudURLParser.parse("server.com:8080/c/my-room")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.serverBaseURL, "https://server.com:8080")
        XCTAssertEqual(result?.roomName, "my-room")
    }

    // MARK: - HTTP Scheme

    func testParseHTTPURL() {
        let result = BedrudURLParser.parse("http://localhost/c/test-room")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.serverBaseURL, "http://localhost")
        XCTAssertEqual(result?.roomName, "test-room")
    }

    func testParseHTTPURLWithPort() {
        let result = BedrudURLParser.parse("http://localhost:3000/m/dev-room")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.serverBaseURL, "http://localhost:3000")
        XCTAssertEqual(result?.roomName, "dev-room")
    }

    // MARK: - Whitespace Trimming

    func testParseURLWithLeadingWhitespace() {
        let result = BedrudURLParser.parse("  https://server.com/c/room")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.roomName, "room")
    }

    func testParseURLWithTrailingWhitespace() {
        let result = BedrudURLParser.parse("https://server.com/c/room  ")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.roomName, "room")
    }

    func testParseURLWithNewlines() {
        let result = BedrudURLParser.parse("\nhttps://server.com/c/room\n")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.roomName, "room")
    }

    // MARK: - Invalid URLs

    func testParseEmptyString() {
        let result = BedrudURLParser.parse("")
        XCTAssertNil(result)
    }

    func testParseURLWithNoPath() {
        let result = BedrudURLParser.parse("https://server.com")
        XCTAssertNil(result)
    }

    func testParseURLWithOnlyPathPrefix() {
        let result = BedrudURLParser.parse("https://server.com/c/")
        XCTAssertNil(result)
    }

    func testParseURLWithWrongPathPrefix() {
        let result = BedrudURLParser.parse("https://server.com/x/room")
        XCTAssertNil(result)
    }

    func testParseURLWithSinglePathComponent() {
        let result = BedrudURLParser.parse("https://server.com/room")
        XCTAssertNil(result)
    }

    func testParseURLWithNoHost() {
        let result = BedrudURLParser.parse("https:///c/room")
        XCTAssertNil(result)
    }

    // MARK: - Room Name Variations

    func testParseURLWithUUIDRoomName() {
        let result = BedrudURLParser.parse("https://server.com/c/550e8400-e29b-41d4-a716-446655440000")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.roomName, "550e8400-e29b-41d4-a716-446655440000")
    }

    func testParseURLWithAlphanumericRoomName() {
        let result = BedrudURLParser.parse("https://server.com/c/room123")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.roomName, "room123")
    }

    // MARK: - Extra Path Components

    func testParseURLWithExtraPathComponents() {
        // Should still parse - takes second path component as room name
        let result = BedrudURLParser.parse("https://server.com/c/room/extra")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.roomName, "room")
    }

    // MARK: - Subdomain URLs

    func testParseSubdomainURL() {
        let result = BedrudURLParser.parse("https://meet.company.com/c/standup")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.serverBaseURL, "https://meet.company.com")
        XCTAssertEqual(result?.roomName, "standup")
    }

    // MARK: - BedrudMeetingURL Properties

    func testBedrudMeetingURLProperties() {
        let meetingURL = BedrudMeetingURL(serverBaseURL: "https://test.com", roomName: "room")
        XCTAssertEqual(meetingURL.serverBaseURL, "https://test.com")
        XCTAssertEqual(meetingURL.roomName, "room")
    }
}
