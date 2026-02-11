import SwiftUI
import ObjectiveC

// MARK: - Multipath TCP VPN Fix
// LiveKit SDK sets multipathServiceType = .handover on its WebSocket URLSession,
// which breaks connections over VPN tunnels. Swizzle the setter to force .none.

#if os(iOS) || os(visionOS)
extension URLSessionConfiguration {
    @objc dynamic func _bedrud_setMultipathServiceType(_ type: URLSessionConfiguration.MultipathServiceType) {
        // After swizzle, this calls the original setter — but always with .none
        _bedrud_setMultipathServiceType(.none)
    }

    static let _applyMultipathFix: Void = {
        guard let original = class_getInstanceMethod(URLSessionConfiguration.self, #selector(setter: multipathServiceType)),
              let swizzled = class_getInstanceMethod(URLSessionConfiguration.self, #selector(_bedrud_setMultipathServiceType(_:)))
        else { return }
        method_exchangeImplementations(original, swizzled)
    }()
}
#endif

@main
struct BedrudApp: App {
    @StateObject private var instanceStore: InstanceStore
    @StateObject private var instanceManager: InstanceManager
    @StateObject private var settingsStore = SettingsStore()

    init() {
        #if os(iOS) || os(visionOS)
        URLSessionConfiguration._applyMultipathFix
        #endif

        let store = InstanceStore()
        MigrationManager.migrateIfNeeded(store: store)
        _instanceStore = StateObject(wrappedValue: store)
        _instanceManager = StateObject(wrappedValue: InstanceManager(store: store))
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if instanceManager.isAuthenticated {
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
