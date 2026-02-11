import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var instanceManager: InstanceManager

    @State private var rooms: [UserRoomResponse] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showCreateRoom = false
    @State private var newRoomName = ""
    @State private var isCreatingRoom = false
    @State private var selectedRoom: JoinRoomResponse?
    @State private var joiningRoomId: String?
    @State private var roomToDelete: UserRoomResponse?
    @State private var roomToEdit: UserRoomResponse?

    private var roomAPI: RoomAPI? { instanceManager.roomAPI }

    private var activeRooms: [UserRoomResponse] {
        rooms.filter { $0.isActive }
    }

    private var inactiveRooms: [UserRoomResponse] {
        rooms.filter { !$0.isActive }
    }

    var body: some View {
        NavigationStack {
            List {
                if isLoading && rooms.isEmpty {
                    Section {
                        HStack {
                            Spacer()
                            ProgressView("Loading rooms...")
                            Spacer()
                        }
                        .listRowBackground(Color.clear)
                    }
                } else if rooms.isEmpty {
                    emptyStateSection
                } else {
                    if !activeRooms.isEmpty {
                        Section {
                            ForEach(activeRooms) { room in
                                roomRow(room)
                            }
                        } header: {
                            Text("Active (\(activeRooms.count))")
                        }
                    }

                    if !inactiveRooms.isEmpty {
                        Section {
                            ForEach(inactiveRooms) { room in
                                roomRow(room)
                            }
                        } header: {
                            Text("Inactive (\(inactiveRooms.count))")
                        }
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
            .alert("Create Room", isPresented: $showCreateRoom) {
                TextField("Room name", text: $newRoomName)
                Button("Cancel", role: .cancel) {
                    newRoomName = ""
                }
                Button("Create") {
                    Task { await createRoom() }
                }
                .disabled(newRoomName.isEmpty)
            } message: {
                Text("Enter a name for your new room.")
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
            .sheet(item: $roomToEdit) { room in
                RoomSettingsSheet(
                    room: room,
                    roomAPI: roomAPI,
                    onSaved: { Task { await loadRooms() } }
                )
            }
            #if os(iOS)
            .fullScreenCover(item: $selectedRoom) { joinResponse in
                MeetingView(joinResponse: joinResponse)
                    .environmentObject(instanceManager)
            }
            #else
            .sheet(item: $selectedRoom) { joinResponse in
                MeetingView(joinResponse: joinResponse)
                    .environmentObject(instanceManager)
                    .frame(minWidth: 800, minHeight: 600)
            }
            #endif
        }
    }

    // MARK: - Subviews

    private var emptyStateSection: some View {
        Section {
            ContentUnavailableView {
                Label("No Rooms", systemImage: "rectangle.stack.badge.plus")
            } description: {
                Text("Create a room to start conferencing.")
            } actions: {
                Button {
                    showCreateRoom = true
                } label: {
                    Text("Create Room")
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
            }
            .listRowBackground(Color.clear)
        }
    }

    private func roomRow(_ room: UserRoomResponse) -> some View {
        RoomCardView(
            room: room,
            isJoining: joiningRoomId == room.id,
            onJoin: { Task { await joinRoom(room) } },
            onDelete: { roomToDelete = room },
            onSettings: room.relationship == "owner" ? { roomToEdit = room } : nil
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

    private func createRoom() async {
        guard !newRoomName.isEmpty, let roomAPI else { return }
        isCreatingRoom = true

        do {
            _ = try await roomAPI.createRoom(name: newRoomName)
            newRoomName = ""
            await loadRooms()
        } catch {
            errorMessage = error.localizedDescription
        }

        isCreatingRoom = false
    }

    private func joinRoom(_ room: UserRoomResponse) async {
        guard let roomAPI else { return }
        joiningRoomId = room.id

        do {
            let response = try await roomAPI.joinRoom(roomName: room.name)
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

// MARK: - JoinRoomResponse Identifiable conformance

extension JoinRoomResponse: Identifiable {}
