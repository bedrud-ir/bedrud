import XCTest
import KeychainAccess
@testable import Bedrud

@MainActor
final class MigrationManagerTests: XCTestCase {
    private var defaults: UserDefaults!
    private var keychain: Keychain!
    private var store: InstanceStore!
    private var serviceName: String!

    override func setUp() {
        super.setUp()
        let id = UUID().uuidString
        let suiteName = "com.bedrud.tests.migration.\(id)"
        defaults = UserDefaults(suiteName: suiteName)!
        serviceName = "com.bedrud.tests.migration.\(id)"
        keychain = Keychain(service: serviceName)
        store = InstanceStore(defaults: defaults)
    }

    override func tearDown() {
        try? keychain.removeAll()
        keychain = nil
        defaults = nil
        store = nil
        super.tearDown()
    }

    // MARK: - Skip When Already Migrated

    func testSkipWhenAlreadyMigrated() {
        defaults.set(true, forKey: "bedrud_migration_v1_done")
        keychain["access_token"] = "old-token"

        MigrationManager.migrateIfNeeded(store: store, defaults: defaults, keychain: keychain)

        XCTAssertTrue(store.instances.isEmpty, "Should not create instance when migration already done")
    }

    // MARK: - Migrate Old Tokens

    func testMigrateOldTokens() {
        keychain["access_token"] = "old-access"
        keychain["refresh_token"] = "old-refresh"
        keychain["user_data"] = "{\"id\":\"u1\"}"

        MigrationManager.migrateIfNeeded(store: store, defaults: defaults, keychain: keychain)

        XCTAssertEqual(store.instances.count, 1)
        let instance = store.instances[0]
        XCTAssertEqual(instance.serverURL, "https://bedrud.com")
        XCTAssertEqual(instance.displayName, "Bedrud")

        // Tokens moved to prefixed keys
        XCTAssertEqual(keychain["\(instance.id)_access_token"], "old-access")
        XCTAssertEqual(keychain["\(instance.id)_refresh_token"], "old-refresh")
        XCTAssertEqual(keychain["\(instance.id)_user_data"], "{\"id\":\"u1\"}")

        // Old keys removed
        XCTAssertNil(keychain["access_token"])
        XCTAssertNil(keychain["refresh_token"])
        XCTAssertNil(keychain["user_data"])
    }

    // MARK: - Create Default Instance

    func testCreateDefaultInstance() {
        keychain["access_token"] = "token"

        MigrationManager.migrateIfNeeded(store: store, defaults: defaults, keychain: keychain)

        XCTAssertEqual(store.instances.count, 1)
        XCTAssertEqual(store.activeInstance?.serverURL, "https://bedrud.com")
    }

    // MARK: - Sets Migration Done Flag

    func testSetsMigrationDoneFlag() {
        keychain["access_token"] = "token"

        MigrationManager.migrateIfNeeded(store: store, defaults: defaults, keychain: keychain)

        XCTAssertTrue(defaults.bool(forKey: "bedrud_migration_v1_done"))
    }

    // MARK: - No-Op When No Old Tokens

    func testNoOpWhenNoOldTokens() {
        MigrationManager.migrateIfNeeded(store: store, defaults: defaults, keychain: keychain)

        XCTAssertTrue(store.instances.isEmpty)
        XCTAssertTrue(defaults.bool(forKey: "bedrud_migration_v1_done"), "Flag should still be set")
    }

    // MARK: - No-Op When Empty Token

    func testNoOpWhenEmptyToken() {
        keychain["access_token"] = ""

        MigrationManager.migrateIfNeeded(store: store, defaults: defaults, keychain: keychain)

        XCTAssertTrue(store.instances.isEmpty)
    }
}
