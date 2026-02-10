import XCTest
@testable import Bedrud

final class InstanceTests: XCTestCase {

    // MARK: - Init Defaults

    func testInitDefaults() {
        let instance = Instance(serverURL: "https://example.com", displayName: "Test")

        XCTAssertFalse(instance.id.isEmpty)
        XCTAssertEqual(instance.serverURL, "https://example.com")
        XCTAssertEqual(instance.displayName, "Test")
        XCTAssertFalse(instance.iconColorHex.isEmpty)
        XCTAssertTrue(instance.iconColorHex.hasPrefix("#"))
    }

    // MARK: - apiBaseURL

    func testApiBaseURLWithoutTrailingSlash() {
        let instance = Instance(serverURL: "https://example.com", displayName: "Test")
        XCTAssertEqual(instance.apiBaseURL, "https://example.com/api")
    }

    func testApiBaseURLWithTrailingSlash() {
        let instance = Instance(serverURL: "https://example.com/", displayName: "Test")
        XCTAssertEqual(instance.apiBaseURL, "https://example.com/api")
    }

    // MARK: - Random Color

    func testRandomColorReturnsValidHex() {
        let validColors = Set(["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"])
        let instance = Instance(serverURL: "https://example.com", displayName: "Test")
        XCTAssertTrue(validColors.contains(instance.iconColorHex))
    }

    // MARK: - Codable Round-Trip

    func testCodableRoundTrip() throws {
        let original = Instance(
            id: "test-id",
            serverURL: "https://example.com",
            displayName: "Test",
            iconColorHex: "#3B82F6",
            addedAt: Date(timeIntervalSince1970: 1000)
        )

        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(Instance.self, from: data)

        XCTAssertEqual(decoded, original)
        XCTAssertEqual(decoded.id, "test-id")
        XCTAssertEqual(decoded.serverURL, "https://example.com")
        XCTAssertEqual(decoded.displayName, "Test")
        XCTAssertEqual(decoded.iconColorHex, "#3B82F6")
    }

    // MARK: - Equatable

    func testEquatable() {
        let a = Instance(id: "same", serverURL: "https://a.com", displayName: "A", iconColorHex: "#000000")
        let b = Instance(id: "same", serverURL: "https://b.com", displayName: "B", iconColorHex: "#FFFFFF")
        let c = Instance(id: "different", serverURL: "https://a.com", displayName: "A", iconColorHex: "#000000")

        // Same id but different fields — struct Equatable compares all fields
        // Instance uses synthesized Equatable, so all fields matter
        XCTAssertNotEqual(a, b)
        XCTAssertNotEqual(a, c)
    }

    // MARK: - Account

    func testAccountInit() {
        let account = Account(instanceId: "inst-1", userId: "u1", userName: "User", userEmail: "u@e.com", isLoggedIn: true)
        XCTAssertEqual(account.instanceId, "inst-1")
        XCTAssertEqual(account.userId, "u1")
        XCTAssertTrue(account.isLoggedIn)
    }

    func testAccountCodable() throws {
        let original = Account(instanceId: "i1", userId: nil, userName: nil, userEmail: nil, isLoggedIn: false)
        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(Account.self, from: data)
        XCTAssertEqual(decoded, original)
    }

    // MARK: - HealthResponse

    func testHealthResponseDecodable() throws {
        let json = #"{"status":"ok","version":"1.0.0"}"#
        let data = json.data(using: .utf8)!
        let response = try JSONDecoder().decode(HealthResponse.self, from: data)
        XCTAssertEqual(response.status, "ok")
        XCTAssertEqual(response.version, "1.0.0")
    }

    func testHealthResponseNilFields() throws {
        let json = #"{}"#
        let data = json.data(using: .utf8)!
        let response = try JSONDecoder().decode(HealthResponse.self, from: data)
        XCTAssertNil(response.status)
        XCTAssertNil(response.version)
    }
}
