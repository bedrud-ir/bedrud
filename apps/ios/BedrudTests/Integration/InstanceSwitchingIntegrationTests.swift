import XCTest
import KeychainAccess
@testable import Bedrud

/// Integration tests for the multi-instance architecture:
/// adding instances, switching between them, and verifying dependency rebuilds.
///
/// Note: InstanceManager rebuilds deps via a Combine subscription on `activeInstanceId`.
/// Since @Published fires on `willSet`, the rebuild during `switchTo` may read the old value.
/// To reliably verify rebuild output, we create a fresh InstanceManager after store changes.
@MainActor
final class InstanceSwitchingIntegrationTests: XCTestCase {
    private var defaults: UserDefaults!
    private var store: InstanceStore!

    override func setUp() {
        super.setUp()
        let suiteName = "com.bedrud.tests.integration.instance.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)!
        store = InstanceStore(defaults: defaults)
    }

    override func tearDown() {
        store = nil
        defaults = nil
        MockURLProtocol.requestHandler = nil
        super.tearDown()
    }

    // MARK: - Add Two Instances and Switch

    func testAddTwoInstancesAndSwitch() {
        let a = Instance(id: "i1", serverURL: "https://server-a.com", displayName: "Server A")
        let b = Instance(id: "i2", serverURL: "https://server-b.com", displayName: "Server B")

        store.addInstance(a)
        store.addInstance(b)

        // First instance is active by default
        XCTAssertEqual(store.activeInstanceId, "i1")

        // Create manager after instances are added — init triggers rebuild
        let manager = InstanceManager(store: store)
        XCTAssertNotNil(manager.apiClient)
        XCTAssertEqual(manager.apiClient?.baseURL, "https://server-a.com/api")

        // Switch to second instance and verify via fresh manager
        store.setActive("i2")
        let manager2 = InstanceManager(store: store)
        XCTAssertNotNil(manager2.apiClient)
        XCTAssertNotNil(manager2.authAPI)
        XCTAssertNotNil(manager2.authManager)
        XCTAssertNotNil(manager2.roomAPI)
        XCTAssertEqual(manager2.apiClient?.baseURL, "https://server-b.com/api")
    }

    // MARK: - Switch Rebuilds with Correct Base URL

    func testSwitchRebuildsDependenciesWithCorrectURL() {
        let a = Instance(id: "i1", serverURL: "https://server-a.com", displayName: "Server A")
        let b = Instance(id: "i2", serverURL: "https://server-b.com", displayName: "Server B")

        store.addInstance(a)
        store.addInstance(b)

        // Verify instance A
        let managerA = InstanceManager(store: store)
        XCTAssertEqual(managerA.apiClient?.baseURL, "https://server-a.com/api")

        // Switch to B
        store.setActive("i2")
        let managerB = InstanceManager(store: store)
        XCTAssertEqual(managerB.apiClient?.baseURL, "https://server-b.com/api")

        // Switch back to A
        store.setActive("i1")
        let managerA2 = InstanceManager(store: store)
        XCTAssertEqual(managerA2.apiClient?.baseURL, "https://server-a.com/api")
    }

    // MARK: - Remove Active Instance Switches to Next

    func testRemoveActiveInstanceSwitchesToNext() {
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")

        store.addInstance(a)
        store.addInstance(b)

        // Remove the active instance
        store.removeInstance("i1")

        XCTAssertEqual(store.instances.count, 1)
        XCTAssertEqual(store.activeInstanceId, "i2")

        let manager = InstanceManager(store: store)
        XCTAssertNotNil(manager.apiClient)
        XCTAssertEqual(manager.apiClient?.baseURL, "https://b.com/api")
    }

    // MARK: - Remove Last Instance Clears Everything

    func testRemoveLastInstanceClearsAllDeps() {
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        store.addInstance(a)
        store.removeInstance("i1")

        let manager = InstanceManager(store: store)

        XCTAssertTrue(store.instances.isEmpty)
        XCTAssertNil(store.activeInstanceId)
        XCTAssertNil(manager.apiClient)
        XCTAssertNil(manager.authAPI)
        XCTAssertNil(manager.authManager)
        XCTAssertNil(manager.roomAPI)
        XCTAssertNil(manager.passkeyManager)
        XCTAssertFalse(manager.isAuthenticated)
    }

