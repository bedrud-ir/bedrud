import Foundation
import LiveKit
import Combine

// MARK: - Chat Message

struct ChatMessage: Identifiable, Equatable {
    let id: String
    let senderName: String
    let text: String
    let timestamp: Date
    let isLocal: Bool

    init(senderName: String, text: String, isLocal: Bool = false) {
        self.id = UUID().uuidString
        self.senderName = senderName
        self.text = text
        self.timestamp = Date()
        self.isLocal = isLocal
    }
}

// MARK: - Participant Info

struct ParticipantInfo: Identifiable {
    let id: String
    let identity: String
    let name: String
    let isLocal: Bool
    var isCameraEnabled: Bool
    var isMicrophoneEnabled: Bool
    var isScreenSharing: Bool
    var videoTrack: VideoTrack?
    var screenShareTrack: VideoTrack?
}

// MARK: - Room Manager

@MainActor
final class RoomManager: ObservableObject {
    // MARK: - Published State

    @Published private(set) var connectionState: ConnectionState = .disconnected
    @Published private(set) var participants: [ParticipantInfo] = []
    @Published private(set) var localParticipant: ParticipantInfo?
    @Published var isMicrophoneEnabled: Bool = false
    @Published var isCameraEnabled: Bool = false
    @Published var isScreenShareEnabled: Bool = false
    @Published private(set) var error: String?
    @Published private(set) var chatMessages: [ChatMessage] = []

    // MARK: - LiveKit Room

    private var room: LiveKit.Room?
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Connection State

    enum ConnectionState: Equatable {
        case disconnected
        case connecting
        case connected
        case reconnecting
        case failed(String)
    }

    // MARK: - Connect

    func connect(url: String, token: String) async throws {
        connectionState = .connecting
        error = nil

        let room = LiveKit.Room()
        self.room = room

        // Configure room options
        let roomOptions = RoomOptions(
            defaultCameraCaptureOptions: CameraCaptureOptions(
                dimensions: Dimensions(width: 1280, height: 720)
            ),
            adaptiveStream: true,
            dynacast: true
        )

        do {
            try await room.connect(url: url, token: token, roomOptions: roomOptions)
            connectionState = .connected

            // Set up event listeners
            setupRoomDelegation(room)

            // Update local participant
            updateLocalParticipant()
            updateRemoteParticipants()
        } catch {
            connectionState = .failed(error.localizedDescription)
            self.error = error.localizedDescription
            throw error
        }
    }

    // MARK: - Disconnect

    func disconnect() async {
        await room?.disconnect()
        room = nil
        connectionState = .disconnected
        participants = []
        localParticipant = nil
        isMicrophoneEnabled = false
        isCameraEnabled = false
        isScreenShareEnabled = false
        chatMessages = []
        cancellables.removeAll()
    }

    // MARK: - Media Controls

    func toggleMicrophone() async throws {
        guard let localParticipant = room?.localParticipant else { return }
        let newState = !isMicrophoneEnabled
        try await localParticipant.setMicrophone(enabled: newState)
        isMicrophoneEnabled = newState
        updateLocalParticipant()
    }

    func toggleCamera() async throws {
        guard let localParticipant = room?.localParticipant else { return }
        let newState = !isCameraEnabled
        try await localParticipant.setCamera(enabled: newState)
        isCameraEnabled = newState
        updateLocalParticipant()
    }

    func toggleScreenShare() async throws {
        guard let localParticipant = room?.localParticipant else { return }
        let newState = !isScreenShareEnabled
        try await localParticipant.setScreenShare(enabled: newState)
        isScreenShareEnabled = newState
        updateLocalParticipant()
    }

    // MARK: - Chat

    func sendChatMessage(_ text: String) async {
        guard let room else { return }
        let localParticipant = room.localParticipant
        let name = localParticipant.name ?? localParticipant.identity?.stringValue ?? "You"

        let json: [String: Any] = [
            "type": "chat",
            "message": text,
            "senderName": name
        ]

        if let data = try? JSONSerialization.data(withJSONObject: json) {
            try? await localParticipant.publish(data: data, options: DataPublishOptions(reliable: true))
        }

        let msg = ChatMessage(senderName: name, text: text, isLocal: true)
        chatMessages.append(msg)
    }

    func appendChatMessage(_ message: ChatMessage) {
        chatMessages.append(message)
    }

    // MARK: - Room Delegation

    private func setupRoomDelegation(_ room: LiveKit.Room) {
        room.add(delegate: RoomDelegateHandler(manager: self))
    }

