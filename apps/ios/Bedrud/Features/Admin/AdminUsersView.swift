import SwiftUI

struct AdminUsersView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @State private var users: [AdminUser] = []
    @State private var searchText = ""
    @State private var sortOrder: SortOrder = .nameAsc
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var selectedUser: AdminUser?

    private var adminAPI: AdminAPI? { instanceManager.adminAPI }

    enum SortOrder: String, CaseIterable {
        case nameAsc = "Name ↑"
        case nameDesc = "Name ↓"
        case emailAsc = "Email ↑"
        case dateDesc = "Newest"
    }

    private var filteredUsers: [AdminUser] {
        let base = searchText.isEmpty ? users : users.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.email.localizedCaseInsensitiveContains(searchText)
        }
        switch sortOrder {
        case .nameAsc:  return base.sorted { $0.name < $1.name }
        case .nameDesc: return base.sorted { $0.name > $1.name }
        case .emailAsc: return base.sorted { $0.email < $1.email }
        case .dateDesc: return base.sorted { ($0.createdAt ?? "") > ($1.createdAt ?? "") }
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                } else {
                    List(filteredUsers) { user in
                        UserRow(user: user) { updated in
                            toggleBan(user: updated)
                        }
                        .contentShape(Rectangle())
                        .onTapGesture { selectedUser = user }
                    }
                    .searchable(text: $searchText, prompt: "Search users")
                }
            }
            .navigationTitle("Users")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Picker("Sort", selection: $sortOrder) {
                            ForEach(SortOrder.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                        }
                    } label: {
                        Label("Sort", systemImage: "arrow.up.arrow.down")
                    }
                }
            }
            .sheet(item: $selectedUser) { user in
                AdminUserDetailView(user: user, onUpdate: { updated in
                    if let idx = users.firstIndex(where: { $0.id == updated.id }) {
                        users[idx] = updated
                    }
                })
                .environmentObject(instanceManager)
            }
            .task { await loadUsers() }
            .refreshable { await loadUsers() }
            .alert("Error", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
                Button("OK") { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "")
            }
        }
    }

    private func loadUsers() async {
        guard let api = adminAPI else { return }
        isLoading = true
        defer { isLoading = false }
        do { users = try await api.listUsers() }
        catch { errorMessage = error.localizedDescription }
    }

    private func toggleBan(user: AdminUser) {
        Task {
            guard let api = adminAPI else { return }
            do {
                try await api.setUserStatus(id: user.id, active: !user.isActive)
                if let idx = users.firstIndex(where: { $0.id == user.id }) {
                    // Rebuild with toggled isActive — AdminUser is a struct so recreate it
                    let u = users[idx]
                    users[idx] = AdminUser(
                        id: u.id, email: u.email, name: u.name,
                        provider: u.provider, isActive: !u.isActive,
                        isAdmin: u.isAdmin, accesses: u.accesses, createdAt: u.createdAt
                    )
                }
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

// MARK: - User Row

private struct UserRow: View {
    let user: AdminUser
    let onToggleBan: (AdminUser) -> Void

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(avatarColor(for: user.name))
                .frame(width: 40, height: 40)
                .overlay(Text(user.name.prefix(1).uppercased()).foregroundStyle(.white).font(.headline))

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Text(user.name).font(.subheadline).fontWeight(.medium)
                    if user.isAdmin {
                        Image(systemName: "shield.fill").font(.caption2).foregroundStyle(.purple)
                    }
                }
                Text(user.email).font(.caption).foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                providerBadge
                statusBadge
            }
        }
        .swipeActions(edge: .trailing) {
            Button(user.isActive ? "Ban" : "Unban", role: user.isActive ? .destructive : nil) {
                onToggleBan(user)
            }
            .tint(user.isActive ? .red : .green)
        }
    }

    private var statusBadge: some View {
        Text(user.isActive ? "Active" : "Banned")
            .font(.caption2).fontWeight(.medium)
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(user.isActive ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
            .foregroundStyle(user.isActive ? .green : .red)
            .clipShape(Capsule())
    }

    private var providerBadge: some View {
        Text(user.provider ?? "local")
            .font(.caption2)
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(Color(.tertiarySystemFill))
            .clipShape(Capsule())
    }

    private func avatarColor(for name: String) -> Color {
        let colors: [Color] = [.blue, .purple, .indigo, .teal, .cyan, .orange, .pink]
        let idx = abs(name.hashValue) % colors.count
        return colors[idx]
    }
}

// MARK: - User Detail

struct AdminUserDetailView: View {
    let user: AdminUser
    let onUpdate: (AdminUser) -> Void
    @EnvironmentObject private var instanceManager: InstanceManager
    @Environment(\.dismiss) private var dismiss
    @State private var isUpdating = false
    @State private var errorMessage: String?

    private var adminAPI: AdminAPI? { instanceManager.adminAPI }

    var body: some View {
        NavigationStack {
            Form {
                Section("Account") {
                    LabeledContent("ID") { Text(user.id).font(.caption).monospaced().foregroundStyle(.secondary) }
                    LabeledContent("Email", value: user.email)
                    LabeledContent("Name", value: user.name)
                    LabeledContent("Provider", value: user.provider ?? "local")
                    LabeledContent("Joined", value: user.createdAt.flatMap { formatDate($0) } ?? "—")
                }

                Section("Status") {
                    LabeledContent("Active") {
                        Image(systemName: user.isActive ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundStyle(user.isActive ? .green : .red)
                    }
                    LabeledContent("Admin") {
                        Image(systemName: user.isAdmin ? "checkmark.circle.fill" : "minus.circle")
                            .foregroundStyle(user.isAdmin ? .purple : .secondary)
                    }
                }

                Section {
                    Button(user.isActive ? "Ban User" : "Unban User", role: user.isActive ? .destructive : nil) {
                        toggleStatus()
                    }
                    .disabled(isUpdating)
                }
            }
            .navigationTitle(user.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                }
            }
            .alert("Error", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
                Button("OK") { errorMessage = nil }
            } message: { Text(errorMessage ?? "") }
        }
    }

    private func toggleStatus() {
        Task {
            guard let api = adminAPI else { return }
            isUpdating = true
            defer { isUpdating = false }
            do {
                try await api.setUserStatus(id: user.id, active: !user.isActive)
                let updated = AdminUser(
                    id: user.id, email: user.email, name: user.name,
                    provider: user.provider, isActive: !user.isActive,
                    isAdmin: user.isAdmin, accesses: user.accesses, createdAt: user.createdAt
                )
                onUpdate(updated)
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func formatDate(_ iso: String) -> String? {
        let f = ISO8601DateFormatter()
        guard let d = f.date(from: iso) else { return nil }
        return d.formatted(date: .abbreviated, time: .omitted)
    }
}
