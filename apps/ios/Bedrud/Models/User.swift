import Foundation

// MARK: - User

struct User: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let email: String
    let name: String
    let avatarUrl: String?
    let isAdmin: Bool
    let provider: String?

    static func == (lhs: User, rhs: User) -> Bool {
        lhs.id == rhs.id
    }
}


