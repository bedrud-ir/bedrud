import SwiftUI

struct RegisterView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var confirmPassword: String = ""
    @State private var errorMessage: String?
    @State private var isLoading: Bool = false

    private var authManager: AuthManager? { instanceManager.authManager }

    private var isFormValid: Bool {
        !name.isEmpty && !email.isEmpty && !password.isEmpty &&
        password == confirmPassword && password.count >= 6
    }

    private var passwordMismatch: Bool {
        !confirmPassword.isEmpty && password != confirmPassword
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "person.badge.plus")
                        .font(.system(size: 40))
                        .foregroundStyle(BedrudColors.primary)

                    Text("Create Account")
                        .font(BedrudTypography.title)
                        .foregroundStyle(BedrudColors.foreground)

                    Text("Join Bedrud to start video conferencing")
                        .font(BedrudTypography.subheadline)
                        .foregroundStyle(BedrudColors.mutedForeground)
                }
                .padding(.top, 40)
                .padding(.bottom, 12)

                // Form
                VStack(spacing: 16) {
                    // Name field
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Name")
                            .font(BedrudTypography.caption)
                            .foregroundStyle(BedrudColors.mutedForeground)

                        TextField("Your name", text: $name)
                            .textFieldStyle(BedrudTextFieldStyle())
                            .textContentType(.name)
                            .autocorrectionDisabled()
                    }

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

                        SecureField("At least 6 characters", text: $password)
                            .textFieldStyle(BedrudTextFieldStyle())
                            .textContentType(.newPassword)
                    }

                    // Confirm password field
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Confirm Password")
                            .font(BedrudTypography.caption)
                            .foregroundStyle(BedrudColors.mutedForeground)

                        SecureField("Repeat your password", text: $confirmPassword)
                            .textFieldStyle(BedrudTextFieldStyle())
                            .textContentType(.newPassword)

                        if passwordMismatch {
                            Text("Passwords do not match")
                                .font(BedrudTypography.caption)
                                .foregroundStyle(BedrudColors.destructive)
                        }
                    }

                    // Error message
                    if let errorMessage {
                        Text(errorMessage)
                            .font(BedrudTypography.caption)
                            .foregroundStyle(BedrudColors.destructive)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    // Register button
                    Button(action: performRegister) {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Create Account")
                                .font(BedrudTypography.body.bold())
                        }
                    }
                    .buttonStyle(BedrudPrimaryButtonStyle())
                    .disabled(!isFormValid || isLoading)
                }
                .padding(.horizontal, 24)

                // Back to login
                HStack(spacing: 4) {
                    Text("Already have an account?")
                        .font(BedrudTypography.footnote)
                        .foregroundStyle(BedrudColors.mutedForeground)

                    Button("Sign In") {
                        dismiss()
                    }
                    .font(BedrudTypography.footnote.bold())
                    .foregroundStyle(BedrudColors.primary)
                }
                .padding(.top, 8)

                Spacer()
            }
        }
        .background(BedrudColors.background)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Actions

    private func performRegister() {
        guard isFormValid, let authManager else { return }
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
}
