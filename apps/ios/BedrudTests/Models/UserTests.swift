import XCTest
@testable import Bedrud

final class UserTests: XCTestCase {

    // MARK: - Init

    func testInit() {
        let user = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: "https://img.com/a.png", isAdmin: true, provider: "github")
        XCTAssertEqual(user.id, "u1")
        XCTAssertEqual(user.email, "a@b.com")
        XCTAssertEqual(user.name, "Alice")
        XCTAssertEqual(user.avatarUrl, "https://img.com/a.png")
        XCTAssertTrue(user.isAdmin)
        XCTAssertEqual(user.provider, "github")
    }

    // MARK: - Custom Equality (id-based)

    func testEqualitySameIdDifferentFields() {
        let a = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil)
        let b = User(id: "u1", email: "different@b.com", name: "Bob", avatarUrl: "url", isAdmin: true, provider: "google")
        XCTAssertEqual(a, b, "User equality is id-based")
    }

    func testEqualityDifferentId() {
        let a = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil)
        let b = User(id: "u2", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil)
        XCTAssertNotEqual(a, b)
    }

    // MARK: - Codable Round-Trip

    func testCodableRoundTrip() throws {
        let user = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: "github")
        let data = try JSONEncoder().encode(user)
        let decoded = try JSONDecoder().decode(User.self, from: data)
        XCTAssertEqual(decoded.id, "u1")
        XCTAssertEqual(decoded.email, "a@b.com")
        XCTAssertEqual(decoded.name, "Alice")
        XCTAssertNil(decoded.avatarUrl)
        XCTAssertFalse(decoded.isAdmin)
        XCTAssertEqual(decoded.provider, "github")
    }

    // MARK: - AdminUser

    func testAdminUserInit() {
        let admin = AdminUser(id: "a1", email: "admin@b.com", name: "Admin", provider: "local", isActive: true, accesses: ["admin"], createdAt: "2024-01-01")
        XCTAssertEqual(admin.id, "a1")
        XCTAssertTrue(admin.isActive)
        XCTAssertEqual(admin.accesses, ["admin"])
    }

    func testAdminUserEqualitySameId() {
        let a = AdminUser(id: "a1", email: "a@b.com", name: "A", provider: "local", isActive: true, accesses: nil, createdAt: "2024-01-01")
        let b = AdminUser(id: "a1", email: "different@b.com", name: "B", provider: "github", isActive: false, accesses: ["admin"], createdAt: "2025-01-01")
        XCTAssertEqual(a, b, "AdminUser equality is id-based")
    }

    func testAdminUserEqualityDifferentId() {
        let a = AdminUser(id: "a1", email: "a@b.com", name: "A", provider: "local", isActive: true, accesses: nil, createdAt: "2024-01-01")
        let b = AdminUser(id: "a2", email: "a@b.com", name: "A", provider: "local", isActive: true, accesses: nil, createdAt: "2024-01-01")
        XCTAssertNotEqual(a, b)
    }

    func testAdminUserCodable() throws {
        let admin = AdminUser(id: "a1", email: "admin@b.com", name: "Admin", provider: "local", isActive: true, accesses: ["admin", "moderator"], createdAt: "2024-01-01")
        let data = try JSONEncoder().encode(admin)
        let decoded = try JSONDecoder().decode(AdminUser.self, from: data)
        XCTAssertEqual(decoded.id, "a1")
        XCTAssertEqual(decoded.accesses, ["admin", "moderator"])
    }
}
