import Foundation
import Combine

@MainActor
final class InstanceManager: ObservableObject {
    let store: InstanceStore

    @Published private(set) var apiClient: APIClient?
    @Published private(set) var authAPI: AuthAPI?
    @Published private(set) var authManager: AuthManager?
    @Published private(set) var roomAPI: RoomAPI?
    @Published private(set) var passkeyManager: PasskeyManager?
    @Published private(set) var isAuthenticated: Bool = false

    private var cancellables = Set<AnyCancellable>()
    private var authCancellable: AnyCancellable?

    init(store: InstanceStore) {
        self.store = store

        // Re-build deps whenever the active instance changes
        store.$activeInstanceId
            .removeDuplicates()
            .sink { [weak self] _ in self?.rebuild() }
            .store(in: &cancellables)

        rebuild()
    }

    /// Validates that a server URL responds to /api/health.
    func checkHealth(serverURL: String) async throws -> HealthResponse {
        let url = serverURL.hasSuffix("/") ? "\(serverURL)api" : "\(serverURL)/api"
        let client = APIClient(baseURL: url)
        return try await client.fetch("/health")
    }

    /// Adds a new instance after health check passes, sets it active, and rebuilds.
    func addInstance(serverURL: String, displayName: String) async throws {
        _ = try await checkHealth(serverURL: serverURL)
        let instance = Instance(serverURL: serverURL, displayName: displayName)
        store.addInstance(instance)
        store.setActive(instance.id)
    }

    /// Switch to a different instance and rebuild all deps.
    func switchTo(_ instanceId: String) {
        store.setActive(instanceId)
    }

    /// Remove an instance, clearing its keychain data.
    func removeInstance(_ id: String) async {
        // Tear down auth if this is the active instance
        if store.activeInstanceId == id, let am = authManager {
            await am.logout()
        }
        store.removeInstance(id)
    }

    // MARK: - Private

    private func rebuild() {
        guard let instance = store.activeInstance else {
            apiClient = nil
            authAPI = nil
            authManager = nil
            roomAPI = nil
            passkeyManager = nil
            isAuthenticated = false
            authCancellable = nil
            return
        }

        let client = APIClient(baseURL: instance.apiBaseURL)
        let auth = AuthAPI(client: client)
        let am = AuthManager(instanceId: instance.id, authAPI: auth)
        let room = RoomAPI(client: client, authManager: am)
        let pk = PasskeyManager(authAPI: auth, authManager: am)

        self.apiClient = client
        self.authAPI = auth
        self.authManager = am
        self.roomAPI = room
        self.passkeyManager = pk

        // Relay auth state changes to trigger root view updates
        authCancellable = am.$isAuthenticated
            .receive(on: RunLoop.main)
            .sink { [weak self] value in
                self?.isAuthenticated = value
            }
        isAuthenticated = am.isAuthenticated
    }
}
