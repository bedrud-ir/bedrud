import Foundation

struct Instance: Codable, Identifiable, Equatable {
    let id: String
    let serverURL: String
    let displayName: String
    let iconColorHex: String
    let addedAt: Date

    init(
        id: String = UUID().uuidString,
        serverURL: String,
        displayName: String,
        iconColorHex: String = Self.randomColor(),
        addedAt: Date = Date()
    ) {
        self.id = id
        self.serverURL = serverURL
        self.displayName = displayName
        self.iconColorHex = iconColorHex
        self.addedAt = addedAt
    }

    /// The API base URL derived from the server URL.
    var apiBaseURL: String {
        serverURL.hasSuffix("/") ? "\(serverURL)api" : "\(serverURL)/api"
    }

    private static func randomColor() -> String {
        let colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"]
        return colors.randomElement()!
    }
}

struct Account: Codable, Equatable {
    let instanceId: String
    var userId: String?
    var userName: String?
    var userEmail: String?
    var isLoggedIn: Bool
}

struct HealthResponse: Decodable {
    let status: String?
    let version: String?
}
