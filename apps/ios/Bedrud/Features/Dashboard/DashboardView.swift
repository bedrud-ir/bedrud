import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var instanceManager: InstanceManager

    @State private var rooms: [UserRoomResponse] = []
    @State private var isLoading: Bool = false
    @State private var errorMessage: String?
    @State private var showCreateRoom: Bool = false
    @State private var newRoomName: String = ""
    @State private var isCreatingRoom: Bool = false
    @State private var selectedRoom: JoinRoomResponse?
    @State private var isJoiningRoom: Bool = false
    @State private var showInstanceSwitcher: Bool = false

    private var authManager: AuthManager? { instanceManager.authManager }
    private var roomAPI: RoomAPI? { instanceManager.roomAPI }

    var body: some View {
        NavigationStack {
            ZStack {
                BedrudColors.background
                    .ignoresSafeArea()

                if isLoading && rooms.isEmpty {
                    ProgressView("Loading rooms...")
                        .foregroundStyle(BedrudColors.mutedForeground)
                } else if rooms.isEmpty {
                    emptyStateView
                } else {
                    roomListView
                }
            }
            .navigationTitle("Rooms")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    HStack(spacing: 8) {
                        // Instance switcher button
                        if let instance = instanceManager.store.activeInstance {
                            Button {
                                showInstanceSwitcher = true
                            } label: {
                                Circle()
                                    .fill(Color(hex: instance.iconColorHex) ?? BedrudColors.primary)
                                    .frame(width: 28, height: 28)
                                    .overlay(
                                        Text(String(instance.displayName.prefix(1)).uppercased())
                                            .font(BedrudTypography.caption.bold())
                                            .foregroundStyle(.white)
                                    )
                            }
                        }

                        Button {
                            guard let authManager else { return }
                            Task { await authManager.logout() }
                        } label: {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .foregroundStyle(BedrudColors.mutedForeground)
                        }
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showCreateRoom = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundStyle(BedrudColors.primary)
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
            .fullScreenCover(item: $selectedRoom) { joinResponse in
                MeetingView(joinResponse: joinResponse)
            }
            .sheet(isPresented: $showInstanceSwitcher) {
                InstanceSwitcherSheet()
                    .environmentObject(instanceManager)
            }
        }
    }

    // MARK: - Subviews

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "rectangle.stack.badge.plus")
                .font(.system(size: 48))
                .foregroundStyle(BedrudColors.mutedForeground)

            Text("No rooms yet")
                .font(BedrudTypography.title2)
                .foregroundStyle(BedrudColors.foreground)

            Text("Create a room to get started with video conferencing.")
                .font(BedrudTypography.subheadline)
                .foregroundStyle(BedrudColors.mutedForeground)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Button {
                showCreateRoom = true
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "plus")
                    Text("Create Room")
                }
                .font(BedrudTypography.body.bold())
            }
            .buttonStyle(BedrudPrimaryButtonStyle())
            .frame(width: 200)
            .padding(.top, 8)
        }
    }

    private var roomListView: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(rooms) { room in
                    RoomCardView(room: room, isJoining: isJoiningRoom) {
                        Task { await joinRoom(roomName: room.name) }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
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

    private func joinRoom(roomName: String) async {
        guard let roomAPI else { return }
        isJoiningRoom = true

        do {
            let response = try await roomAPI.joinRoom(roomName: roomName)
            selectedRoom = response
        } catch {
            errorMessage = error.localizedDescription
        }

        isJoiningRoom = false
    }
}

// MARK: - JoinRoomResponse Identifiable conformance

extension JoinRoomResponse: Identifiable {}
