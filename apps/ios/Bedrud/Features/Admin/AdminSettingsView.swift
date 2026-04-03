import SwiftUI

struct AdminSettingsView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @State private var settings = AdminSettings(allowRegistrations: true, requireInviteToken: false)
    @State private var tokens: [InviteToken] = []
    @State private var isLoadingSettings = false
    @State private var isLoadingTokens = false
    @State private var isSavingSettings = false
    @State private var errorMessage: String?
    @State private var newTokenEmail = ""
    @State private var newTokenExpiryHours = 24
    @State private var isGeneratingToken = false
    @State private var newlyCreatedToken: InviteToken?

    private var adminAPI: AdminAPI? { instanceManager.adminAPI }

    private let expiryOptions = [1, 6, 12, 24, 48, 72, 168]

    var body: some View {
        NavigationStack {
            Form {
                registrationSection
                inviteTokenGenerateSection
                inviteTokenListSection
            }
            .navigationTitle("System Settings")
            .task {
                await loadSettings()
                await loadTokens()
            }
            .refreshable {
                await loadSettings()
                await loadTokens()
            }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: { Text(errorMessage ?? "") }
        }
    }

    // MARK: - Sections

    private var registrationSection: some View {
        Section("Registration") {
            Toggle("Allow Registrations", isOn: $settings.allowRegistrations)
                .onChange(of: settings.allowRegistrations) { _, _ in saveSettings() }
            Toggle("Require Invite Token", isOn: $settings.requireInviteToken)
                .onChange(of: settings.requireInviteToken) { _, _ in saveSettings() }
            if isSavingSettings {
                HStack {
                    ProgressView().scaleEffect(0.7)
                    Text("Saving…").font(.caption).foregroundStyle(.secondary)
                }
            }
        }
    }

    private var inviteTokenGenerateSection: some View {
        Section("Generate Invite Token") {
            TextField("Email (optional)", text: $newTokenEmail)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)

            Picker("Expires in", selection: $newTokenExpiryHours) {
                ForEach(expiryOptions, id: \.self) { hours in
                    Text(formatHours(hours)).tag(hours)
                }
            }

            Button {
                generateToken()
            } label: {
                HStack {
                    if isGeneratingToken { ProgressView().scaleEffect(0.8) }
                    Text("Generate Token")
                }
            }
            .disabled(isGeneratingToken)

            if let token = newlyCreatedToken {
                newTokenRevealRow(token)
            }
        }
    }

    private var inviteTokenListSection: some View {
        Section {
            if isLoadingTokens {
                ProgressView()
            } else if tokens.isEmpty {
                Text("No invite tokens").foregroundStyle(.secondary).font(.subheadline)
            } else {
                ForEach(tokens) { token in
                    TokenRow(token: token) {
                        deleteToken(token)
                    }
                }
            }
        } header: {
            Text("Invite Tokens (\(tokens.count))")
        }
    }

    @ViewBuilder
    private func newTokenRevealRow(_ token: InviteToken) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("New token created").font(.caption).foregroundStyle(.secondary)
                Text(token.token)
                    .font(.caption).monospaced()
                    .foregroundStyle(.green)
                    .lineLimit(2)
            }
            Spacer()
            Button {
                UIPasteboard.general.string = token.token
            } label: {
                Image(systemName: "doc.on.doc").foregroundStyle(.accentColor)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 4)
        .listRowBackground(Color.green.opacity(0.08))
    }

    // MARK: - Actions

    private func loadSettings() async {
        guard let api = adminAPI else { return }
        isLoadingSettings = true
        defer { isLoadingSettings = false }
        do { settings = try await api.getSettings() }
        catch { errorMessage = error.localizedDescription }
    }

    private func loadTokens() async {
        guard let api = adminAPI else { return }
        isLoadingTokens = true
        defer { isLoadingTokens = false }
        do { tokens = try await api.listInviteTokens() }
        catch { errorMessage = error.localizedDescription }
    }

    private func saveSettings() {
        Task {
            guard let api = adminAPI else { return }
            isSavingSettings = true
            defer { isSavingSettings = false }
            do { try await api.updateSettings(settings) }
            catch { errorMessage = error.localizedDescription }
        }
    }

    private func generateToken() {
        Task {
            guard let api = adminAPI else { return }
            isGeneratingToken = true
            defer { isGeneratingToken = false }
            do {
                let email = newTokenEmail.trimmingCharacters(in: .whitespaces)
                let token = try await api.createInviteToken(
                    email: email.isEmpty ? nil : email,
                    expiresInHours: newTokenExpiryHours
                )
                tokens.insert(token, at: 0)
                newlyCreatedToken = token
                newTokenEmail = ""
            } catch { errorMessage = error.localizedDescription }
        }
    }

    private func deleteToken(_ token: InviteToken) {
        Task {
            guard let api = adminAPI else { return }
            do {
                try await api.deleteInviteToken(id: token.id)
                tokens.removeAll { $0.id == token.id }
                if newlyCreatedToken?.id == token.id { newlyCreatedToken = nil }
            } catch { errorMessage = error.localizedDescription }
        }
    }

    private func formatHours(_ hours: Int) -> String {
        if hours < 24 { return "\(hours)h" }
        let days = hours / 24
        return "\(days)d"
    }
}

// MARK: - Token Row

private struct TokenRow: View {
    let token: InviteToken
    let onDelete: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(String(token.token.prefix(16)) + "…")
                        .font(.caption).monospaced()
                    statusBadge
                }
                if let email = token.email {
                    Text(email).font(.caption2).foregroundStyle(.secondary)
                }
                if let expiry = token.expiresAt.flatMap({ formatDate($0) }) {
                    Text("Expires \(expiry)").font(.caption2).foregroundStyle(.secondary)
                }
            }
            Spacer()
            Button {
                UIPasteboard.general.string = token.token
            } label: {
                Image(systemName: "doc.on.doc").foregroundStyle(.accentColor)
            }
            .buttonStyle(.plain)
        }
        .swipeActions(edge: .trailing) {
            Button("Delete", role: .destructive) { onDelete() }
        }
    }

    private var statusBadge: some View {
        let used = token.used == true
        return Text(used ? "Used" : "Active")
            .font(.caption2).fontWeight(.medium)
            .padding(.horizontal, 5).padding(.vertical, 2)
            .background(used ? Color(.systemFill) : Color.green.opacity(0.15))
            .foregroundStyle(used ? .secondary : .green)
            .clipShape(Capsule())
    }

    private func formatDate(_ iso: String) -> String? {
        let f = ISO8601DateFormatter()
        guard let d = f.date(from: iso) else { return nil }
        return d.formatted(date: .abbreviated, time: .omitted)
    }
}
