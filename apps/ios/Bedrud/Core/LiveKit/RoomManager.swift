import Foundation
import LiveKit
import Combine

#if os(iOS)
import AVFoundation
import CallKit
#endif

// MARK: - Chat Attachment

struct ChatAttachment: Equatable, Codable {
    let kind: String      // "image"
    let url: String
    let mime: String
    let w: Int
    let h: Int
    let size: Int
}

// MARK: - Chat Message

struct ChatMessage: Identifiable, Equatable {
    let id: String
    let senderName: String
    let text: String
    let timestamp: Date
    let isLocal: Bool
    let attachments: [ChatAttachment]

    init(senderName: String, text: String, isLocal: Bool = false, attachments: [ChatAttachment] = []) {
        self.id = UUID().uuidString
        self.senderName = senderName
        self.text = text
        self.timestamp = Date()
        self.isLocal = isLocal
        self.attachments = attachments
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
    @Published fileprivate(set) var wasKicked: Bool = false

    // MARK: - LiveKit Room

    private var room: LiveKit.Room?
    private var roomDelegateHandler: RoomDelegateHandler?
    private var cancellables = Set<AnyCancellable>()

    // MARK: - CallKit (iOS only)

    #if os(iOS)
    private let callController = CXCallController()
    private var callProvider: CXProvider?
    private var currentCallUUID: UUID?
    private var providerDelegate: CallProviderDelegate?
    #endif

    // MARK: - Connection State

    enum ConnectionState: Equatable {
        case disconnected
        case connecting
        case connected
        case reconnecting
        case failed(String)
    }

    // MARK: - Init

    init() {
        #if os(iOS)
        setupCallProvider()
        #endif
    }

    #if os(iOS)
    private func setupCallProvider() {
        let config = CXProviderConfiguration()
        config.supportsVideo = true
        config.maximumCallsPerCallGroup = 1
        config.supportedHandleTypes = [.generic]
        config.iconTemplateImageData = nil

        let provider = CXProvider(configuration: config)
        let delegate = CallProviderDelegate(manager: self)
        provider.setDelegate(delegate, queue: .main)
        self.callProvider = provider
        self.providerDelegate = delegate
    }
    #endif

    // MARK: - Connect

    func connect(url: String, token: String, roomName: String) async throws {
        connectionState = .connecting
        error = nil

        #if os(iOS)
        // Report outgoing call to CallKit
        let callUUID = UUID()
        currentCallUUID = callUUID
        let handle = CXHandle(type: .generic, value: roomName)
        let startAction = CXStartCallAction(call: callUUID, handle: handle)
        startAction.isVideo = true
        let transaction = CXTransaction(action: startAction)
        try? await callController.request(transaction)
        #endif

        let room = LiveKit.Room()
        self.room = room

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

            #if os(iOS)
            callProvider?.reportOutgoingCall(with: callUUID, connectedAt: Date())
            #endif

            setupRoomDelegation(room)

            // Default to voice-only: camera off, mic on
            try? await room.localParticipant.setCamera(enabled: false)
            isCameraEnabled = false
            try? await room.localParticipant.setMicrophone(enabled: true)
            isMicrophoneEnabled = true

            updateLocalParticipant()
            updateRemoteParticipants()
        } catch {
            connectionState = .failed(error.localizedDescription)
            self.error = error.localizedDescription
            #if os(iOS)
            endCallKitCall()
            #endif
            throw error
        }
    }

    // MARK: - Disconnect

    func disconnect() async {
        await room?.disconnect()
        room = nil
        roomDelegateHandler = nil
        connectionState = .disconnected
        participants = []
        localParticipant = nil
        isMicrophoneEnabled = false
        isCameraEnabled = false
        isScreenShareEnabled = false
        chatMessages = []
        wasKicked = false
        cancellables.removeAll()
        #if os(iOS)
        endCallKitCall()
        #endif
    }

    #if os(iOS)
    private func endCallKitCall() {
        guard let uuid = currentCallUUID else { return }
        let endAction = CXEndCallAction(call: uuid)
        let transaction = CXTransaction(action: endAction)
        callController.request(transaction) { _ in }
        currentCallUUID = nil
    }
    #endif

    // MARK: - Media Controls

