package com.bedrud.app.core.auth

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent

/**
 * Handles OAuth login flows via Chrome Custom Tabs.
 *
 * Flow:
 *   1. [launch] opens {serverURL}/api/auth/{provider}/login in a Custom Tab.
 *   2. The OAuth provider authenticates the user and redirects back to the server.
 *   3. The server redirects to {frontendURL}/auth/callback?token=... — if the
 *      frontendURL is configured as "bedrud://oauth" on the server side, the
 *      Android OS delivers the intent to MainActivity via the registered intent filter.
 *   4. MainActivity calls [extractToken] to parse the token from the intent URI.
 *   5. The token is saved via AuthManager and /auth/me is called to get the user.
 *
 * Server-side requirement:
 *   Set AUTH_FRONTEND_URL=bedrud://oauth in the server config so the OAuth
 *   callback redirects to bedrud://oauth/auth/callback?token=... instead of
 *   the web frontend URL.
 */
object OAuthLoginHandler {

    enum class Provider(val id: String, val label: String) {
        GOOGLE("google", "Continue with Google"),
        GITHUB("github", "Continue with GitHub"),
        TWITTER("twitter", "Continue with Twitter / X")
    }

    /**
     * Opens the OAuth login flow for [provider] in a Chrome Custom Tab.
     * After authentication, the OS will deliver the callback intent to
     * MainActivity (matching the bedrud://oauth intent filter).
     */
    fun launch(context: Context, serverUrl: String, provider: Provider) {
        val authUrl = buildAuthUrl(serverUrl, provider)
        val customTab = CustomTabsIntent.Builder()
            .setShareState(CustomTabsIntent.SHARE_STATE_OFF)
            .build()
        customTab.launchUrl(context, Uri.parse(authUrl))
    }

    /**
     * Extracts the OAuth access token from a deep-link callback intent.
     * Returns null if the intent is not an OAuth callback or the token is missing.
     *
     * Expected URI: bedrud://oauth/auth/callback?token={accessToken}
     */
    fun extractToken(intent: Intent?): String? {
        val uri = intent?.data ?: return null
        if (!isOAuthCallback(uri)) return null
        return uri.getQueryParameter("token")
    }

    /** Returns true if [uri] matches the OAuth callback pattern. */
    fun isOAuthCallback(uri: Uri): Boolean {
        return (uri.scheme == "bedrud" && uri.host == "oauth") ||
            uri.toString().contains("/auth/callback") && uri.getQueryParameter("token") != null
    }

    private fun buildAuthUrl(serverUrl: String, provider: Provider): String {
        val base = serverUrl.trimEnd('/')
        return "$base/api/auth/${provider.id}/login"
    }
}
