import SwiftUI

@main
struct BedrudApp: App {
    @StateObject private var instanceStore: InstanceStore
    @StateObject private var instanceManager: InstanceManager
    @StateObject private var settingsStore = SettingsStore()

    init() {
        let store = InstanceStore()
        MigrationManager.migrateIfNeeded(store: store)
        _instanceStore = StateObject(wrappedValue: store)
        _instanceManager = StateObject(wrappedValue: InstanceManager(store: store))
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if !settingsStore.hasCompletedOnboarding {
                    OnboardingView()
                } else if instanceManager.isAuthenticated {
                    MainTabView()
                } else {
                    NavigationStack {
                        AddInstanceView()
                    }
                }
            }
            .environmentObject(instanceManager)
            .environmentObject(instanceStore)
            .environmentObject(settingsStore)
            .preferredColorScheme(settingsStore.appearance.colorScheme)
        }
        #if os(macOS)
        .defaultSize(width: 900, height: 650)
        #endif
    }
}