    func toggleMicrophone() async throws {
        guard let localParticipant = room?.localParticipant else { return }
        let newState = !isMicrophoneEnabled
        try await localParticipant.setMicrophone(enabled: newState)
        isMicrophoneEnabled = newState
        updateLocalParticipant()

        #if os(iOS)
        if let uuid = currentCallUUID {
            let muteAction = CXSetMutedCallAction(call: uuid, muted: !newState)
            let transaction = CXTransaction(action: muteAction)
            try? await callController.request(transaction)
        }
        #endif
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

    func sendChatMessage(_ text: String, attachments: [ChatAttachment] = []) async {
        guard let room else { return }
        let localParticipant = room.localParticipant
        let name = localParticipant.name ?? localParticipant.identity?.stringValue ?? "You"
        let identity = localParticipant.identity?.stringValue ?? ""

        var payload: [String: Any] = [
            "type": "chat",
            "id": UUID().uuidString,
            "timestamp": Int(Date().timeIntervalSince1970 * 1000),
            "message": text,
            "senderName": name,
            "senderIdentity": identity,
        ]

        if !attachments.isEmpty {
            let attachmentsJSON = attachments.map { att -> [String: Any] in
                ["kind": att.kind, "url": att.url, "mime": att.mime, "w": att.w, "h": att.h, "size": att.size]
            }
            payload["attachments"] = attachmentsJSON
        }

        do {
            let data = try JSONSerialization.data(withJSONObject: payload)
            try await localParticipant.publish(data: data, options: DataPublishOptions(topic: "chat", reliable: true))
        } catch {
            print("Failed to send chat message: \(error)")
        }

        let msg = ChatMessage(senderName: name, text: text, isLocal: true, attachments: attachments)
        chatMessages.append(msg)
    }

    func appendChatMessage(_ message: ChatMessage) {
        chatMessages.append(message)
    }

    // MARK: - CallKit Actions (iOS only)

    #if os(iOS)
    func handleEndCall() {
        Task {
            await disconnect()
        }
    }

    func handleSetMuted(_ muted: Bool) {
        Task {
            guard let localParticipant = room?.localParticipant else { return }
            _ = try? await localParticipant.setMicrophone(enabled: !muted)
            isMicrophoneEnabled = !muted
            updateLocalParticipant()
        }
    }
    #endif

    // MARK: - Room Delegation

    private func setupRoomDelegation(_ room: LiveKit.Room) {
        let handler = RoomDelegateHandler(manager: self)
        self.roomDelegateHandler = handler
        room.add(delegate: handler)
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

// MARK: - CallKit Provider Delegate (iOS only)

#if os(iOS)
private final class CallProviderDelegate: NSObject, CXProviderDelegate {
    private weak var manager: RoomManager?

    init(manager: RoomManager) {
        self.manager = manager
    }

    func providerDidReset(_ provider: CXProvider) {}

    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        Task { @MainActor in
            manager?.handleEndCall()
        }
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        Task { @MainActor in
            manager?.handleSetMuted(action.isMuted)
        }
        action.fulfill()
    }

    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        // LiveKit handles audio session automatically
    }

    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        // LiveKit handles audio session automatically
    }
}
#endif

// MARK: - Room Delegate Handler

private final class RoomDelegateHandler: RoomDelegate, @unchecked Sendable {
    @MainActor private weak var manager: RoomManager?

    init(manager: RoomManager) {
        MainActor.assumeIsolated {
            self.manager = manager
        }
    }

    nonisolated func room(_ room: LiveKit.Room, didUpdateConnectionState connectionState: ConnectionState, from oldConnectionState: ConnectionState) {
        Task { @MainActor in
            switch connectionState {
            case .disconnected:
                // Detect kick: LiveKit 2.11 exposes reason via room.disconnectError
                if room.disconnectError?.type == .participantRemoved {
                    manager?.wasKicked = true
                }
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
                  json["type"] as? String == "chat" else { return }

            let message = json["message"] as? String ?? ""
            let senderName = json["senderName"] as? String ?? participant?.name ?? "Unknown"

            // Parse optional attachments (forward-compatible: old clients send none)
            var attachments: [ChatAttachment] = []
            if let rawAttachments = json["attachments"] as? [[String: Any]] {
                for att in rawAttachments {
                    guard let kind = att["kind"] as? String,
                          let url = att["url"] as? String,
                          let mime = att["mime"] as? String else { continue }
                    attachments.append(ChatAttachment(
                        kind: kind,
                        url: url,
                        mime: mime,
                        w: att["w"] as? Int ?? 0,
                        h: att["h"] as? Int ?? 0,
                        size: att["size"] as? Int ?? 0
                    ))
                }
            }

            let msg = ChatMessage(senderName: senderName, text: message, isLocal: false, attachments: attachments)
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
