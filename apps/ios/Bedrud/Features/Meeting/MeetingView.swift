import SwiftUI
import LiveKit
import PhotosUI

struct MeetingView: View {
    let joinResponse: JoinRoomResponse

    @EnvironmentObject private var instanceManager: InstanceManager
    @StateObject private var roomManager = RoomManager()
    @Environment(\.dismiss) private var dismiss

    @State private var showError = false
    @State private var showChat = false
    @State private var showParticipants = false
    @State private var showLeaveDialog = false
    @State private var lastReadChatCount = 0

    private var unreadChatCount: Int {
        showChat ? 0 : max(0, roomManager.chatMessages.count - lastReadChatCount)
    }

    private var isAdmin: Bool {
        roomManager.localParticipant?.identity == joinResponse.adminId
    }

    var body: some View {
        ZStack {
            // Kick detection overlay
            if roomManager.wasKicked {
                kickedScreen
            } else {
                Color.systemBackground
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    meetingTopBar

                    videoGrid
                        .frame(maxWidth: .infinity, maxHeight: .infinity)

                    ControlBar(
                        roomManager: roomManager,
                        onLeave: {
                            if isAdmin {
                                showLeaveDialog = true
                            } else {
                                Task { await roomManager.disconnect(); dismiss() }
                            }
                        },
                        showChat: $showChat,
                        showParticipants: $showParticipants,
                        unreadChatCount: unreadChatCount
                    )
                }
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
            ChatSheetView(
                roomManager: roomManager,
                apiClient: instanceManager.apiClient,
                authManager: instanceManager.authManager,
                roomId: joinResponse.id
            )
            .onAppear { lastReadChatCount = roomManager.chatMessages.count }
        }
        .sheet(isPresented: $showParticipants) {
            participantsPanelSheet
        }
        .confirmationDialog("Leave Meeting", isPresented: $showLeaveDialog, titleVisibility: .visible) {
            Button("End for Everyone", role: .destructive) {
                Task {
                    // TODO: call roomAPI.deleteRoom(joinResponse.id) when roomAPI is accessible here
                    await roomManager.disconnect()
                    dismiss()
                }
            }
            Button("Just Leave") {
                Task { await roomManager.disconnect(); dismiss() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Do you want to end the meeting for everyone or just leave?")
        }
    }

    // MARK: - Kicked screen

    private var kickedScreen: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.badge.minus")
                .font(.system(size: 64))
                .foregroundStyle(.red)

            Text("You were removed")
                .font(.title2.bold())

            Text("A moderator removed you from this meeting.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Button {
                Task { await roomManager.disconnect(); dismiss() }
            } label: {
                Text("Back to Dashboard")
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.systemBackground)
    }

    // MARK: - Participants Panel Sheet

    private var participantsPanelSheet: some View {
        let allParticipants = buildParticipantList()
        return NavigationStack {
            List(allParticipants, id: \.id) { participant in
                HStack(spacing: 10) {
                    Circle()
                        .fill(participantColor(for: participant.name))
                        .frame(width: 36, height: 36)
                        .overlay(
                            Text(participant.name.prefix(1).uppercased())
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                        )
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(participant.name).font(.subheadline).lineLimit(1)
                            if participant.isLocal {
                                Text("you").font(.caption2).foregroundStyle(Color.accentColor)
                            }
                        }
                    }
                    Spacer()
                    HStack(spacing: 6) {
                        if !participant.isMicrophoneEnabled {
                            Image(systemName: "mic.slash.fill").font(.caption).foregroundStyle(.secondary)
                        }
                        if !participant.isCameraEnabled {
                            Image(systemName: "video.slash.fill").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
            .navigationTitle("Participants (\(allParticipants.count))")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { showParticipants = false }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func participantColor(for name: String) -> Color {
        let colors: [Color] = [.indigo, .purple, .teal, .cyan, .orange, .pink]
        return colors[abs(name.hashValue) % colors.count]
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
    /// Optional API client + auth manager — injected from DashboardView via EnvironmentObject.
    /// When nil, image upload is unavailable (e.g. guest join without a full instance).
    var apiClient: APIClient?
    var authManager: AuthManager?
    /// roomId is needed to hit the upload endpoint.
    var roomId: String

    @State private var chatInput = ""
    @FocusState private var isInputFocused: Bool
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var isUploading = false
    @State private var uploadErrorMessage: String?

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

                if let errMsg = uploadErrorMessage {
                    Text(errMsg)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 14)
                        .padding(.top, 6)
                }

                if isUploading {
                    ProgressView("Uploading image…")
                        .font(.caption)
                        .padding(.horizontal, 14)
                        .padding(.top, 6)
                }

                Divider()

                HStack(spacing: 10) {
                    // Image picker — only shown when API client is available
                    if apiClient != nil {
                        PhotosPicker(selection: $selectedPhoto, matching: .images) {
                            Image(systemName: "photo")
                                .font(.title3)
                                .foregroundStyle(isUploading ? .tertiary : .secondary)
                        }
                        .disabled(isUploading)
                        .onChange(of: selectedPhoto) { _, item in
                            guard let item else { return }
                            Task { await uploadPhoto(item) }
                        }
                    }

                    TextField("Message...", text: $chatInput)
                        .textFieldStyle(.roundedBorder)
                        .focused($isInputFocused)
                        .onSubmit { sendMessage() }

                    Button(action: sendMessage) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title2)
                    }
                    .disabled(chatInput.trimmingCharacters(in: .whitespaces).isEmpty || isUploading)
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

    private func uploadPhoto(_ item: PhotosPickerItem) async {
        guard let client = apiClient, let auth = authManager else { return }
        isUploading = true
        uploadErrorMessage = nil
        selectedPhoto = nil

        defer { isUploading = false }

        guard let data = try? await item.loadTransferable(type: Data.self),
              let token = try? await auth.getValidAccessToken() else {
            uploadErrorMessage = "Failed to load photo"
            return
        }

        // Determine MIME type from the UTType
        let mimeType = "image/jpeg"
        let filename = "upload.jpg"

        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        guard let url = URL(string: "\(client.baseURL)/room/\(roomId)/chat/upload") else {
            uploadErrorMessage = "Invalid URL"
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.httpBody = body

        do {
            let (responseData, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode < 300 else {
                let errBody = try? JSONDecoder().decode([String: String].self, from: responseData)
                uploadErrorMessage = errBody?["error"] ?? "Upload failed"
                return
            }
            let attachment = try JSONDecoder().decode(ChatAttachment.self, from: responseData)
            await roomManager.sendChatMessage(chatInput.trimmingCharacters(in: .whitespaces), attachments: [attachment])
            chatInput = ""
        } catch {
            uploadErrorMessage = error.localizedDescription
        }
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

                VStack(alignment: message.isLocal ? .trailing : .leading, spacing: 4) {
                    // Image attachments
                    ForEach(message.attachments.filter { $0.kind == "image" }, id: \.url) { att in
                        let isDataURL = att.url.hasPrefix("data:")
                        Group {
                            if isDataURL, let imgData = dataFromDataURL(att.url), let uiImg = UIImage(data: imgData) {
                                Image(uiImage: uiImg)
                                    .resizable()
                                    .scaledToFit()
                                    .frame(maxWidth: 240, maxHeight: 200)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            } else {
                                AsyncImage(url: URL(string: att.url)) { phase in
                                    switch phase {
                                    case .success(let img):
                                        img.resizable().scaledToFit()
                                            .frame(maxWidth: 240, maxHeight: 200)
                                            .clipShape(RoundedRectangle(cornerRadius: 12))
                                    case .failure:
                                        Label("Image unavailable", systemImage: "photo")
                                            .font(.caption).foregroundStyle(.secondary)
                                    default:
                                        ProgressView().frame(width: 60, height: 60)
                                    }
                                }
                            }
                        }
                    }

                    // Text content
                    if !message.text.isEmpty {
                        Text(message.text)
                            .font(.body)
                            .foregroundStyle(message.isLocal ? .white : .primary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(message.isLocal ? Color.accentColor : Color.secondarySystemBackground)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: message.isLocal ? .trailing : .leading)
        }
    }

    private func shouldShowTime(current: ChatMessage, previous: ChatMessage?) -> Bool {
        guard let previous else { return true }
        return current.timestamp.timeIntervalSince(previous.timestamp) > 120
    }

    /// Decode a data: URI into raw bytes.
    private func dataFromDataURL(_ dataURL: String) -> Data? {
        guard let commaIdx = dataURL.firstIndex(of: ",") else { return nil }
        let base64 = String(dataURL[dataURL.index(after: commaIdx)...])
        return Data(base64Encoded: base64)
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
