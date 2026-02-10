import Foundation
import KeychainAccess

/// Migrates old flat Keychain keys (from single-instance builds) to the
/// prefixed format used by the multi-instance architecture.
///
/// Old keys: "access_token", "refresh_token", "user_data"
/// New keys: "{instanceId}_access_token", etc.
enum MigrationManager {

    private static let migrationDoneKey = "bedrud_migration_v1_done"

    @MainActor
    static func migrateIfNeeded(
        store: InstanceStore,
        defaults: UserDefaults = .standard,
        keychain: Keychain = Keychain(service: "com.bedrud.ios")
    ) {
        guard !defaults.bool(forKey: migrationDoneKey) else { return }
        defer { defaults.set(true, forKey: migrationDoneKey) }

        // Check if old-style tokens exist
        guard let accessToken = keychain["access_token"],
              !accessToken.isEmpty
        else { return }

        // Create a default instance pointing to bedrud.com
        let instance = Instance(
            serverURL: "https://bedrud.com",
            displayName: "Bedrud"
        )
        store.addInstance(instance)
        store.setActive(instance.id)

        // Move tokens to prefixed keys
        keychain["\(instance.id)_access_token"] = keychain["access_token"]
        keychain["\(instance.id)_refresh_token"] = keychain["refresh_token"]
        keychain["\(instance.id)_user_data"] = keychain["user_data"]

        // Remove old keys
        keychain["access_token"] = nil
        keychain["refresh_token"] = nil
        keychain["user_data"] = nil
    }
}
