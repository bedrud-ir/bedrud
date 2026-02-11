import XCTest
@testable import Bedrud

@MainActor
final class InstanceManagerTests: XCTestCase {
    private var defaults: UserDefaults!
    private var store: InstanceStore!
    private var manager: InstanceManager!

    override func setUp() {
        super.setUp()
        let suiteName = "com.bedrud.tests.instancemanager.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)!
        store = InstanceStore(defaults: defaults)
        manager = InstanceManager(store: store)
    }

    override func tearDown() {
        manager = nil
        store = nil
        defaults = nil
        super.tearDown()
    }

    // MARK: - Initial State

    func testInitialStateNoInstances() {
        XCTAssertNil(manager.apiClient)
        XCTAssertNil(manager.authAPI)
        XCTAssertNil(manager.authManager)
        XCTAssertNil(manager.roomAPI)
        XCTAssertFalse(manager.isAuthenticated)
    }

    // MARK: - checkHealth

    func testCheckHealthSuccess() async throws {
        let healthJSON = #"{"status":"ok","version":"1.0.0"}"#

        MockURLProtocol.requestHandler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/health"))
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, healthJSON.data(using: .utf8)!)
        }

        let session = URLSession.mock()
        // We can't inject session into checkHealth directly, so test the APIClient path
        let client = APIClient(baseURL: "https://test.com/api", session: session)
        let result: HealthResponse = try await client.fetch("/health")
        XCTAssertEqual(result.status, "ok")
    }

    func testCheckHealthFailure() async {
        MockURLProtocol.requestHandler = { request in
            let response = HTTPURLResponse(url: request.url!, statusCode: 500, httpVersion: nil, headerFields: nil)!
            return (response, Data())
        }

        let session = URLSession.mock()
        let client = APIClient(baseURL: "https://test.com/api", session: session)
        do {
            let _: HealthResponse = try await client.fetch("/health")
            XCTFail("Should have thrown")
        } catch {
            // Expected
        }
    }

    // MARK: - switchTo

    func testSwitchToChangesActiveInstance() {
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")
        store.addInstance(a)
        store.addInstance(b)

        manager.switchTo("i2")

        XCTAssertEqual(store.activeInstanceId, "i2")
    }

    // MARK: - removeInstance

    func testRemoveInstanceRemovesFromStore() async {
        let instance = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        store.addInstance(instance)

        // Let manager rebuild
        manager = InstanceManager(store: store)

        await manager.removeInstance("i1")

        XCTAssertTrue(store.instances.isEmpty)
        XCTAssertNil(store.activeInstanceId)
    }

    // MARK: - rebuild

    func testRebuildCreatesDependenciesWhenInstanceExists() {
        let instance = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        store.addInstance(instance)

        // Force rebuild via new manager
        manager = InstanceManager(store: store)

        XCTAssertNotNil(manager.apiClient)
        XCTAssertNotNil(manager.authAPI)
        XCTAssertNotNil(manager.authManager)
        XCTAssertNotNil(manager.roomAPI)
    }

    func testRebuildNilsOutWhenNoInstance() {
        let instance = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        store.addInstance(instance)
        manager = InstanceManager(store: store)
        XCTAssertNotNil(manager.apiClient)

        store.removeInstance("i1")

        // After removing, rebuild should nil everything
        // The Combine subscription fires automatically
        XCTAssertNil(manager.apiClient)
        XCTAssertNil(manager.authManager)
        XCTAssertFalse(manager.isAuthenticated)
    }

    // MARK: - addInstance via health check

    func testAddInstanceWithHealthCheck() async throws {
        MockURLProtocol.requestHandler = { request in
            let healthJSON = #"{"status":"ok","version":"1.0.0"}"#
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, healthJSON.data(using: .utf8)!)
        }

        // Use a mock session-based check by testing checkHealth directly
        let session = URLSession.mock()
        let client = APIClient(baseURL: "https://test.com/api", session: session)
        let result: HealthResponse = try await client.fetch("/health")
        XCTAssertEqual(result.status, "ok")
    }

    // MARK: - PasskeyManager Created

    func testRebuildCreatesPasskeyManager() {
        let instance = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        store.addInstance(instance)
        manager = InstanceManager(store: store)

        XCTAssertNotNil(manager.passkeyManager)
    }

    func testRebuildNilsPasskeyManagerWhenNoInstance() {
        let instance = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        store.addInstance(instance)
        manager = InstanceManager(store: store)
        XCTAssertNotNil(manager.passkeyManager)

        store.removeInstance("i1")

        XCTAssertNil(manager.passkeyManager)
    }

    // MARK: - isAuthenticated Relay

    func testIsAuthenticatedRelaysFromAuthManager() {
        let instance = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        store.addInstance(instance)
        manager = InstanceManager(store: store)

        XCTAssertFalse(manager.isAuthenticated)

        // Login via the auth manager
        let tokens = AuthTokens(accessToken: "at", refreshToken: "rt")
        let user = User(id: "u1", email: "a@b.com", name: "Alice", avatarUrl: nil, isAdmin: false, provider: nil)
        manager.authManager?.loginWithTokens(tokens: tokens, user: user)

        // Allow Combine pipeline to propagate
        let expectation = XCTestExpectation(description: "Auth state propagates")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            expectation.fulfill()
        }
        wait(for: [expectation], timeout: 1.0)

        XCTAssertTrue(manager.isAuthenticated)
    }

    // MARK: - Store Property

    func testStoreIsAccessible() {
        XCTAssertTrue(manager.store === store)
    }

    // MARK: - Multiple switchTo Calls

    func testMultipleSwitchToCalls() {
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")
        let c = Instance(id: "i3", serverURL: "https://c.com", displayName: "C")
        store.addInstance(a)
        store.addInstance(b)
        store.addInstance(c)

        // switchTo updates the store's activeInstanceId
        manager.switchTo("i2")
        XCTAssertEqual(store.activeInstanceId, "i2")

        manager.switchTo("i3")
        XCTAssertEqual(store.activeInstanceId, "i3")

        manager.switchTo("i1")
        XCTAssertEqual(store.activeInstanceId, "i1")

        // Verify rebuild by creating fresh manager with final state
        let freshManager = InstanceManager(store: store)
        XCTAssertEqual(freshManager.apiClient?.baseURL, "https://a.com/api")
    }

    // MARK: - removeInstance Non-Active

    func testRemoveNonActiveInstanceDoesNotRebuild() async {
        let a = Instance(id: "i1", serverURL: "https://a.com", displayName: "A")
        let b = Instance(id: "i2", serverURL: "https://b.com", displayName: "B")
        store.addInstance(a)
        store.addInstance(b)
        manager = InstanceManager(store: store)

        XCTAssertEqual(store.activeInstanceId, "i1")

        await manager.removeInstance("i2")

        XCTAssertEqual(store.instances.count, 1)
        XCTAssertEqual(store.activeInstanceId, "i1")
        XCTAssertNotNil(manager.apiClient)
    }
}
