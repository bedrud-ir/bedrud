import SwiftUI
import LiveKit

struct MeetingView: View {
    let joinResponse: JoinRoomResponse

    @StateObject private var roomManager = RoomManager()
    @Environment(\.dismiss) private var dismiss

    @State private var showError: Bool = false
    @State private var showChat: Bool = false
    @State private var chatInput: String = ""

    var body: some View {
        ZStack {
            BedrudColors.background
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Top bar
                meetingTopBar

                // Video grid
                videoGrid
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                // Chat panel
                if showChat {
                    chatPanel
                }

                // Control bar
                ControlBar(
                    roomManager: roomManager,
                    onLeave: {
                        Task {
                            await roomManager.disconnect()
                            dismiss()
                        }
                    },
                    showChat: $showChat
                )
            }
        }
        .statusBar(hidden: true)
        .task {
            await connectToRoom()
        }
        .alert("Connection Error", isPresented: $showError) {
            Button("Leave") {
                dismiss()
            }
        } message: {
            Text(roomManager.error ?? "Failed to connect to the meeting.")
        }
    }

    // MARK: - Top Bar

    private var meetingTopBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(joinResponse.name)
                    .font(BedrudTypography.headline)
                    .foregroundStyle(BedrudColors.foreground)

                Text(connectionStatusText)
                    .font(BedrudTypography.caption)
                    .foregroundStyle(connectionStatusColor)
            }

            Spacer()

            // Participant count
            HStack(spacing: 4) {
                Image(systemName: "person.2.fill")
                    .font(.system(size: 12))
                Text("\(participantCount)")
                    .font(BedrudTypography.caption)
            }
            .foregroundStyle(BedrudColors.mutedForeground)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(BedrudColors.muted)
            .cornerRadius(16)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(BedrudColors.card)
    }

    // MARK: - Video Grid

    private var videoGrid: some View {
        GeometryReader { geometry in
            let allParticipants = buildParticipantList()
            let columns = gridColumns(for: allParticipants.count, in: geometry.size)

            ScrollView {
                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(allParticipants) { participant in
                        ParticipantTileView(participant: participant)
                            .frame(height: tileHeight(
                                totalCount: allParticipants.count,
                                containerSize: geometry.size
                            ))
                            .cornerRadius(12)
                    }
                }
                .padding(8)
            }
        }
    }

    // MARK: - Chat Panel

    private var chatPanel: some View {
        VStack(spacing: 0) {
            Divider()

            // Messages list
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 8) {
                        ForEach(roomManager.chatMessages) { message in
                            VStack(alignment: message.isLocal ? .trailing : .leading, spacing: 2) {
                                Text(message.senderName)
                                    .font(BedrudTypography.caption)
                                    .foregroundStyle(BedrudColors.mutedForeground)
                                Text(message.text)
                                    .font(BedrudTypography.body)
                                    .foregroundStyle(BedrudColors.foreground)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(message.isLocal ? BedrudColors.primary.opacity(0.2) : BedrudColors.muted)
                                    .cornerRadius(8)
                            }
                            .frame(maxWidth: .infinity, alignment: message.isLocal ? .trailing : .leading)
                            .id(message.id)
                        }
                    }
                    .padding(12)
                }
                .frame(height: 200)
                .onChange(of: roomManager.chatMessages.count) { _, _ in
                    if let last = roomManager.chatMessages.last {
                        proxy.scrollTo(last.id)
                    }
                }
            }

            // Input bar
            HStack(spacing: 8) {
                TextField("Message...", text: $chatInput)
                    .textFieldStyle(BedrudTextFieldStyle())

                Button {
                    guard !chatInput.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                    Task {
                        await roomManager.sendChatMessage(chatInput)
                        chatInput = ""
                    }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 28))
                        .foregroundStyle(BedrudColors.primary)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(BedrudColors.card)
        }
    }

    // MARK: - Helpers

    private var participantCount: Int {
        (roomManager.localParticipant != nil ? 1 : 0) + roomManager.participants.count
    }

    private var connectionStatusText: String {
        switch roomManager.connectionState {
        case .disconnected:
            return "Disconnected"
        case .connecting:
            return "Connecting..."
        case .connected:
            return "Connected"
        case .reconnecting:
            return "Reconnecting..."
        case .failed(let reason):
            return "Failed: \(reason)"
        }
    }

    private var connectionStatusColor: Color {
        switch roomManager.connectionState {
        case .connected:
            return .green
        case .connecting, .reconnecting:
            return .orange
        case .disconnected, .failed:
            return BedrudColors.destructive
        }
    }

    private func buildParticipantList() -> [ParticipantInfo] {
        var list: [ParticipantInfo] = []
        if let local = roomManager.localParticipant {
            list.append(local)
        }
        list.append(contentsOf: roomManager.participants)
        return list
    }

    private func gridColumns(for count: Int, in size: CGSize) -> [GridItem] {
        let columnCount: Int
        switch count {
        case 0...1:
            columnCount = 1
        case 2...4:
            columnCount = 2
        default:
            columnCount = size.width > size.height ? 3 : 2
        }
        return Array(repeating: GridItem(.flexible(), spacing: 8), count: columnCount)
    }

    private func tileHeight(totalCount: Int, containerSize: CGSize) -> CGFloat {
        switch totalCount {
        case 0...1:
            return containerSize.height - 16
        case 2:
            return (containerSize.height - 24) / 2
        case 3...4:
            return (containerSize.height - 24) / 2
        default:
            return (containerSize.height - 32) / 3
        }
    }

    private func connectToRoom() async {
        do {
            try await roomManager.connect(
                url: joinResponse.livekitHost,
                token: joinResponse.token
            )
        } catch {
            showError = true
        }
    }
}

