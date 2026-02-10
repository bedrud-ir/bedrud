import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var instanceManager: InstanceManager

    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var showRegister = false

    private var authManager: AuthManager? { instanceManager.authManager }
    private var passkeyManager: PasskeyManager? { instanceManager.passkeyManager }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "video.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(BedrudColors.primary)

                    Text("Sign In")
                        .font(BedrudTypography.largeTitle)
                        .foregroundStyle(BedrudColors.foreground)

                    if let instance = instanceManager.store.activeInstance {
                        Text(instance.displayName)
                            .font(BedrudTypography.subheadline)
                            .foregroundStyle(BedrudColors.mutedForeground)
                    }
                }
                .padding(.top, 40)
                .padding(.bottom, 20)

                // Form
                VStack(spacing: 16) {
                    // Email field
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Email")
                            .font(BedrudTypography.caption)
                            .foregroundStyle(BedrudColors.mutedForeground)

                        TextField("you@example.com", text: $email)
                            .textFieldStyle(BedrudTextFieldStyle())
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                    }

                    // Password field
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Password")
                            .font(BedrudTypography.caption)
                            .foregroundStyle(BedrudColors.mutedForeground)

                        SecureField("Enter your password", text: $password)
                            .textFieldStyle(BedrudTextFieldStyle())
                            .textContentType(.password)
                    }

                    // Error message
                    if let errorMessage {
                        Text(errorMessage)
                            .font(BedrudTypography.caption)
                            .foregroundStyle(BedrudColors.destructive)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    // Login button
                    Button(action: performLogin) {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Sign In")
                                .font(BedrudTypography.body.bold())
                        }
                    }
                    .buttonStyle(BedrudPrimaryButtonStyle())
                    .disabled(isLoading || email.isEmpty || password.isEmpty)

                    // Divider
                    HStack {
                        Rectangle()
                            .fill(BedrudColors.border)
                            .frame(height: 1)
                        Text("or")
                            .font(BedrudTypography.caption)
                            .foregroundStyle(BedrudColors.mutedForeground)
                        Rectangle()
                            .fill(BedrudColors.border)
                            .frame(height: 1)
                    }

                    // Passkey button
                    Button(action: performPasskeyLogin) {
                        HStack(spacing: 8) {
                            Image(systemName: "person.badge.key.fill")
                            Text("Sign in with Passkey")
                                .font(BedrudTypography.body)
                        }
                    }
                    .buttonStyle(BedrudSecondaryButtonStyle())
                    .disabled(passkeyManager?.isProcessing ?? true)
                }
                .padding(.horizontal, 24)

                // Register link
                HStack(spacing: 4) {
                    Text("Don't have an account?")
                        .font(BedrudTypography.footnote)
                        .foregroundStyle(BedrudColors.mutedForeground)

                    Button("Sign Up") {
                        showRegister = true
                    }
                    .font(BedrudTypography.footnote.bold())
                    .foregroundStyle(BedrudColors.primary)
                }
                .padding(.top, 8)

                Spacer()
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .background(BedrudColors.background)
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(isPresented: $showRegister) {
            RegisterView()
        }
    }

    // MARK: - Actions

    private func performLogin() {
        guard !email.isEmpty, !password.isEmpty, let authManager else { return }
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
        guard let passkeyManager,
              let window = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first?.windows.first
        else { return }

        Task {
            do {
                _ = try await passkeyManager.login(anchor: window)
            } catch PasskeyError.cancelled {
                // User cancelled, no error to show
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

// MARK: - Custom Styles

struct BedrudTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<_Label>) -> some View {
        configuration
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(BedrudColors.muted)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(BedrudColors.border, lineWidth: 1)
            )
            .font(BedrudTypography.body)
    }
}

struct BedrudPrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(isEnabled ? BedrudColors.primary : BedrudColors.muted)
            .foregroundStyle(isEnabled ? BedrudColors.primaryForeground : BedrudColors.mutedForeground)
            .cornerRadius(8)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
    }
}

struct BedrudSecondaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(BedrudColors.secondary)
            .foregroundStyle(BedrudColors.secondaryForeground)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(BedrudColors.border, lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.9 : 1.0)
    }
}
