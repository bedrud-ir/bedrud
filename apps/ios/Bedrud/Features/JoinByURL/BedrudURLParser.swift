import Foundation

struct BedrudMeetingURL {
    let serverBaseURL: String
    let roomName: String
}

enum BedrudURLParser {
    /// Parses a Bedrud meeting URL.
    ///
    /// Accepted formats:
    /// - `https://server.com/c/room-name`
    /// - `https://server.com/m/room-name`
    /// - `server.com/c/room-name` (scheme defaults to https)
    /// - `https://server.com:8080/c/room-name` (port numbers)
    static func parse(_ rawURL: String) -> BedrudMeetingURL? {
        var urlString = rawURL.trimmingCharacters(in: .whitespacesAndNewlines)

        // Add scheme if missing
        if !urlString.contains("://") {
            urlString = "https://\(urlString)"
        }

        guard let url = URL(string: urlString),
              let host = url.host,
              !host.isEmpty
        else { return nil }

        let pathComponents = url.pathComponents.filter { $0 != "/" }

        // Expect /c/<room> or /m/<room>
        guard pathComponents.count >= 2,
              ["c", "m"].contains(pathComponents[0])
        else { return nil }

        let roomName = pathComponents[1]
        guard !roomName.isEmpty else { return nil }

        // Build base URL: scheme + host + optional port
        var baseURL = "\(url.scheme ?? "https")://\(host)"
        if let port = url.port {
            baseURL += ":\(port)"
        }

        return BedrudMeetingURL(serverBaseURL: baseURL, roomName: roomName)
    }
}
