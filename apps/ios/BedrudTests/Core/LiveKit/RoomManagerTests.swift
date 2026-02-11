import XCTest
@testable import Bedrud

@MainActor
final class RoomManagerTests: XCTestCase {

    // MARK: - Initial State

    func testInitialStateIsDisconnected() {
        let manager = RoomManager()
        XCTAssertEqual(manager.connectionState, .disconnected)
        XCTAssertTrue(manager.participants.isEmpty)
        XCTAssertNil(manager.localParticipant)
        XCTAssertFalse(manager.isMicrophoneEnabled)
        XCTAssertFalse(manager.isCameraEnabled)
        XCTAssertFalse(manager.isScreenShareEnabled)
        XCTAssertNil(manager.error)
        XCTAssertTrue(manager.chatMessages.isEmpty)
    }

    // MARK: - ChatMessage

    func testChatMessageInit() {
        let msg = ChatMessage(senderName: "Alice", text: "Hello", isLocal: true)
        XCTAssertFalse(msg.id.isEmpty)
        XCTAssertEqual(msg.senderName, "Alice")
        XCTAssertEqual(msg.text, "Hello")
        XCTAssertTrue(msg.isLocal)
    }

    func testChatMessageEquality() {
        let msg1 = ChatMessage(senderName: "Alice", text: "Hello", isLocal: true)
        let msg2 = ChatMessage(senderName: "Alice", text: "Hello", isLocal: true)
        // Different ids (UUID-generated), so they should not be equal
        XCTAssertNotEqual(msg1, msg2)
    }

    func testChatMessageDefaultIsLocal() {
        let msg = ChatMessage(senderName: "Bob", text: "Hi")
        XCTAssertFalse(msg.isLocal)
    }

    // MARK: - ConnectionState Equatable

    func testConnectionStateEquatable() {
        XCTAssertEqual(RoomManager.ConnectionState.disconnected, .disconnected)
        XCTAssertEqual(RoomManager.ConnectionState.connecting, .connecting)
        XCTAssertEqual(RoomManager.ConnectionState.connected, .connected)
        XCTAssertEqual(RoomManager.ConnectionState.reconnecting, .reconnecting)
        XCTAssertEqual(RoomManager.ConnectionState.failed("error"), .failed("error"))
        XCTAssertNotEqual(RoomManager.ConnectionState.failed("a"), .failed("b"))
        XCTAssertNotEqual(RoomManager.ConnectionState.connected, .disconnected)
    }

    // MARK: - Disconnect Resets State

    func testDisconnectResetsAllState() async {
        let manager = RoomManager()
        // Set some state manually
        manager.isMicrophoneEnabled = true
        manager.isCameraEnabled = true

        await manager.disconnect()

        XCTAssertEqual(manager.connectionState, .disconnected)
        XCTAssertTrue(manager.participants.isEmpty)
        XCTAssertNil(manager.localParticipant)
        XCTAssertFalse(manager.isMicrophoneEnabled)
        XCTAssertFalse(manager.isCameraEnabled)
        XCTAssertFalse(manager.isScreenShareEnabled)
        XCTAssertTrue(manager.chatMessages.isEmpty)
    }

    // MARK: - ParticipantInfo

    func testParticipantInfoProperties() {
        let info = ParticipantInfo(
            id: "p1",
            identity: "user-1",
            name: "Alice",
            isLocal: false,
            isCameraEnabled: true,
            isMicrophoneEnabled: false,
            isScreenSharing: false,
            videoTrack: nil,
            screenShareTrack: nil
        )

        XCTAssertEqual(info.id, "p1")
        XCTAssertEqual(info.identity, "user-1")
        XCTAssertEqual(info.name, "Alice")
        XCTAssertFalse(info.isLocal)
        XCTAssertTrue(info.isCameraEnabled)
        XCTAssertFalse(info.isMicrophoneEnabled)
        XCTAssertNil(info.videoTrack)
    }

    // MARK: - ParticipantInfo Local

