import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var settingsStore: SettingsStore
    @EnvironmentObject private var instanceManager: InstanceManager

    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var passwordError: String?
    @State private var passwordSuccess = false
    @State private var isSavingPassword = false

    private var authManager: AuthManager? { instanceManager.authManager }
    private var authAPI: AuthAPI? { instanceManager.authAPI }
    private var currentUser: User? { authManager?.currentUser }

    private var isLocalAccount: Bool {
        let provider = currentUser?.provider
        return provider == nil || provider == "local" || provider == "passkey"
    }

    var body: some View {
        NavigationStack {
            List {
                appearanceSection
                notificationsSection
                if currentUser != nil {
                    accountInfoSection
                    securitySection
                }
                aboutSection
            }
            #if os(iOS)
            .listStyle(.insetGrouped)
            #else
            .listStyle(.inset)
            #endif
            .navigationTitle("Settings")
        }
    }

    // MARK: - Sections

    private var appearanceSection: some View {
        Section("Appearance") {
            Picker("Theme", selection: $settingsStore.appearance) {
                ForEach(AppAppearance.allCases) { option in
                    Text(option.label).tag(option)
                }
            }
        }
    }

    private var notificationsSection: some View {
        Section("Notifications") {
            Toggle("Enable Notifications", isOn: $settingsStore.notificationsEnabled)
        }
    }

    private var accountInfoSection: some View {
        Section("Account") {
            if let user = currentUser {
                LabeledContent("Account ID") {
                    Text(String(user.id.prefix(8)))
                        .font(.system(.body, design: .monospaced))
                        .foregroundStyle(.secondary)
                }
                LabeledContent("Sign-in method") {
                    Text((user.provider?.capitalized) ?? "Email")
                        .foregroundStyle(.secondary)
                }
                LabeledContent("Role") {
                    HStack(spacing: 4) {
                        if user.isAdmin {
                            Image(systemName: "shield.fill")
                                .foregroundStyle(.orange)
                                .font(.caption)
                        }
                        Text(user.isAdmin ? "Admin" : "User")
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private var securitySection: some View {
        Section("Security") {
            if !isLocalAccount {
                Label(
                    "Password change is not available for \((currentUser?.provider?.capitalized) ?? "OAuth") sign-in.",
                    systemImage: "info.circle"
                )
                .font(.footnote)
                .foregroundStyle(.secondary)
            } else {
                SecureField("Current password", text: $currentPassword)
                    .textContentType(.password)
                SecureField("New password", text: $newPassword)
                    .textContentType(.newPassword)
                SecureField("Confirm new password", text: $confirmPassword)
                    .textContentType(.newPassword)

                if let passwordError {
                    Label(passwordError, systemImage: "xmark.circle.fill")
                        .foregroundStyle(.red)
                        .font(.footnote)
                }

                if passwordSuccess {
                    Label("Password changed successfully", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                        .font(.footnote)
                }

                Button {
                    performPasswordChange()
                } label: {
                    Group {
                        if isSavingPassword {
                            ProgressView()
                        } else {
                            Text("Change Password")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .font(.body.bold())
                }
                .disabled(
                    isSavingPassword ||
                    currentPassword.isEmpty ||
                    newPassword.isEmpty ||
                    confirmPassword.isEmpty
                )
            }
        }
    }

    private var aboutSection: some View {
        Section("About") {
            LabeledContent("Version", value: appVersion)
            LabeledContent("Build", value: appBuild)
        }
    }

    // MARK: - Actions

    private func performPasswordChange() {
        guard let authManager, let authAPI else { return }
        passwordError = nil
        passwordSuccess = false

        guard newPassword.count >= 8 else {
            passwordError = "Password must be at least 8 characters"
            return
        }
        guard newPassword == confirmPassword else {
            passwordError = "Passwords do not match"
            return
        }

        isSavingPassword = true
        Task {
            do {
                try await authAPI.changePassword(
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    authManager: authManager
                )
                currentPassword = ""
                newPassword = ""
                confirmPassword = ""
                passwordSuccess = true
            } catch {
                passwordError = error.localizedDescription
            }
            isSavingPassword = false
        }
    }

    // MARK: - Helpers

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }

    private var appBuild: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
}
