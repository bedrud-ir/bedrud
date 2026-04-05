import SwiftUI

struct GuestLoginView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var errorMessage: String?
    @State private var isLoading = false

    private var authManager: AuthManager? { instanceManager.authManager }

    var body: some View {
        Form {
            // Header
            Section {
                VStack(spacing: 10) {
                    Image(systemName: "person.circle")
                        .font(.system(size: 56, weight: .light))
                        .foregroundStyle(.tint)

                    Text("Join as guest")
                        .font(.largeTitle.bold())

                    Text("No account needed — just pick a name and you're in.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
                .listRowBackground(Color.clear)
            }

            // Name input
            Section {
                TextField("Display name", text: $name, prompt: Text("What should we call you?"))
                    .textContentType(.nickname)
                    .autocorrectionDisabled()
                    #if os(iOS)
                    .textInputAutocapitalization(.words)
                    #endif
                    .onSubmit(performGuestLogin)
            }

            // Error
            if let errorMessage {
                Section {
                    Label(errorMessage, systemImage: "xmark.circle.fill")
                        .foregroundStyle(.red)
                        .font(.footnote)
                }
            }

            // Continue button
            Section {
                Button(action: performGuestLogin) {
                    Group {
                        if isLoading {
                            ProgressView()
                        } else {
                            Label("Continue as guest", systemImage: "arrow.right")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .font(.body.bold())
                }
                .disabled(isLoading || name.trimmingCharacters(in: .whitespaces).count < 2)
            }

            // Sign-in link
            Section {
                HStack {
                    Spacer()
                    Text("Have an account?")
                        .foregroundStyle(.secondary)
                    Button("Sign In") { dismiss() }
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
    }

    // MARK: - Actions

    private func performGuestLogin() {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard trimmed.count >= 2 else {
            errorMessage = "Name must be at least 2 characters"
            return
        }
        guard let authManager else {
            errorMessage = "Not connected to a server. Please go back and select one."
            return
        }

        isLoading = true
        errorMessage = nil

        Task {
            do {
                _ = try await authManager.guestLogin(name: trimmed)
                // isAuthenticated flips → root view transitions automatically
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
