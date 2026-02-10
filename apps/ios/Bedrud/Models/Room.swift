import Foundation

// MARK: - Room Settings

struct RoomSettings: Codable, Equatable, Sendable {
    let allowChat: Bool
    let allowVideo: Bool
    let allowAudio: Bool
    let requireApproval: Bool
    let e2ee: Bool

    static let `default` = RoomSettings(
        allowChat: true,
        allowVideo: true,
        allowAudio: true,
        requireApproval: false,
        e2ee: false
    )
}

// MARK: - Room Participant

struct RoomParticipant: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let userId: String
    let email: String
    let name: String
    let joinedAt: String
    let isActive: Bool
    let isMuted: Bool
    let isVideoOff: Bool
    let isChatBlocked: Bool
    let permissions: String
}

// MARK: - Room

struct Room: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let name: String
    let createdBy: String
    let adminId: String
    let isActive: Bool
    let isPublic: Bool
    let maxParticipants: Int
    let expiresAt: String
    let settings: RoomSettings
    let relationship: String?
    let mode: String
    let participants: [RoomParticipant]?

    static func == (lhs: Room, rhs: Room) -> Bool {
        lhs.id == rhs.id
    }
}