    func testParticipantInfoLocalParticipant() {
        let info = ParticipantInfo(
            id: "local",
            identity: "local",
            name: "You",
            isLocal: true,
            isCameraEnabled: false,
            isMicrophoneEnabled: true,
            isScreenSharing: true,
            videoTrack: nil,
            screenShareTrack: nil
        )

        XCTAssertTrue(info.isLocal)
        XCTAssertEqual(info.name, "You")
        XCTAssertFalse(info.isCameraEnabled)
        XCTAssertTrue(info.isMicrophoneEnabled)
        XCTAssertTrue(info.isScreenSharing)
    }

    // MARK: - AppendChatMessage

    func testAppendChatMessage() {
        let manager = RoomManager()
        XCTAssertTrue(manager.chatMessages.isEmpty)

        let msg = ChatMessage(senderName: "Alice", text: "Hello", isLocal: false)
        manager.appendChatMessage(msg)

        XCTAssertEqual(manager.chatMessages.count, 1)
        XCTAssertEqual(manager.chatMessages[0].senderName, "Alice")
        XCTAssertEqual(manager.chatMessages[0].text, "Hello")
        XCTAssertFalse(manager.chatMessages[0].isLocal)
    }

    func testAppendMultipleChatMessages() {
        let manager = RoomManager()

        manager.appendChatMessage(ChatMessage(senderName: "Alice", text: "Hello"))
        manager.appendChatMessage(ChatMessage(senderName: "Bob", text: "Hi"))
        manager.appendChatMessage(ChatMessage(senderName: "Alice", text: "How are you?"))

        XCTAssertEqual(manager.chatMessages.count, 3)
        XCTAssertEqual(manager.chatMessages[0].senderName, "Alice")
        XCTAssertEqual(manager.chatMessages[1].senderName, "Bob")
        XCTAssertEqual(manager.chatMessages[2].text, "How are you?")
    }

    // MARK: - Disconnect Clears Chat

    func testDisconnectClearsChatMessages() async {
        let manager = RoomManager()
        manager.appendChatMessage(ChatMessage(senderName: "Alice", text: "Hello"))
        manager.appendChatMessage(ChatMessage(senderName: "Bob", text: "Hi"))

        XCTAssertEqual(manager.chatMessages.count, 2)

        await manager.disconnect()

        XCTAssertTrue(manager.chatMessages.isEmpty)
    }

    // MARK: - Error State

    func testInitialErrorIsNil() {
        let manager = RoomManager()
        XCTAssertNil(manager.error)
    }

    // MARK: - ChatMessage Timestamp

    func testChatMessageTimestampIsSet() {
        let before = Date()
        let msg = ChatMessage(senderName: "Alice", text: "Hello")
        let after = Date()

        XCTAssertGreaterThanOrEqual(msg.timestamp, before)
        XCTAssertLessThanOrEqual(msg.timestamp, after)
    }

    // MARK: - ConnectionState String Representation

    func testConnectionStateFailedContainsMessage() {
        let state = RoomManager.ConnectionState.failed("Network timeout")
        if case .failed(let message) = state {
            XCTAssertEqual(message, "Network timeout")
        } else {
            XCTFail("Expected failed state")
        }
    }

    // MARK: - Multiple Disconnects

    func testMultipleDisconnectsAreIdempotent() async {
        let manager = RoomManager()
        manager.isMicrophoneEnabled = true
        manager.isCameraEnabled = true

        await manager.disconnect()
        await manager.disconnect()

        XCTAssertEqual(manager.connectionState, .disconnected)
        XCTAssertFalse(manager.isMicrophoneEnabled)
        XCTAssertFalse(manager.isCameraEnabled)
    }

    // MARK: - Disconnect Resets Screen Share

    func testDisconnectResetsScreenShare() async {
        let manager = RoomManager()
        manager.isScreenShareEnabled = true

        await manager.disconnect()

        XCTAssertFalse(manager.isScreenShareEnabled)
    }

    // MARK: - Participants Empty After Disconnect

    func testParticipantsEmptyAfterDisconnect() async {
        let manager = RoomManager()
        await manager.disconnect()

        XCTAssertTrue(manager.participants.isEmpty)
        XCTAssertNil(manager.localParticipant)
    }
}