    // MARK: - Participant Updates

    func updateLocalParticipant() {
        guard let participant = room?.localParticipant else {
            localParticipant = nil
            return
        }

        let cameraTrack = participant.firstCameraVideoTrack
        let screenTrack = participant.firstScreenShareVideoTrack

        localParticipant = ParticipantInfo(
            id: participant.identity?.stringValue ?? "local",
            identity: participant.identity?.stringValue ?? "local",
            name: participant.name ?? "You",
            isLocal: true,
            isCameraEnabled: participant.isCameraEnabled(),
            isMicrophoneEnabled: participant.isMicrophoneEnabled(),
            isScreenSharing: participant.isScreenShareEnabled(),
            videoTrack: cameraTrack,
            screenShareTrack: screenTrack
        )

        isMicrophoneEnabled = participant.isMicrophoneEnabled()
        isCameraEnabled = participant.isCameraEnabled()
        isScreenShareEnabled = participant.isScreenShareEnabled()
    }

    func updateRemoteParticipants() {
        guard let room else {
            participants = []
            return
        }

        participants = room.remoteParticipants.values.map { participant in
            let cameraTrack = participant.firstCameraVideoTrack
            let screenTrack = participant.firstScreenShareVideoTrack

            return ParticipantInfo(
                id: participant.identity?.stringValue ?? UUID().uuidString,
                identity: participant.identity?.stringValue ?? "",
                name: participant.name ?? participant.identity?.stringValue ?? "Unknown",
                isLocal: false,
                isCameraEnabled: participant.isCameraEnabled(),
                isMicrophoneEnabled: participant.isMicrophoneEnabled(),
                isScreenSharing: participant.isScreenShareEnabled(),
                videoTrack: cameraTrack,
                screenShareTrack: screenTrack
            )
        }
    }
}

// MARK: - Room Delegate Handler

private final class RoomDelegateHandler: RoomDelegate {
    private weak var manager: RoomManager?

    init(manager: RoomManager) {
        self.manager = manager
    }

    nonisolated func room(_ room: LiveKit.Room, didUpdateConnectionState connectionState: ConnectionState, from oldConnectionState: ConnectionState) {
        Task { @MainActor in
            switch connectionState {
            case .disconnected:
                manager?.updateLocalParticipant()
                manager?.updateRemoteParticipants()
            case .connected:
                manager?.updateLocalParticipant()
                manager?.updateRemoteParticipants()
            default:
                break
            }
        }
    }

    nonisolated func room(_ room: LiveKit.Room, participantDidConnect participant: RemoteParticipant) {
        Task { @MainActor in
            manager?.updateRemoteParticipants()
        }
    }

    nonisolated func room(_ room: LiveKit.Room, participantDidDisconnect participant: RemoteParticipant) {
        Task { @MainActor in
            manager?.updateRemoteParticipants()
        }
    }

    nonisolated func room(_ room: LiveKit.Room, participant: RemoteParticipant, didSubscribeTrack publication: RemoteTrackPublication) {
        Task { @MainActor in
            manager?.updateRemoteParticipants()
        }
    }

    nonisolated func room(_ room: LiveKit.Room, participant: RemoteParticipant, didUnsubscribeTrack publication: RemoteTrackPublication) {
        Task { @MainActor in
            manager?.updateRemoteParticipants()
        }
    }

    nonisolated func room(_ room: LiveKit.Room, participant: Participant, trackPublication: TrackPublication, didUpdateIsMuted isMuted: Bool) {
        Task { @MainActor in
            manager?.updateLocalParticipant()
            manager?.updateRemoteParticipants()
        }
    }

    nonisolated func room(_ room: LiveKit.Room, participant: RemoteParticipant?, didReceiveData data: Data, forTopic topic: String, encryptionType: EncryptionType) {
        Task { @MainActor in
            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  json["type"] as? String == "chat",
                  let message = json["message"] as? String else { return }

            let senderName = json["senderName"] as? String ?? participant?.name ?? "Unknown"
            let msg = ChatMessage(senderName: senderName, text: message, isLocal: false)
            manager?.appendChatMessage(msg)
        }
    }
}

// MARK: - Participant Extensions

private extension Participant {
    var firstCameraVideoTrack: VideoTrack? {
        trackPublications.values
            .compactMap { $0.track as? VideoTrack }
            .first { $0.source == .camera }
    }

    var firstScreenShareVideoTrack: VideoTrack? {
        trackPublications.values
            .compactMap { $0.track as? VideoTrack }
            .first { $0.source == .screenShareVideo }
    }
}
