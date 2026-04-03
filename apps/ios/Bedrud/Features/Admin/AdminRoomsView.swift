import SwiftUI

struct AdminRoomsView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @State private var rooms: [AdminRoom] = []
    @State private var searchText = ""
    @State private var sortOrder: SortOrder = .nameAsc
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var roomToDelete: AdminRoom?
    @State private var roomToEdit: AdminRoom?
    @State private var editMaxParticipants = ""

    private var adminAPI: AdminAPI? { instanceManager.adminAPI }

    enum SortOrder: String, CaseIterable {
        case nameAsc = "Name ↑"
        case nameDesc = "Name ↓"
        case dateDesc = "Newest"
        case capacityDesc = "Capacity ↓"
    }

    private var filteredRooms: [AdminRoom] {
        let base = searchText.isEmpty ? rooms : rooms.filter {
            $0.name.localizedCaseInsensitiveContains(searchText)
        }
        switch sortOrder {
        case .nameAsc:      return base.sorted { $0.name < $1.name }
        case .nameDesc:     return base.sorted { $0.name > $1.name }
        case .dateDesc:     return base.sorted { ($0.createdAt ?? "") > ($1.createdAt ?? "") }
        case .capacityDesc: return base.sorted { ($0.maxParticipants ?? 0) > ($1.maxParticipants ?? 0) }
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                } else {
                    List(filteredRooms) { room in
                        RoomAdminRow(room: room)
                            .swipeActions(edge: .trailing) {
                                Button("Delete", role: .destructive) { roomToDelete = room }
                                Button("Edit") { startEdit(room) }.tint(.blue)
                            }
                    }
                    .searchable(text: $searchText, prompt: "Search rooms")
                }
            }
            .navigationTitle("Rooms")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Picker("Sort", selection: $sortOrder) {
                            ForEach(SortOrder.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                        }
                    } label: { Label("Sort", systemImage: "arrow.up.arrow.down") }
                }
            }
            .confirmationDialog(
                "Delete \"\(roomToDelete?.name ?? "")\"?",
                isPresented: .init(get: { roomToDelete != nil }, set: { if !$0 { roomToDelete = nil } }),
                titleVisibility: .visible
            ) {
                Button("Delete Room", role: .destructive) {
                    if let r = roomToDelete { deleteRoom(r) }
                }
                Button("Cancel", role: .cancel) { roomToDelete = nil }
            } message: {
                Text("This will permanently remove the room and disconnect all participants.")
            }
            .sheet(isPresented: .init(
                get: { roomToEdit != nil },
                set: { if !$0 { roomToEdit = nil } }
            )) {
                if let room = roomToEdit {
                    editSheet(room)
                }
            }
            .task { await loadRooms() }
            .refreshable { await loadRooms() }
            .alert("Error", isPresented: .constant(errorMessage != nil)) {
                Button("OK") { errorMessage = nil }
            } message: { Text(errorMessage ?? "") }
        }
    }

    @ViewBuilder
    private func editSheet(_ room: AdminRoom) -> some View {
        NavigationStack {
            Form {
                Section("Room") {
                    LabeledContent("Name", value: room.name)
                }
                Section("Capacity") {
                    TextField("Max Participants", text: $editMaxParticipants)
                        .keyboardType(.numberPad)
                }
            }
            .navigationTitle("Edit Room")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("Cancel") { roomToEdit = nil } }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        if let max = Int(editMaxParticipants) {
                            updateRoom(room, maxParticipants: max)
                        }
                        roomToEdit = nil
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }

    private func loadRooms() async {
        guard let api = adminAPI else { return }
        isLoading = true
        defer { isLoading = false }
        do { rooms = try await api.listRooms() }
        catch { errorMessage = error.localizedDescription }
    }

    private func deleteRoom(_ room: AdminRoom) {
        Task {
            guard let api = adminAPI else { return }
            do {
                try await api.deleteRoom(id: room.id)
                rooms.removeAll { $0.id == room.id }
            } catch { errorMessage = error.localizedDescription }
        }
        roomToDelete = nil
    }

    private func updateRoom(_ room: AdminRoom, maxParticipants: Int) {
        Task {
            guard let api = adminAPI else { return }
            do {
                try await api.updateRoom(id: room.id, maxParticipants: maxParticipants)
                if let idx = rooms.firstIndex(where: { $0.id == room.id }) {
                    let r = rooms[idx]
                    rooms[idx] = AdminRoom(
                        id: r.id, name: r.name, isActive: r.isActive,
                        isPublic: r.isPublic, maxParticipants: maxParticipants,
                        createdAt: r.createdAt
                    )
                }
            } catch { errorMessage = error.localizedDescription }
        }
    }

    private func startEdit(_ room: AdminRoom) {
        editMaxParticipants = room.maxParticipants.map { "\($0)" } ?? "20"
        roomToEdit = room
    }
}

// MARK: - Room Row

private struct RoomAdminRow: View {
    let room: AdminRoom

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(room.name).font(.subheadline).fontWeight(.medium).monospaced()
                Spacer()
                statusBadge
            }
            HStack(spacing: 6) {
                visibilityBadge
                if let max = room.maxParticipants {
                    Label("\(max)", systemImage: "person.2").font(.caption).foregroundStyle(.secondary)
                }
                if let date = room.createdAt.flatMap({ formatDate($0) }) {
                    Text(date).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 2)
    }

    private var statusBadge: some View {
        HStack(spacing: 4) {
            if room.isActive {
                Circle().fill(.green).frame(width: 6, height: 6)
                    .overlay(Circle().fill(.green).frame(width: 10, height: 10).opacity(0.3))
            }
            Text(room.isActive ? "Live" : "Idle")
                .font(.caption2).fontWeight(.medium)
                .foregroundStyle(room.isActive ? .green : .secondary)
        }
    }

    private var visibilityBadge: some View {
        Label(room.isPublic == true ? "Public" : "Private",
              systemImage: room.isPublic == true ? "globe" : "lock.fill")
            .font(.caption2)
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(Color(.tertiarySystemFill))
            .clipShape(Capsule())
    }

    private func formatDate(_ iso: String) -> String? {
        let f = ISO8601DateFormatter()
        guard let d = f.date(from: iso) else { return nil }
        return d.formatted(date: .abbreviated, time: .omitted)
    }
}
