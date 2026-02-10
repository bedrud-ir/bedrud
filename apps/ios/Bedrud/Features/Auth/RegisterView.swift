import SwiftUI

struct RegisterView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var isPasskeyLoading = false

    private var authManager: AuthManager? { instanceManager.authManager }
    private var passkeyManager: PasskeyManager? { instanceManager.passkeyManager }

    private var isFormValid: Bool {
        !name.isEmpty && !email.isEmpty && !password.isEmpty &&
        password == confirmPassword && password.count >= 6
    }

    private var passwordMismatch: Bool {
        !confirmPassword.isEmpty && password != confirmPassword
    }

    var body: some View {
        Form {
            // Header
            Section {
                VStack(spacing: 10) {
                    Image(systemName: "person.badge.plus")
                        .font(.system(size: 48, weight: .light))
                        .foregroundStyle(.tint)

                    Text("Create Account")
                        .font(.largeTitle.bold())

                    Text("Join Bedrud to start video conferencing")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
                .listRowBackground(Color.clear)
            }

            // Account details
            Section("Account") {
                TextField("Name", text: $name)
                    .textContentType(.name)
                    .autocorrectionDisabled()

                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
            }

            // Password
            Section {
                SecureField("Password", text: $password)
                    .textContentType(.newPassword)

                SecureField("Confirm Password", text: $confirmPassword)
                    .textContentType(.newPassword)
            } header: {
                Text("Password")
            } footer: {
                VStack(alignment: .leading, spacing: 4) {
                    if passwordMismatch {
                        Label("Passwords do not match", systemImage: "xmark.circle")
                            .foregroundStyle(.red)
                    }
                    if !password.isEmpty && password.count < 6 {
                        Label("At least 6 characters required", systemImage: "info.circle")
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Error
            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "xmark.circle.fill")
                        .foregroundStyle(.red)
                        .font(.footnote)
                }
            }

            // Create Account button
            Section {
                Button(action: performRegister) {
                    Group {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Create Account")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .font(.body.bold())
                }
                .disabled(!isFormValid || isLoading || isPasskeyLoading)
            }

            // Passkey signup
            Section {
                Button(action: performPasskeySignup) {
                    HStack(spacing: 8) {
                        if isPasskeyLoading {
                            ProgressView()
                        } else {
                            Image(systemName: "person.badge.key.fill")
                        }
                        Text("Sign up with Passkey")
                    }
                    .frame(maxWidth: .infinity)
                }
                .disabled(name.isEmpty || email.isEmpty || isLoading || isPasskeyLoading)
            } header: {
                HStack {
                    VStack { Divider() }
                    Text("or")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    VStack { Divider() }
                }
                .padding(.bottom, 4)
            } footer: {
                Text("Create an account using a passkey instead of a password.")
            }

            // Back to sign in
            Section {
                HStack {
                    Spacer()
                    Text("Already have an account?")
                        .foregroundStyle(.secondary)
                    Button("Sign In") {
                        dismiss()
                    }
                    .bold()
                    Spacer()
                }
                .font(.footnote)
                .listRowBackground(Color.clear)
            }
        }
        .formStyle(.grouped)
        .scrollDismissesKeyboard(.interactively)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Actions

    private func performRegister() {
        guard isFormValid else { return }
        guard let authManager else {
            errorMessage = "Not connected to a server. Please go back and select one."
            return
        }
        isLoading = true
        errorMessage = nil

        Task {
            do {
                _ = try await authManager.register(
                    email: email,
                    password: password,
                    name: name
                )
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func performPasskeySignup() {
        guard !name.isEmpty, !email.isEmpty, let passkeyManager else { return }

        guard let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first?.windows.first
        else { return }

        isPasskeyLoading = true
        errorMessage = nil

        Task {
            do {
                _ = try await passkeyManager.signup(
                    email: email,
                    name: name,
                    anchor: window
                )
            } catch PasskeyError.cancelled {
                // User cancelled — no error
            } catch {
                errorMessage = error.localizedDescription
            }
            isPasskeyLoading = false
        }
    }
}
