import AuthenticationServices
import Foundation

// MARK: - Passkey Manager

@MainActor
final class PasskeyManager: NSObject, ObservableObject {
    private let authAPI: AuthAPI
    private let authManager: AuthManager

    // Retain delegate and presentation provider while authorization is in-flight.
    // ASAuthorizationController holds these weakly, so they must be kept alive here.
    private var activeDelegate: PasskeyDelegate?
    private var activePresentationProvider: PasskeyPresentationProvider?

    @Published private(set) var isProcessing: Bool = false
    @Published private(set) var error: String?

    init(authAPI: AuthAPI, authManager: AuthManager) {
        self.authAPI = authAPI
        self.authManager = authManager
        super.init()
    }

    // MARK: - Passkey Login

    func login(anchor: ASPresentationAnchor) async throws -> User {
        isProcessing = true
        error = nil
        defer { isProcessing = false }

        // Step 1: Get challenge from server
        let beginResponse = try await authAPI.passkeyLoginBegin()

        guard let challengeData = Data(base64URLEncoded: beginResponse.challenge) else {
            throw PasskeyError.invalidChallenge
        }

        // Step 2: Create the assertion request
        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(
            relyingPartyIdentifier: beginResponse.rpId ?? ""
        )

        let assertionRequest = provider.createCredentialAssertionRequest(
            challenge: challengeData
        )

        // Step 3: Perform the authorization
        let delegate = PasskeyDelegate()
        let presentationProvider = PasskeyPresentationProvider(anchor: anchor)
        activeDelegate = delegate
        activePresentationProvider = presentationProvider

        let controller = ASAuthorizationController(authorizationRequests: [assertionRequest])
        controller.delegate = delegate
        controller.presentationContextProvider = presentationProvider
        controller.performRequests()

        let authorization = try await delegate.result()
        activeDelegate = nil
        activePresentationProvider = nil

        // Step 4: Extract credential data
        guard let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion else {
            throw PasskeyError.invalidCredential
        }

        let finishData: [String: String] = [
            "credentialId": credential.credentialID.base64URLEncodedString(),
            "clientDataJSON": credential.rawClientDataJSON.base64URLEncodedString(),
            "authenticatorData": credential.rawAuthenticatorData.base64URLEncodedString(),
            "signature": credential.signature.base64URLEncodedString(),
        ]

        // Step 5: Complete login on server
        let loginResponse = try await authAPI.passkeyLoginFinish(data: finishData)

        // Step 6: Store tokens and user
        let user = User(
            id: loginResponse.user.id,
            email: loginResponse.user.email,
            name: loginResponse.user.name,
            avatarUrl: loginResponse.user.avatarUrl,
            isAdmin: loginResponse.user.isAdmin ?? false,
            provider: nil
        )
        authManager.loginWithTokens(tokens: loginResponse.tokens, user: user)

        return user
    }

    // MARK: - Passkey Registration (for already authenticated users)

    func register(anchor: ASPresentationAnchor) async throws {
        isProcessing = true
        error = nil
        defer { isProcessing = false }

        // Step 1: Get registration options from server
        let beginResponse = try await authAPI.passkeyRegisterBegin(authManager: authManager)

        guard let challengeData = Data(base64URLEncoded: beginResponse.challenge),
              let userInfo = beginResponse.user,
              let userIdData = Data(base64URLEncoded: userInfo.id)
        else {
            throw PasskeyError.invalidChallenge
        }

        // Step 2: Create the registration request
        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(
            relyingPartyIdentifier: beginResponse.rp?.id ?? ""
        )

        let registrationRequest = provider.createCredentialRegistrationRequest(
            challenge: challengeData,
            name: userInfo.name,
            userID: userIdData
        )

        // Step 3: Perform the authorization
        let delegate = PasskeyDelegate()
        let presentationProvider = PasskeyPresentationProvider(anchor: anchor)
        activeDelegate = delegate
        activePresentationProvider = presentationProvider

        let controller = ASAuthorizationController(authorizationRequests: [registrationRequest])
        controller.delegate = delegate
        controller.presentationContextProvider = presentationProvider
        controller.performRequests()

        let authorization = try await delegate.result()
        activeDelegate = nil
        activePresentationProvider = nil

        // Step 4: Extract credential data
        guard let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration else {
            throw PasskeyError.invalidCredential
        }

        guard let attestationObject = credential.rawAttestationObject else {
            throw PasskeyError.invalidCredential
        }

        let finishData: [String: String] = [
            "clientDataJSON": credential.rawClientDataJSON.base64URLEncodedString(),
            "attestationObject": attestationObject.base64URLEncodedString(),
        ]

        // Step 5: Complete registration on server
        _ = try await authAPI.passkeyRegisterFinish(data: finishData, authManager: authManager)
    }