// MARK: - Participant Tile View

struct ParticipantTileView: View {
    let participant: ParticipantInfo

    var body: some View {
        ZStack {
            // Background
            BedrudColors.muted

            if let videoTrack = participant.videoTrack, participant.isCameraEnabled {
                // LiveKit SwiftUI video view
                SwiftUIVideoView(videoTrack, layoutMode: .fill)
            } else {
                // Avatar placeholder
                VStack(spacing: 8) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(BedrudColors.mutedForeground)

                    Text(participant.name)
                        .font(BedrudTypography.body)
                        .foregroundStyle(BedrudColors.foreground)
                }
            }

            // Overlay: name and status
            VStack {
                Spacer()

                HStack {
                    // Name tag
                    HStack(spacing: 4) {
                        Text(participant.isLocal ? "You" : participant.name)
                            .font(BedrudTypography.caption)
                            .foregroundStyle(.white)
                            .lineLimit(1)

                        if !participant.isMicrophoneEnabled {
                            Image(systemName: "mic.slash.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(BedrudColors.destructive)
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.black.opacity(0.6))
                    .cornerRadius(6)

                    Spacer()

                    if participant.isScreenSharing {
                        Image(systemName: "rectangle.inset.filled.and.person.filled")
                            .font(.system(size: 12))
                            .foregroundStyle(.white)
                            .padding(4)
                            .background(.black.opacity(0.6))
                            .cornerRadius(4)
                    }
                }
                .padding(8)
            }
        }
    }
}

// MARK: - Preview

#Preview {
    MeetingView(
        joinResponse: JoinRoomResponse(
            id: "1",
            name: "Team Standup",
            token: "mock-token",
            livekitHost: "wss://localhost:7880",
            createdBy: "user1",
            adminId: "user1",
            isActive: true,
            isPublic: false,
            maxParticipants: 10,
            expiresAt: "2025-12-31T00:00:00Z",
            settings: RoomSettings(
                allowChat: true,
                allowVideo: true,
                allowAudio: true,
                requireApproval: false,
                e2ee: false
            ),
            mode: "meeting"
        )
    )
}
