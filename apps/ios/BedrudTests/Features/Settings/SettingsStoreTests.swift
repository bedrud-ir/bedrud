import XCTest
@testable import Bedrud

@MainActor
final class SettingsStoreTests: XCTestCase {
    private var defaults: UserDefaults!

    override func setUp() {
        super.setUp()
        let suiteName = "com.bedrud.tests.settings.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)!
    }

    override func tearDown() {
        defaults = nil
        super.tearDown()
    }

    // MARK: - Init Defaults

    func testInitDefaultsToSystemAppearance() {
        let store = SettingsStore(defaults: defaults)
        XCTAssertEqual(store.appearance, .system)
    }

    func testInitDefaultsToNotificationsEnabled() {
        let store = SettingsStore(defaults: defaults)
        XCTAssertTrue(store.notificationsEnabled)
    }

    // MARK: - Appearance Persistence

    func testAppearanceChangeIsPersisted() {
        let store = SettingsStore(defaults: defaults)
        store.appearance = .dark

        let store2 = SettingsStore(defaults: defaults)
        XCTAssertEqual(store2.appearance, .dark)
    }

    func testAppearanceLightPersisted() {
        let store = SettingsStore(defaults: defaults)
        store.appearance = .light

        let store2 = SettingsStore(defaults: defaults)
        XCTAssertEqual(store2.appearance, .light)
    }

    func testAppearanceSystemPersisted() {
        let store = SettingsStore(defaults: defaults)
        store.appearance = .dark
        store.appearance = .system

        let store2 = SettingsStore(defaults: defaults)
        XCTAssertEqual(store2.appearance, .system)
    }

    // MARK: - Notifications Persistence

    func testNotificationsDisabledIsPersisted() {
        let store = SettingsStore(defaults: defaults)
        store.notificationsEnabled = false

        let store2 = SettingsStore(defaults: defaults)
        XCTAssertFalse(store2.notificationsEnabled)
    }

    func testNotificationsReenabledIsPersisted() {
        let store = SettingsStore(defaults: defaults)
        store.notificationsEnabled = false
        store.notificationsEnabled = true

        let store2 = SettingsStore(defaults: defaults)
        XCTAssertTrue(store2.notificationsEnabled)
    }

    // MARK: - Invalid Appearance Value

    func testInvalidAppearanceStringFallsBackToSystem() {
        defaults.set("invalid_value", forKey: "bedrud_appearance")

        let store = SettingsStore(defaults: defaults)
        XCTAssertEqual(store.appearance, .system)
    }

    // MARK: - AppAppearance

    func testAppAppearanceAllCases() {
        let cases = AppAppearance.allCases
        XCTAssertEqual(cases.count, 3)
        XCTAssertTrue(cases.contains(.system))
        XCTAssertTrue(cases.contains(.light))
        XCTAssertTrue(cases.contains(.dark))
    }

    func testAppAppearanceLabels() {
        XCTAssertEqual(AppAppearance.system.label, "System")
        XCTAssertEqual(AppAppearance.light.label, "Light")
        XCTAssertEqual(AppAppearance.dark.label, "Dark")
    }

    func testAppAppearanceColorScheme() {
        XCTAssertNil(AppAppearance.system.colorScheme)
        XCTAssertEqual(AppAppearance.light.colorScheme, .light)
        XCTAssertEqual(AppAppearance.dark.colorScheme, .dark)
    }

    func testAppAppearanceId() {
        XCTAssertEqual(AppAppearance.system.id, "system")
        XCTAssertEqual(AppAppearance.light.id, "light")
        XCTAssertEqual(AppAppearance.dark.id, "dark")
    }

    func testAppAppearanceRawValue() {
        XCTAssertEqual(AppAppearance(rawValue: "system"), .system)
        XCTAssertEqual(AppAppearance(rawValue: "light"), .light)
        XCTAssertEqual(AppAppearance(rawValue: "dark"), .dark)
        XCTAssertNil(AppAppearance(rawValue: "invalid"))
    }
}