    // MARK: - Passkey Signup (new user)

    func signup(email: String, name: String, anchor: ASPresentationAnchor) async throws -> User {
        isProcessing = true
        error = nil
        defer { isProcessing = false }

        // Step 1: Begin signup
        let beginResponse = try await authAPI.passkeySignupBegin(email: email, name: name)

        guard let challengeData = Data(base64URLEncoded: beginResponse.challenge),
              let userInfo = beginResponse.user,
              let userIdData = Data(base64URLEncoded: userInfo.id)
        else {
            throw PasskeyError.invalidChallenge
        }

        // Step 2: Create the registration request
        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(
            relyingPartyIdentifier: beginResponse.rp?.id ?? ""
        )

        let registrationRequest = provider.createCredentialRegistrationRequest(
            challenge: challengeData,
            name: userInfo.name,
            userID: userIdData
        )

        // Step 3: Perform the authorization
        let delegate = PasskeyDelegate()
        let presentationProvider = PasskeyPresentationProvider(anchor: anchor)
        activeDelegate = delegate
        activePresentationProvider = presentationProvider

        let controller = ASAuthorizationController(authorizationRequests: [registrationRequest])
        controller.delegate = delegate
        controller.presentationContextProvider = presentationProvider
        controller.performRequests()

        let authorization = try await delegate.result()
        activeDelegate = nil
        activePresentationProvider = nil

        // Step 4: Extract credential data
        guard let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration else {
            throw PasskeyError.invalidCredential
        }

        guard let attestationObject = credential.rawAttestationObject else {
            throw PasskeyError.invalidCredential
        }

        let finishData: [String: String] = [
            "clientDataJSON": credential.rawClientDataJSON.base64URLEncodedString(),
            "attestationObject": attestationObject.base64URLEncodedString(),
        ]

        // Step 5: Complete signup on server
        let loginResponse = try await authAPI.passkeySignupFinish(data: finishData)

        // Step 6: Store tokens and return user
        let user = User(
            id: loginResponse.user.id,
            email: loginResponse.user.email,
            name: loginResponse.user.name,
            avatarUrl: loginResponse.user.avatarUrl,
            isAdmin: loginResponse.user.isAdmin ?? false,
            provider: nil
        )
        authManager.loginWithTokens(tokens: loginResponse.tokens, user: user)

        return user
    }
}

// MARK: - Errors

enum PasskeyError: LocalizedError {
    case invalidChallenge
    case invalidCredential
    case authorizationFailed(Error)
    case cancelled

    var errorDescription: String? {
        switch self {
        case .invalidChallenge:
            return "Invalid passkey challenge from server"
        case .invalidCredential:
            return "Invalid credential response"
        case .authorizationFailed(let error):
            return "Authorization failed: \(error.localizedDescription)"
        case .cancelled:
            return "Passkey operation was cancelled"
        }
    }
}

// MARK: - ASAuthorizationController Delegate

private final class PasskeyDelegate: NSObject, ASAuthorizationControllerDelegate {
    private var continuation: CheckedContinuation<ASAuthorizationResult, Error>?

    func result() async throws -> ASAuthorizationResult {
        try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
        }
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        continuation?.resume(returning: ASAuthorizationResult(credential: authorization.credential))
        continuation = nil
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        if let authError = error as? ASAuthorizationError, authError.code == .canceled {
            continuation?.resume(throwing: PasskeyError.cancelled)
        } else {
            continuation?.resume(throwing: PasskeyError.authorizationFailed(error))
        }
        continuation = nil
    }
}

// MARK: - Result Wrapper

struct ASAuthorizationResult {
    let credential: ASAuthorizationCredential
}

// MARK: - Presentation Context Provider

private final class PasskeyPresentationProvider: NSObject, ASAuthorizationControllerPresentationContextProviding {
    let anchor: ASPresentationAnchor

    init(anchor: ASPresentationAnchor) {
        self.anchor = anchor
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        anchor
    }
}

// MARK: - Base64URL Data Extensions

extension Data {
    init?(base64URLEncoded string: String) {
        var base64 = string
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")

        let remainder = base64.count % 4
        if remainder > 0 {
            base64 += String(repeating: "=", count: 4 - remainder)
        }

        self.init(base64Encoded: base64)
    }

    func base64URLEncodedString() -> String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
