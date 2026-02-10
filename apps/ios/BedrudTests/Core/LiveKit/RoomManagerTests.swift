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
}
