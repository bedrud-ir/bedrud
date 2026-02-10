import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var instanceManager: InstanceManager

    @State private var showInstanceSwitcher = false

    private var authManager: AuthManager? { instanceManager.authManager }
    private var user: User? { authManager?.currentUser }

    var body: some View {
        NavigationStack {
            List {
                userSection
                serverSection
                accountSection
                signOutSection
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Profile")
            .sheet(isPresented: $showInstanceSwitcher) {
                InstanceSwitcherSheet()
                    .environmentObject(instanceManager)
            }
        }
    }

    // MARK: - Sections

    private var userSection: some View {
        Section {
            HStack(spacing: 14) {
                avatarView
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(user?.name ?? "Unknown")
                            .font(.title3.bold())
                        if user?.isAdmin == true {
                            Text("Admin")
                                .font(.caption2.bold())
                                .foregroundStyle(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(BedrudColors.primary)
                                .clipShape(Capsule())
                        }
                    }
                    Text(user?.email ?? "")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.vertical, 4)
        }
    }

    private var avatarView: some View {
        Group {
            if let urlString = user?.avatarUrl, let url = URL(string: urlString) {
                AsyncImage(url: url) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    initialCircle
                }
            } else {
                initialCircle
            }
        }
        .frame(width: 56, height: 56)
        .clipShape(Circle())
    }

    private var initialCircle: some View {
        Text(String(user?.name.prefix(1) ?? "?").uppercased())
            .font(.title2.bold())
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(BedrudColors.primary)
    }

    private var serverSection: some View {
        Section("Server") {
            if let instance = instanceManager.store.activeInstance {
                HStack(spacing: 12) {
                    ServerIconView(
                        serverURL: instance.serverURL,
                        displayName: instance.displayName,
                        fallbackColor: parseColor(instance.iconColorHex),
                        size: 32
                    )
                    VStack(alignment: .leading, spacing: 2) {
                        Text(instance.displayName)
                            .font(.body)
                        Text(instance.serverURL)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    Spacer()
                    Button("Switch") {
                        showInstanceSwitcher = true
                    }
                    .font(.subheadline)
                }
            }
        }
    }

    private var accountSection: some View {
        Section("Account") {
            if let user {
                LabeledContent("User ID", value: String(user.id.prefix(8)) + "...")
                if let provider = user.provider {
                    LabeledContent("Provider", value: provider.capitalized)
                }
            }
        }
    }

    private var signOutSection: some View {
        Section {
            Button(role: .destructive) {
                guard let authManager else { return }
                Task { await authManager.logout() }
            } label: {
                HStack {
                    Spacer()
                    Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    Spacer()
                }
            }
        }
    }

    // MARK: - Helpers

    private func parseColor(_ hex: String) -> Color {
        let cleaned = hex.trimmingCharacters(in: .init(charactersIn: "#"))
        guard cleaned.count == 6,
              let val = UInt64(cleaned, radix: 16) else { return .accentColor }
        return Color(
            red: Double((val >> 16) & 0xFF) / 255,
            green: Double((val >> 8) & 0xFF) / 255,
            blue: Double(val & 0xFF) / 255
        )
    }
}
