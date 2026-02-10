import SwiftUI

@main
struct BedrudApp: App {
    @StateObject private var instanceStore: InstanceStore
    @StateObject private var instanceManager: InstanceManager

    init() {
        let store = InstanceStore()
        MigrationManager.migrateIfNeeded(store: store)
        _instanceStore = StateObject(wrappedValue: store)
        _instanceManager = StateObject(wrappedValue: InstanceManager(store: store))
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if instanceManager.isAuthenticated {
                    DashboardView()
                } else {
                    NavigationStack {
                        AddInstanceView()
                    }
                }
            }
            .environmentObject(instanceManager)
            .environmentObject(instanceStore)
        }
    }
}
