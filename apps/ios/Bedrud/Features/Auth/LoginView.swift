import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var instanceManager: InstanceManager

    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var isPasskeyLoading = false
    @State private var showRegister = false

    private var authManager: AuthManager? { instanceManager.authManager }
    private var passkeyManager: PasskeyManager? { instanceManager.passkeyManager }

    var body: some View {
        Form {
            // Header
            Section {
                VStack(spacing: 10) {
                    if let instance = instanceManager.store.activeInstance {
                        ServerIconView(
                            serverURL: instance.serverURL,
                            displayName: instance.displayName,
                            fallbackColor: .accentColor,
                            size: 56
                        )
                    } else {
                        Image(systemName: "video.fill")
                            .font(.system(size: 48, weight: .light))
                            .foregroundStyle(.tint)
                    }

                    Text("Sign In")
                        .font(.largeTitle.bold())

                    if let instance = instanceManager.store.activeInstance {
                        Text(instance.displayName)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
                .listRowBackground(Color.clear)
            }

            // Credentials
            Section {
                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .autocorrectionDisabled()
                    #if os(iOS)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    #endif

                SecureField("Password", text: $password)
                    .textContentType(.password)
            }

            // Error
            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "xmark.circle.fill")
                        .foregroundStyle(.red)
                        .font(.footnote)
                }
            }

            // Sign In button
            Section {
                Button(action: performLogin) {
                    Group {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Sign In")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .font(.body.bold())
                }
                .disabled(isLoading || isPasskeyLoading || email.isEmpty || password.isEmpty)
            }

            // Passkey
            Section {
                Button(action: performPasskeyLogin) {
                    HStack(spacing: 8) {
                        if isPasskeyLoading {
                            ProgressView()
                        } else {
                            Image(systemName: "person.badge.key.fill")
                        }
                        Text("Sign in with Passkey")
                    }
                    .frame(maxWidth: .infinity)
                }
                .disabled(isLoading || isPasskeyLoading)
            } header: {
                HStack {
                    VStack { Divider() }
                    Text("or")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    VStack { Divider() }
                }
                .padding(.bottom, 4)
            }

            // Register link
            Section {
                HStack {
                    Spacer()
                    Text("Don't have an account?")
                        .foregroundStyle(.secondary)
                    Button("Sign Up") {
                        showRegister = true
                    }
                    .bold()
                    Spacer()
                }
                .font(.footnote)
                .listRowBackground(Color.clear)
            }
        }
        .formStyle(.grouped)
        #if os(iOS)
        .scrollDismissesKeyboard(.interactively)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .navigationDestination(isPresented: $showRegister) {
            RegisterView()
        }
    }

    // MARK: - Actions

    private func performLogin() {
        guard !email.isEmpty, !password.isEmpty else { return }
        guard let authManager else {
            errorMessage = "Not connected to a server. Please go back and select one."
            return
        }
        isLoading = true
        errorMessage = nil

        Task {
            do {
                _ = try await authManager.login(email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func performPasskeyLogin() {
        guard let passkeyManager else { return }

        #if os(iOS)
        guard let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first?.windows.first
        else { return }
        #elseif os(macOS)
        guard let window = NSApplication.shared.keyWindow else { return }
        #endif

        isPasskeyLoading = true
        errorMessage = nil

        Task {
            do {
                _ = try await passkeyManager.login(anchor: window)
            } catch PasskeyError.cancelled {
                // User cancelled — no error
            } catch {
                errorMessage = error.localizedDescription
            }
            isPasskeyLoading = false
        }
    }
}
