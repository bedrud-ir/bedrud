package com.bedrud.app.models

data class Instance(
    val id: String = java.util.UUID.randomUUID().toString(),
    val serverURL: String,
    val displayName: String,
    val iconColorHex: String = randomColor(),
    val addedAt: Long = System.currentTimeMillis()
) {
    val apiBaseURL: String
        get() {
            val base = if (serverURL.endsWith("/")) serverURL else "$serverURL/"
            return "${base}api"
        }
}

data class Account(
    val instanceId: String,
    val userId: String? = null,
    val userName: String? = null,
    val userEmail: String? = null,
    val isLoggedIn: Boolean = false
)

data class HealthResponse(
    val status: String? = null,
    val version: String? = null
)

private fun randomColor(): String {
    val colors = listOf("#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316")
    return colors.random()
}
