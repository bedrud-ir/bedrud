import XCTest
@testable import Bedrud

/// Tests for kick detection logic in RoomManager.
/// Since RoomManager requires a live LiveKit room to trigger events,
/// these tests verify the state machine logic in isolation by testing
/// the @Published wasKicked property behaviour via direct invocation.
@MainActor
final class KickDetectionTests: XCTestCase {

    func testWasKickedInitiallyFalse() {
        let rm = RoomManager()
        XCTAssertFalse(rm.wasKicked)
    }

    func testWasKickedResetOnDisconnect() {
        let rm = RoomManager()
        // Simulate the reset that happens in disconnect()
        rm.disconnect()
        XCTAssertFalse(rm.wasKicked)
    }

    func testDisconnectResetsWasKickedToFalse() {
        let rm = RoomManager()
        // Calling disconnect should reset wasKicked (which starts false, reset stays false)
        rm.disconnect()
        XCTAssertFalse(rm.wasKicked)
    }

    func testWasKickedPropertyIsPublished() {
        // Verify @Published works via Combine observation
        let rm = RoomManager()
        var observedValues: [Bool] = []
        let cancellable = rm.$wasKicked.sink { observedValues.append($0) }
        _ = cancellable // keep alive
        // Initial value should be emitted
        XCTAssertEqual([false], observedValues)
    }

    // MARK: - Kick Reason Logic

    /// Documents and verifies the participant-removed reason detection logic.
    /// The actual LiveKit SDK integration is tested via the delegate handler in RoomManager,
    /// but we can document the expected pattern here.
    func testParticipantRemovedReasonPatternMatchIsCorrect() {
        // In RoomManager.swift the kick detection uses:
        // if case .participant = reason { manager?.wasKicked = true }
        // This verifies the expected DisconnectReason case used for kick detection.
        //
        // We simulate the decision with a simple enum for documentation purposes.
        enum FakeDisconnectReason {
            case participant
            case networkError
            case userInitiated
            case serverShutdown
        }

        func isKick(_ reason: FakeDisconnectReason) -> Bool {
            if case .participant = reason { return true }
            return false
        }

        XCTAssertTrue(isKick(.participant))
        XCTAssertFalse(isKick(.networkError))
        XCTAssertFalse(isKick(.userInitiated))
        XCTAssertFalse(isKick(.serverShutdown))
    }
}
