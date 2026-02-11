import SwiftUI
import LiveKit

struct MeetingView: View {
    let joinResponse: JoinRoomResponse

    @StateObject private var roomManager = RoomManager()
    @Environment(\.dismiss) private var dismiss

    @State private var showError = false
    @State private var showChat = false
    @State private var chatInput = ""

    var body: some View {
        ZStack {
            Color.systemBackground
                .ignoresSafeArea()

            VStack(spacing: 0) {
                meetingTopBar

                #if os(macOS)
                HStack(spacing: 0) {
                    videoGrid
                        .frame(maxWidth: .infinity, maxHeight: .infinity)

                    if showChat {
                        Divider()
                        chatPanel
                            .frame(width: 280)
                    }
                }
                #else
                videoGrid
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                if showChat {
                    chatPanel
                }
                #endif

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
        #if os(iOS)
        .statusBar(hidden: true)
        #endif
        .task {
            await connectToRoom()
        }
        .alert("Connection Error", isPresented: $showError) {
            Button("Leave") { dismiss() }
        } message: {
            Text(roomManager.error ?? "Failed to connect to the meeting.")
        }
    }

    // MARK: - Top Bar

    private var meetingTopBar: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(joinResponse.name)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Text(connectionStatusText)
                    .font(.caption)
                    .foregroundStyle(connectionStatusColor)
            }

            Spacer()

            Label("\(participantCount)", systemImage: "person.2.fill")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.secondarySystemBackground)
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
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(8)
            }
        }
    }

    // MARK: - Chat Panel

    private var chatPanel: some View {
        VStack(spacing: 0) {
            #if os(iOS)
            Divider()
            #endif

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(roomManager.chatMessages) { message in
                            ChatBubbleView(message: message)
                                .id(message.id)
                        }
                    }
                    .padding(12)
                }
                #if os(iOS)
                .frame(height: 220)
                #else
                .frame(maxHeight: .infinity)
                #endif
                .onChange(of: roomManager.chatMessages.count) { _, _ in
                    if let last = roomManager.chatMessages.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }

            Divider()

            HStack(spacing: 10) {
                TextField("Message...", text: $chatInput)
                    .textFieldStyle(.roundedBorder)

                Button {
                    guard !chatInput.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                    Task {
                        await roomManager.sendChatMessage(chatInput)
                        chatInput = ""
                    }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(.tint)
                }
                .disabled(chatInput.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.secondarySystemBackground)
        }
    }

    // MARK: - Helpers

    private var participantCount: Int {
        (roomManager.localParticipant != nil ? 1 : 0) + roomManager.participants.count
    }

    private var connectionStatusText: String {
        switch roomManager.connectionState {
        case .disconnected: "Disconnected"
        case .connecting: "Connecting..."
        case .connected: "Connected"
        case .reconnecting: "Reconnecting..."
        case .failed(let reason): "Failed: \(reason)"
        }
    }

    private var connectionStatusColor: Color {
        switch roomManager.connectionState {
        case .connected: .green
        case .connecting, .reconnecting: .orange
        case .disconnected, .failed: .red
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
        case 0...1: columnCount = 1
        case 2...4: columnCount = 2
        default: columnCount = size.width > size.height ? 3 : 2
        }
        return Array(repeating: GridItem(.flexible(), spacing: 8), count: columnCount)
    }

    private func tileHeight(totalCount: Int, containerSize: CGSize) -> CGFloat {
        switch totalCount {
        case 0...1: containerSize.height - 16
        case 2...4: (containerSize.height - 24) / 2
        default: (containerSize.height - 32) / 3
        }
    }

    private func connectToRoom() async {
        do {
            try await roomManager.connect(
                url: joinResponse.livekitHost,
                token: joinResponse.token,
                roomName: joinResponse.name
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
            Color.tertiarySystemBackground

            if let videoTrack = participant.videoTrack, participant.isCameraEnabled {
                SwiftUIVideoView(videoTrack, layoutMode: .fill)
            } else {
                VStack(spacing: 8) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.tertiary)

                    Text(participant.name)
                        .font(.body)
                        .foregroundStyle(.primary)
                }
            }

            // Overlay: name tag + status indicators
            VStack {
                Spacer()

                HStack {
                    HStack(spacing: 4) {
                        Text(participant.isLocal ? "You" : participant.name)
                            .font(.caption)
                            .foregroundStyle(.white)
                            .lineLimit(1)

                        if !participant.isMicrophoneEnabled {
                            Image(systemName: "mic.slash.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(.red)
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.black.opacity(0.6))
                    .clipShape(RoundedRectangle(cornerRadius: 6))

                    Spacer()

                    if participant.isScreenSharing {
                        Image(systemName: "rectangle.inset.filled.and.person.filled")
                            .font(.system(size: 12))
                            .foregroundStyle(.white)
                            .padding(4)
                            .background(.black.opacity(0.6))
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                    }
                }
                .padding(8)
            }
        }
    }
}

// MARK: - Chat Bubble View

private struct ChatBubbleView: View {
    let message: ChatMessage

    var body: some View {
        VStack(alignment: message.isLocal ? .trailing : .leading, spacing: 2) {
            Text(message.senderName)
                .font(.caption2)
                .foregroundStyle(.secondary)

            Text(message.text)
                .font(.body)
                .foregroundStyle(message.isLocal ? .white : .primary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(message.isLocal ? Color.accentColor : Color.tertiarySystemBackground)
                .clipShape(RoundedRectangle(cornerRadius: 16))

            Text(message.timestamp, style: .time)
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, alignment: message.isLocal ? .trailing : .leading)
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
