import SwiftUI
import AuthenticationServices

/// Renders OAuth sign-in buttons (Google / GitHub / Twitter) and drives the flow.
struct OAuthButtons: View {
    @EnvironmentObject private var instanceManager: InstanceManager

    @State private var activeProvider: OAuthProvider?
    @State private var errorMessage: String?

    private var authManager: AuthManager? { instanceManager.authManager }
    private let handler = OAuthLoginHandler()

    var body: some View {
        Section {
            ForEach(OAuthProvider.allCases, id: \.self) { provider in
                Button {
                    performOAuth(provider: provider)
                } label: {
                    HStack(spacing: 10) {
                        if activeProvider == provider {
                            ProgressView()
                                .frame(width: 20, height: 20)
                        } else {
                            Image(systemName: provider.systemImage)
                                .frame(width: 20, height: 20)
                        }
                        Text(provider.label)
                    }
                    .frame(maxWidth: .infinity)
                }
                .disabled(activeProvider != nil)
            }

            if let errorMessage {
                Label(errorMessage, systemImage: "xmark.circle.fill")
                    .foregroundStyle(.red)
                    .font(.footnote)
            }
        } header: {
            HStack {
                VStack { Divider() }
                Text("or sign in with")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                VStack { Divider() }
            }
        }
    }

    // MARK: - Action

    private func performOAuth(provider: OAuthProvider) {
        guard let authManager,
              let serverURL = instanceManager.store.activeInstance?.serverURL
        else { return }

        activeProvider = provider
        errorMessage = nil

        Task {
            defer { activeProvider = nil }
            do {
                #if os(iOS)
                guard let window = UIApplication.shared.connectedScenes
                    .compactMap({ $0 as? UIWindowScene })
                    .first?.windows.first
                else { return }
                #elseif os(macOS)
                guard let window = NSApplication.shared.keyWindow else { return }
                #endif

                let token = try await handler.launch(
                    provider: provider,
                    serverURL: serverURL,
                    presentationAnchor: window
                )
                _ = try await authManager.loginWithOAuth(accessToken: token)
                // isAuthenticated flips → root view transitions automatically
            } catch is CancellationError {
                // User cancelled — no error to show
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
