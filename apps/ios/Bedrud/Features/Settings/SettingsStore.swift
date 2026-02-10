import SwiftUI

// MARK: - Appearance

enum AppAppearance: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var label: String {
        switch self {
        case .system: return "System"
        case .light: return "Light"
        case .dark: return "Dark"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

// MARK: - Settings Store

@MainActor
final class SettingsStore: ObservableObject {
    private let defaults: UserDefaults

    @Published var appearance: AppAppearance {
        didSet { defaults.set(appearance.rawValue, forKey: Keys.appearance) }
    }

    @Published var notificationsEnabled: Bool {
        didSet { defaults.set(notificationsEnabled, forKey: Keys.notifications) }
    }

    private enum Keys {
        static let appearance = "bedrud_appearance"
        static let notifications = "bedrud_notifications_enabled"
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults

        let rawAppearance = defaults.string(forKey: Keys.appearance) ?? AppAppearance.system.rawValue
        self.appearance = AppAppearance(rawValue: rawAppearance) ?? .system
        self.notificationsEnabled = defaults.object(forKey: Keys.notifications) as? Bool ?? true
    }
}
