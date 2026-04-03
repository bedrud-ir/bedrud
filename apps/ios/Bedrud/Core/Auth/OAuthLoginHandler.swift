import Foundation
import AuthenticationServices

// MARK: - OAuth Provider

enum OAuthProvider: String, CaseIterable {
    case google  = "google"
    case github  = "github"
    case twitter = "twitter"

    var label: String {
        switch self {
        case .google:  return "Continue with Google"
        case .github:  return "Continue with GitHub"
        case .twitter: return "Continue with Twitter / X"
        }
    }

    var systemImage: String {
        switch self {
        case .google:  return "g.circle.fill"
        case .github:  return "chevron.left.forwardslash.chevron.right"
        case .twitter: return "bird"
        }
    }
}

// MARK: - OAuthLoginHandler

/// Launches an OAuth flow via ASWebAuthenticationSession.
///
/// Flow:
///   1. Opens {serverURL}/api/auth/{provider}/login in an in-app browser.
///   2. Server authenticates with provider and redirects to
///      {frontendURL}/auth/callback?token=...
///   3. With frontendURL = "bedrud://oauth" the OS delivers the callback
///      to this session as bedrud://oauth/auth/callback?token=...
///   4. We extract the token and call AuthManager.loginWithOAuth(accessToken:).
@MainActor
final class OAuthLoginHandler: NSObject {

    static let callbackScheme = "bedrud"

    // Stored at launch time so the nonisolated protocol method can access it safely.
    // nonisolated(unsafe) is correct here: anchor is written before the session starts
    // and read only during the session's lifetime on whatever thread the OS chooses.
    nonisolated(unsafe) private var anchor: ASPresentationAnchor = ASPresentationAnchor()

    /// Launches the OAuth flow for the given provider.
    /// Returns the access token on success.
    func launch(
        provider: OAuthProvider,
        serverURL: String,
        presentationAnchor: ASPresentationAnchor
    ) async throws -> String {
        self.anchor = presentationAnchor
        let authURL = buildAuthURL(serverURL: serverURL, provider: provider)

        return try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: authURL,
                callbackURLScheme: Self.callbackScheme
            ) { callbackURL, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let callbackURL,
                      let token = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
                          .queryItems?.first(where: { $0.name == "token" })?.value
                else {
                    continuation.resume(throwing: OAuthError.missingToken)
                    return
                }
                continuation.resume(returning: token)
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            session.start()
        }
    }

    private func buildAuthURL(serverURL: String, provider: OAuthProvider) -> URL {
        let base = serverURL.hasSuffix("/") ? String(serverURL.dropLast()) : serverURL
        return URL(string: "\(base)/api/auth/\(provider.rawValue)/login")!
    }
}

// MARK: - ASWebAuthenticationPresentationContextProviding

extension OAuthLoginHandler: ASWebAuthenticationPresentationContextProviding {
    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        // anchor is set from main actor before ASWebAuthenticationSession starts.
        // Accessing the stored value here is safe because the session hasn't begun yet.
        anchor
    }
}

// MARK: - Errors

enum OAuthError: LocalizedError {
    case missingToken

    var errorDescription: String? {
        switch self {
        case .missingToken: return "OAuth callback did not include an access token."
        }
    }
}
