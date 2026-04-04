import SwiftUI

struct AdminOverviewView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @State private var onlineCount: Int = 0
    @State private var users: [AdminUser] = []
    @State private var rooms: [AdminRoom] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var adminAPI: AdminAPI? { instanceManager.adminAPI }

    // MARK: - Computed stats

    private var activeRoomCount: Int { rooms.filter(\.isActive).count }
    private var publicRoomCount: Int { rooms.filter { $0.isPublic == true }.count }
    private var privateRoomCount: Int { rooms.filter { $0.isPublic == false }.count }
    private var activeUserCount: Int { users.filter(\.isActive).count }
    private var adminUserCount: Int { users.filter(\.isAdmin).count }

    var body: some View {
        NavigationStack {
            ScrollView {
                if isLoading {
                    ProgressView().padding(.top, 60)
                } else {
                    VStack(spacing: 20) {
                        if let error = errorMessage {
                            Text(error).foregroundStyle(.red).padding()
                        }

                        statsGrid
                        recentUsersSection
                        roomBreakdownSection
                    }
                    .padding()
                }
            }
            .navigationTitle("Overview")
            .task {
                await loadAll()
                await autoRefreshOnlineCount()
            }
            .refreshable { await loadAll() }
        }
    }

    // MARK: - Subviews

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(title: "Online Now", value: "\(onlineCount)", icon: "antenna.radiowaves.left.and.right", color: .green)
            StatCard(title: "Total Users", value: "\(users.count)", icon: "person.3.fill", color: .blue)
            StatCard(title: "Active Users", value: "\(activeUserCount)", icon: "person.fill.checkmark", color: .indigo)
            StatCard(title: "Admins", value: "\(adminUserCount)", icon: "shield.fill", color: .purple)
            StatCard(title: "Live Rooms", value: "\(activeRoomCount)", icon: "video.fill", color: .red)
            StatCard(title: "Total Rooms", value: "\(rooms.count)", icon: "rectangle.stack.fill", color: .orange)
        }
    }

    private var recentUsersSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Recent Sign-ups", systemImage: "person.badge.plus")
                .font(.headline)
            ForEach(users.prefix(5)) { user in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(user.name).font(.subheadline).fontWeight(.medium)
                        Text(user.email).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    ProviderBadge(provider: user.provider)
                }
                .padding(.vertical, 6)
                Divider()
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var roomBreakdownSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Room Breakdown", systemImage: "chart.pie.fill").font(.headline)
            BreakdownBar(label: "Active", count: activeRoomCount, total: max(rooms.count, 1), color: .green)
            BreakdownBar(label: "Public", count: publicRoomCount, total: max(rooms.count, 1), color: .blue)
            BreakdownBar(label: "Private", count: privateRoomCount, total: max(rooms.count, 1), color: .purple)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Data

    private func loadAll() async {
        guard let api = adminAPI else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            async let u = api.listUsers()
            async let r = api.listRooms()
            async let c = api.getOnlineCount()
            (users, rooms, onlineCount) = try await (u, r, c)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func autoRefreshOnlineCount() async {
        guard let api = adminAPI else { return }
        while !Task.isCancelled {
            try? await Task.sleep(nanoseconds: 30_000_000_000)
            if let count = try? await api.getOnlineCount() {
                onlineCount = count
            }
        }
    }
}

// MARK: - Helper Views

private struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon).foregroundStyle(color)
                Spacer()
                Text(value).font(.title2).fontWeight(.bold)
            }
            Text(title).font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct BreakdownBar: View {
    let label: String
    let count: Int
    let total: Int
    let color: Color

    private var fraction: Double { Double(count) / Double(total) }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label).font(.subheadline)
                Spacer()
                Text("\(count) / \(total)").font(.caption).foregroundStyle(.secondary)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4).fill(Color(.systemFill)).frame(height: 8)
                    RoundedRectangle(cornerRadius: 4).fill(color).frame(width: geo.size.width * fraction, height: 8)
                }
            }
            .frame(height: 8)
        }
    }
}

private struct ProviderBadge: View {
    let provider: String?
    var body: some View {
        Text(provider ?? "local")
            .font(.caption2)
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(Color(.tertiarySystemFill))
            .clipShape(Capsule())
    }
}
