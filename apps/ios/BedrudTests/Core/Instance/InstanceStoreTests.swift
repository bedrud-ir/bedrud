import XCTest
@testable import Bedrud

@MainActor
final class InstanceStoreTests: XCTestCase {
    private var defaults: UserDefaults!

    override func setUp() {
        super.setUp()
        let suiteName = "org.bedrud.tests.instancestore.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)!
    }

    override func tearDown() {
        if let suiteName = defaults.volatileDomainNames.first {
            UserDefaults.standard.removePersistentDomain(forName: suiteName)
        }
        defaults = nil
        super.tearDown()
    }

    // MARK: - Init

    func testInitLoadsEmptyWhenNoData() {
        let store = InstanceStore(defaults: defaults)
        XCTAssertTrue(store.instances.isEmpty)
        XCTAssertNil(store.activeInstanceId)
        XCTAssertNil(store.activeInstance)
    }

    // MARK: - addInstance

    func testAddInstancePersistsAndAutoSetsFirstActive() {
        let store = InstanceStore(defaults: defaults)
        let instance = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")

        store.addInstance(instance)

        XCTAssertEqual(store.instances.count, 1)
        XCTAssertEqual(store.activeInstanceId, "i1")
        XCTAssertEqual(store.activeInstance?.id, "i1")
    }

    func testAddInstanceSecondDoesNotChangeActive() {
        let store = InstanceStore(defaults: defaults)
        let first = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let second = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")

        store.addInstance(first)
        store.addInstance(second)

        XCTAssertEqual(store.instances.count, 2)
        XCTAssertEqual(store.activeInstanceId, "i1", "Active should remain the first instance")
    }

    // MARK: - removeInstance

    func testRemoveInstanceUpdatesActiveToFirstRemaining() {
        let store = InstanceStore(defaults: defaults)
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")

        store.addInstance(a)
        store.addInstance(b)
        store.removeInstance("i1")

        XCTAssertEqual(store.instances.count, 1)
        XCTAssertEqual(store.activeInstanceId, "i2")
    }

    func testRemoveLastInstanceSetsActiveToNil() {
        let store = InstanceStore(defaults: defaults)
        let instance = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")

        store.addInstance(instance)
        store.removeInstance("i1")

        XCTAssertTrue(store.instances.isEmpty)
        XCTAssertNil(store.activeInstanceId)
    }

    func testRemoveNonActiveInstanceDoesNotChangeActive() {
        let store = InstanceStore(defaults: defaults)
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")

        store.addInstance(a)
        store.addInstance(b)
        store.removeInstance("i2")

        XCTAssertEqual(store.activeInstanceId, "i1")
        XCTAssertEqual(store.instances.count, 1)
    }

    // MARK: - setActive

    func testSetActiveWithValidId() {
        let store = InstanceStore(defaults: defaults)
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")

        store.addInstance(a)
        store.addInstance(b)
        store.setActive("i2")

        XCTAssertEqual(store.activeInstanceId, "i2")
        XCTAssertEqual(store.activeInstance?.id, "i2")
    }

    func testSetActiveWithInvalidIdDoesNothing() {
        let store = InstanceStore(defaults: defaults)
        let instance = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")

        store.addInstance(instance)
        store.setActive("nonexistent")

        XCTAssertEqual(store.activeInstanceId, "i1", "Should remain unchanged")
    }

    // MARK: - activeInstance

    func testActiveInstanceReturnsCorrectInstance() {
        let store = InstanceStore(defaults: defaults)
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")

        store.addInstance(a)
        store.addInstance(b)
        store.setActive("i2")

        XCTAssertEqual(store.activeInstance?.displayName, "B")
    }

    // MARK: - Persistence Round-Trip

    func testPersistenceRoundTrip() {
        // Add instances with first store
        let store1 = InstanceStore(defaults: defaults)
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A", iconColorHex: "#3B82F6", addedAt: Date(timeIntervalSince1970: 1000))
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B", iconColorHex: "#EF4444", addedAt: Date(timeIntervalSince1970: 2000))
        store1.addInstance(a)
        store1.addInstance(b)
        store1.setActive("i2")

        // Create new store from same defaults
        let store2 = InstanceStore(defaults: defaults)

        XCTAssertEqual(store2.instances.count, 2)
        XCTAssertEqual(store2.activeInstanceId, "i2")
        XCTAssertEqual(store2.instances[0].id, "i1")
        XCTAssertEqual(store2.instances[1].id, "i2")
    }
}
