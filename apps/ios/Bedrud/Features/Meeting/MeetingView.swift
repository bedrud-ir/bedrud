import SwiftUI
import LiveKit

struct MeetingView: View {
    let joinResponse: JoinRoomResponse

    @StateObject private var roomManager = RoomManager()
    @Environment(\.dismiss) private var dismiss

    @State private var showError = false
    @State private var showChat = false

    var body: some View {
        ZStack {
            Color.systemBackground
                .ignoresSafeArea()

            VStack(spacing: 0) {
                meetingTopBar

                videoGrid
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

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
        .sheet(isPresented: $showChat) {
            ChatSheetView(roomManager: roomManager)
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

// MARK: - Chat Sheet View

struct ChatSheetView: View {
    @ObservedObject var roomManager: RoomManager
    @State private var chatInput = ""
    @FocusState private var isInputFocused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if roomManager.chatMessages.isEmpty {
                    ContentUnavailableView {
                        Label("No Messages", systemImage: "bubble.left.and.bubble.right")
                    } description: {
                        Text("Send a message to start the conversation.")
                    }
                } else {
                    ScrollViewReader { proxy in
                        ScrollView {
                            LazyVStack(spacing: 4) {
                                ForEach(Array(roomManager.chatMessages.enumerated()), id: \.element.id) { index, message in
                                    chatRow(message, at: index)
                                        .id(message.id)
                                }
                            }
                            .padding()
                        }
                        .onChange(of: roomManager.chatMessages.count) { _, _ in
                            if let last = roomManager.chatMessages.last {
                                withAnimation {
                                    proxy.scrollTo(last.id, anchor: .bottom)
                                }
                            }
                        }
                    }
                }

                Divider()

                HStack(spacing: 10) {
                    TextField("Message...", text: $chatInput)
                        .textFieldStyle(.roundedBorder)
                        .focused($isInputFocused)
                        .onSubmit { sendMessage() }

                    Button(action: sendMessage) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title2)
                    }
                    .disabled(chatInput.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
            }
            .navigationTitle("Chat")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .onAppear { isInputFocused = true }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func sendMessage() {
        let text = chatInput.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        chatInput = ""
        Task { await roomManager.sendChatMessage(text) }
    }

    // MARK: - Chat Row

    private func chatRow(_ message: ChatMessage, at index: Int) -> some View {
        let messages = roomManager.chatMessages
        let prev: ChatMessage? = index > 0 ? messages[index - 1] : nil
        let showSender = !message.isLocal && prev?.senderName != message.senderName
        let showTime = shouldShowTime(current: message, previous: prev)

        return VStack(spacing: 2) {
            if showTime {
                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .frame(maxWidth: .infinity)
                    .padding(.top, index == 0 ? 0 : 8)
                    .padding(.bottom, 4)
            }

            VStack(alignment: message.isLocal ? .trailing : .leading, spacing: 2) {
                if showSender {
                    Text(message.senderName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(.top, 4)
                }

                Text(message.text)
                    .font(.body)
                    .foregroundStyle(message.isLocal ? .white : .primary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(message.isLocal ? Color.accentColor : Color.secondarySystemBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .frame(maxWidth: .infinity, alignment: message.isLocal ? .trailing : .leading)
        }
    }

    private func shouldShowTime(current: ChatMessage, previous: ChatMessage?) -> Bool {
        guard let previous else { return true }
        return current.timestamp.timeIntervalSince(previous.timestamp) > 120
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
