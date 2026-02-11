package com.bedrud.app.ui.screens.settings

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class AppAppearance(val label: String) {
    SYSTEM("System"),
    LIGHT("Light"),
    DARK("Dark");
}

class SettingsStore(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("bedrud_settings", Context.MODE_PRIVATE)

    private val _appearance = MutableStateFlow(loadAppearance())
    val appearance: StateFlow<AppAppearance> = _appearance.asStateFlow()

    private val _notificationsEnabled = MutableStateFlow(
        prefs.getBoolean(KEY_NOTIFICATIONS, true)
    )
    val notificationsEnabled: StateFlow<Boolean> = _notificationsEnabled.asStateFlow()

    fun setAppearance(value: AppAppearance) {
        prefs.edit().putString(KEY_APPEARANCE, value.name).apply()
        _appearance.value = value
    }

    fun setNotificationsEnabled(value: Boolean) {
        prefs.edit().putBoolean(KEY_NOTIFICATIONS, value).apply()
        _notificationsEnabled.value = value
    }

    private fun loadAppearance(): AppAppearance {
        val raw = prefs.getString(KEY_APPEARANCE, AppAppearance.SYSTEM.name)
        return try {
            AppAppearance.valueOf(raw ?: AppAppearance.SYSTEM.name)
        } catch (_: Exception) {
            AppAppearance.SYSTEM
        }
    }

    companion object {
        private const val KEY_APPEARANCE = "bedrud_appearance"
        private const val KEY_NOTIFICATIONS = "bedrud_notifications_enabled"
    }
}
