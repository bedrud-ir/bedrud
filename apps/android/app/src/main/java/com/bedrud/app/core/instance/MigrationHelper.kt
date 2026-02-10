package com.bedrud.app.core.instance

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.bedrud.app.models.Instance

object MigrationHelper {

    private const val MIGRATION_DONE_KEY = "bedrud_migration_v1_done"
    private const val OLD_PREFS_FILE = "bedrud_secure_prefs"

    fun migrateIfNeeded(context: Context, store: InstanceStore) {
        val mainPrefs = context.getSharedPreferences("bedrud_migration", Context.MODE_PRIVATE)
        if (mainPrefs.getBoolean(MIGRATION_DONE_KEY, false)) return

        mainPrefs.edit().putBoolean(MIGRATION_DONE_KEY, true).apply()

        // Try to read old prefs
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        val oldPrefs: SharedPreferences = try {
            EncryptedSharedPreferences.create(
                context,
                OLD_PREFS_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            return
        }

        val accessToken = oldPrefs.getString("access_token", null)
        if (accessToken.isNullOrBlank()) return

        // Create default instance
        val instance = Instance(
            serverURL = "https://bedrud.com",
            displayName = "Bedrud"
        )
        store.addInstance(instance)
        store.setActive(instance.id)

        // Copy tokens to new per-instance prefs file
        val newPrefs: SharedPreferences = EncryptedSharedPreferences.create(
            context,
            "bedrud_secure_${instance.id}",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )

        newPrefs.edit()
            .putString("access_token", accessToken)
            .putString("refresh_token", oldPrefs.getString("refresh_token", null))
            .putString("user", oldPrefs.getString("user", null))
            .apply()

        // Clear old prefs
        oldPrefs.edit().clear().apply()
    }
}