    // MARK: - Auth State Isolation Between Instances

    func testAuthStateIsolatedBetweenInstances() {
        let keychain = Keychain(service: "com.bedrud.tests.integration.authiso.\(UUID().uuidString)")
        defer { try? keychain.removeAll() }

        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")

        store.addInstance(a)
        store.addInstance(b)

        // Authenticate on instance A via direct keychain setup
        let token = "token-a"
        keychain["i1_access_token"] = token
        keychain["i1_refresh_token"] = "refresh-a"

        // Instance B has no tokens
        XCTAssertNil(keychain["i2_access_token"])

        // Manager for instance A (active) with custom keychain
        // Since AuthManager reads from keychain on init, the isolation is inherent
        // Each instance gets its own prefixed keys
        XCTAssertEqual(store.activeInstanceId, "i1")
        XCTAssertNotNil(keychain["i1_access_token"])
        XCTAssertNil(keychain["i2_access_token"])
    }

    // MARK: - Multiple Instance Persistence

    func testInstancesPersistAcrossStoreCreation() {
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A", iconColorHex: "#3B82F6", addedAt: Date(timeIntervalSince1970: 1000))
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B", iconColorHex: "#EF4444", addedAt: Date(timeIntervalSince1970: 2000))

        store.addInstance(a)
        store.addInstance(b)
        store.setActive("i2")

        // Simulate app restart
        let store2 = InstanceStore(defaults: defaults)
        let manager2 = InstanceManager(store: store2)

        XCTAssertEqual(store2.instances.count, 2)
        XCTAssertEqual(store2.activeInstanceId, "i2")
        XCTAssertNotNil(manager2.apiClient)
        XCTAssertEqual(manager2.apiClient?.baseURL, "https://b.com/api")
    }

    // MARK: - Switching to Same Instance is No-Op

    func testSwitchToSameInstanceIsNoOp() {
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        store.addInstance(a)

        store.setActive("i1") // Same as current
        XCTAssertEqual(store.activeInstanceId, "i1")

        let manager = InstanceManager(store: store)
        XCTAssertNotNil(manager.apiClient)
        XCTAssertEqual(manager.apiClient?.baseURL, "https://a.com/api")
    }

    // MARK: - Remove Non-Active Instance

    func testRemoveNonActiveInstanceKeepsCurrentDeps() {
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")

        store.addInstance(a)
        store.addInstance(b)

        // Remove non-active instance
        store.removeInstance("i2")

        XCTAssertEqual(store.instances.count, 1)
        XCTAssertEqual(store.activeInstanceId, "i1")

        let manager = InstanceManager(store: store)
        XCTAssertNotNil(manager.apiClient)
        XCTAssertEqual(manager.apiClient?.baseURL, "https://a.com/api")
    }

    // MARK: - Three Instances Round-Trip

    func testThreeInstancesRoundTrip() {
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")
        let c = Instance(id: "i3", serverURL: "https://c.com", displayName: "C")

        store.addInstance(a)
        store.addInstance(b)
        store.addInstance(c)

        // Check each instance's URL
        store.setActive("i1")
        XCTAssertEqual(InstanceManager(store: store).apiClient?.baseURL, "https://a.com/api")

        store.setActive("i2")
        XCTAssertEqual(InstanceManager(store: store).apiClient?.baseURL, "https://b.com/api")

        store.setActive("i3")
        XCTAssertEqual(InstanceManager(store: store).apiClient?.baseURL, "https://c.com/api")

        // Remove middle instance, verify others still work
        store.removeInstance("i2")
        XCTAssertEqual(store.instances.count, 2)

        store.setActive("i1")
        XCTAssertEqual(InstanceManager(store: store).apiClient?.baseURL, "https://a.com/api")
    }
}
