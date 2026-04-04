import SwiftUI

// MARK: - Room filter

private enum RoomFilter: String, CaseIterable {
    case all = "All"
    case active = "Active"
    case `private` = "Private"
}

// MARK: - DashboardView

struct DashboardView: View {
    @EnvironmentObject private var instanceManager: InstanceManager

    @State private var rooms: [UserRoomResponse] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showCreateRoom = false
    @State private var selectedRoom: JoinRoomResponse?
    @State private var joiningRoomId: String?
    @State private var roomToDelete: UserRoomResponse?
    @State private var activeFilter: RoomFilter = .all
    @State private var quickJoinText = ""

    private var roomAPI: RoomAPI? { instanceManager.roomAPI }

    // MARK: - Filtered rooms

    private var filteredRooms: [UserRoomResponse] {
        switch activeFilter {
        case .all:     return rooms
        case .active:  return rooms.filter { $0.isActive }
        case .private: return rooms.filter { $0.isPublic == false }
        }
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            List {
                // Stats bar
                if !rooms.isEmpty {
                    statsSection
                }

                // Quick join
                quickJoinSection

                // Filter picker
                filterSection

                // Room list or loading/empty state
                if isLoading && rooms.isEmpty {
                    Section {
                        HStack {
                            Spacer()
                            ProgressView("Loading rooms...")
                            Spacer()
                        }
                        .listRowBackground(Color.clear)
                    }
                } else if filteredRooms.isEmpty {
                    emptyStateSection
                } else {
                    Section {
                        ForEach(filteredRooms) { room in
                            roomRow(room)
                        }
                    } header: {
                        Text("\(filteredRooms.count) room\(filteredRooms.count == 1 ? "" : "s")")
                    }
                }

                if let errorMessage {
                    Section {
                        Label(errorMessage, systemImage: "xmark.circle.fill")
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }
                }
            }
            #if os(iOS)
            .listStyle(.insetGrouped)
            #else
            .listStyle(.inset)
            #endif
            .navigationTitle("Rooms")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showCreateRoom = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await loadRooms()
            }
            .task {
                await loadRooms()
            }
            .sheet(isPresented: $showCreateRoom) {
                CreateRoomSheet { request in
                    await createRoom(request: request)
                }
            }
            .confirmationDialog(
                "Delete \"\(roomToDelete?.name ?? "")\"?",
                isPresented: .init(
                    get: { roomToDelete != nil },
                    set: { if !$0 { roomToDelete = nil } }
                ),
                titleVisibility: .visible
            ) {
                Button("Delete Room", role: .destructive) {
                    if let room = roomToDelete {
                        Task { await deleteRoom(room) }
                    }
                }
            } message: {
                Text("This room and all its data will be permanently deleted.")
            }
            #if os(iOS)
            .fullScreenCover(item: $selectedRoom) { joinResponse in
                MeetingView(joinResponse: joinResponse)
            }
            #else
            .sheet(item: $selectedRoom) { joinResponse in
                MeetingView(joinResponse: joinResponse)
                    .frame(minWidth: 800, minHeight: 600)
            }
            #endif
        }
    }

    // MARK: - Subviews

    private var statsSection: some View {
        Section {
            HStack(spacing: 12) {
                StatCard(title: "Total", value: rooms.count, color: .blue)
                StatCard(title: "Live", value: rooms.filter { $0.isActive }.count, color: .green)
                StatCard(title: "Private", value: rooms.filter { $0.isPublic == false }.count, color: .indigo)
            }
            .listRowBackground(Color.clear)
            .listRowInsets(.init(top: 4, leading: 0, bottom: 4, trailing: 0))
        }
    }

    private var quickJoinSection: some View {
        Section {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.secondary)
                TextField("Enter room name or link…", text: $quickJoinText)
                    .autocorrectionDisabled()
                    #if os(iOS)
                    .textInputAutocapitalization(.never)
                    #endif
                    .onSubmit(performQuickJoin)
                if !quickJoinText.isEmpty {
                    Button("Join", action: performQuickJoin)
                        .font(.footnote.bold())
                }
            }
        }
    }

    private var filterSection: some View {
        Section {
            Picker("Filter", selection: $activeFilter) {
                ForEach(RoomFilter.allCases, id: \.self) { filter in
                    Text(filter.rawValue).tag(filter)
                }
            }
            .pickerStyle(.segmented)
            .listRowBackground(Color.clear)
            .listRowInsets(.init(top: 4, leading: 0, bottom: 4, trailing: 0))
        }
    }

    private var emptyStateSection: some View {
        Section {
            ContentUnavailableView {
                Label(
                    activeFilter == .all ? "No Rooms" : "No \(activeFilter.rawValue) Rooms",
                    systemImage: "rectangle.stack.badge.plus"
                )
            } description: {
                if activeFilter == .all {
                    Text("Create a room to start conferencing.")
                } else {
                    Text("Try a different filter or create a new room.")
                }
            } actions: {
                if activeFilter == .all {
                    Button {
                        showCreateRoom = true
                    } label: {
                        Text("Create Room")
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                }
            }
            .listRowBackground(Color.clear)
        }
    }

    private func roomRow(_ room: UserRoomResponse) -> some View {
        RoomCardView(
            room: room,
            isJoining: joiningRoomId == room.id,
            onJoin: { Task { await joinRoom(room) } },
            onDelete: { roomToDelete = room }
        )
        #if os(macOS)
        .padding(.vertical, 4)
        #endif
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                roomToDelete = room
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }

    // MARK: - Actions

    private func performQuickJoin() {
        var slug = quickJoinText.trimmingCharacters(in: .whitespaces)
        for prefix in ["https://bedrud.com/m/", "http://bedrud.com/m/",
                       "https://bedrud.com/c/", "http://bedrud.com/c/"] {
            if slug.hasPrefix(prefix) { slug = String(slug.dropFirst(prefix.count)) }
        }
        slug = slug.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard !slug.isEmpty else { return }
        quickJoinText = ""
        Task { await joinRoomByName(slug) }
    }

    private func loadRooms() async {
        guard let roomAPI else { return }
        isLoading = true
        errorMessage = nil
        do {
            rooms = try await roomAPI.listRooms()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func createRoom(request: CreateRoomRequest) async {
        guard let roomAPI else { return }
        do {
            let room = try await roomAPI.createRoom(
                name: request.name,
                maxParticipants: request.maxParticipants,
                isPublic: request.isPublic,
                settings: request.settings
            )
            showCreateRoom = false
            await joinRoomByName(room.name)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func joinRoom(_ room: UserRoomResponse) async {
        await joinRoomByName(room.name)
    }

    private func joinRoomByName(_ name: String) async {
        guard let roomAPI else { return }
        joiningRoomId = name
        do {
            let response = try await roomAPI.joinRoom(roomName: name)
            selectedRoom = response
        } catch {
            errorMessage = error.localizedDescription
        }
        joiningRoomId = nil
    }

    private func deleteRoom(_ room: UserRoomResponse) async {
        guard let roomAPI else { return }
        do {
            try await roomAPI.deleteRoom(roomId: room.id)
            rooms.removeAll { $0.id == room.id }
        } catch {
            errorMessage = error.localizedDescription
        }
        roomToDelete = nil
    }
}

// MARK: - Stat Card

private struct StatCard: View {
    let title: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text("\(value)")
                .font(.title2.bold())
                .foregroundStyle(color)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Create Room Sheet

struct CreateRoomSheet: View {
    let onCreate: (CreateRoomRequest) async -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var isPublic = true
    @State private var maxParticipants = 20
    @State private var allowChat = true
    @State private var allowVideo = true
    @State private var allowAudio = true
    @State private var e2ee = false
    @State private var isCreating = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Room") {
                    TextField("Name (optional)", text: $name)
                        .autocorrectionDisabled()
                    Stepper("Max participants: \(maxParticipants)", value: $maxParticipants, in: 2...500)
                    Picker("Visibility", selection: $isPublic) {
                        Text("Public").tag(true)
                        Text("Private").tag(false)
                    }
                    .pickerStyle(.segmented)
                }

                Section("Features") {
                    Toggle("Allow Chat", isOn: $allowChat)
                    Toggle("Allow Video", isOn: $allowVideo)
                    Toggle("Allow Audio", isOn: $allowAudio)
                    Toggle("End-to-End Encryption", isOn: $e2ee)
                }

                Section {
                    Button {
                        isCreating = true
                        Task {
                            await onCreate(CreateRoomRequest(
                                name: name.isEmpty ? nil : name,
                                maxParticipants: maxParticipants,
                                isPublic: isPublic,
                                mode: nil,
                                settings: RoomSettings(
                                    allowChat: allowChat,
                                    allowVideo: allowVideo,
                                    allowAudio: allowAudio,
                                    requireApproval: false,
                                    e2ee: e2ee
                                )
                            ))
                            isCreating = false
                        }
                    } label: {
                        Group {
                            if isCreating {
                                ProgressView()
                            } else {
                                Text("Create Room")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .font(.body.bold())
                    }
                    .disabled(isCreating)
                }
            }
            .formStyle(.grouped)
            .navigationTitle("New Room")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - JoinRoomResponse Identifiable conformance

extension JoinRoomResponse: Identifiable {}
