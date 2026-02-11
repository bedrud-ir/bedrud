import SwiftUI

struct JoinByURLSheet: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @Environment(\.dismiss) private var dismiss

    @State private var urlText = ""
    @State private var isJoining = false
    @State private var errorMessage: String?
    @State private var joinResponse: JoinRoomResponse?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Paste meeting link", text: $urlText)
                        .autocorrectionDisabled()
                        #if os(iOS)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        #endif
                } footer: {
                    Text("Example: server.com/c/room-name")
                        .font(.caption)
                }

                if let errorMessage {
                    Section {
                        Label(errorMessage, systemImage: "xmark.circle.fill")
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }
                }

                Section {
                    Button {
                        Task { await joinByURL() }
                    } label: {
                        HStack {
                            Spacer()
                            if isJoining {
                                ProgressView()
                                    .padding(.trailing, 8)
                            }
                            Text(isJoining ? "Joining..." : "Join Meeting")
                                .font(.body.bold())
                            Spacer()
                        }
                    }
                    .disabled(urlText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isJoining)
                }
            }
            .navigationTitle("Join by URL")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            #if os(iOS)
            .fullScreenCover(item: $joinResponse) { response in
                MeetingView(joinResponse: response)
                    .environmentObject(instanceManager)
            }
            #else
            .sheet(item: $joinResponse) { response in
                MeetingView(joinResponse: response)
                    .environmentObject(instanceManager)
                    .frame(minWidth: 800, minHeight: 600)
            }
            #endif
        }
    }

    // MARK: - Join Logic

    private func joinByURL() async {
        errorMessage = nil

        guard let parsed = BedrudURLParser.parse(urlText) else {
            errorMessage = "Invalid meeting URL. Use format: server.com/c/room-name"
            return
        }

        isJoining = true
        defer { isJoining = false }

        // Check if we have a matching instance
        let matchingInstance = instanceManager.store.instances.first { instance in
            normalizeURL(instance.serverURL) == normalizeURL(parsed.serverBaseURL)
        }

        do {
            if let matchingInstance {
                // Switch to matching instance and join with its credentials
                instanceManager.switchTo(matchingInstance.id)
                // Wait briefly for rebuild
                try await Task.sleep(for: .milliseconds(200))
                guard let roomAPI = instanceManager.roomAPI else {
                    errorMessage = "Failed to connect to server."
                    return
                }
                joinResponse = try await roomAPI.joinRoom(roomName: parsed.roomName)
            } else {
                // Guest join on unknown server
                joinResponse = try await guestJoin(
                    serverBaseURL: parsed.serverBaseURL,
                    roomName: parsed.roomName
                )
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func guestJoin(serverBaseURL: String, roomName: String) async throws -> JoinRoomResponse {
        let apiBaseURL = serverBaseURL.hasSuffix("/")
            ? "\(serverBaseURL)api"
            : "\(serverBaseURL)/api"

        let client = APIClient(baseURL: apiBaseURL)
        let authAPI = AuthAPI(client: client)
        let authManager = AuthManager(instanceId: "guest-\(UUID().uuidString)", authAPI: authAPI)

        _ = try await authManager.guestLogin(name: "Guest")

        let roomAPI = RoomAPI(client: client, authManager: authManager)
        return try await roomAPI.joinRoom(roomName: roomName)
    }

    private func normalizeURL(_ url: String) -> String {
        var u = url.lowercased()
            .trimmingCharacters(in: .whitespacesAndNewlines)
        // Strip trailing slash
        while u.hasSuffix("/") { u.removeLast() }
        // Strip scheme for comparison
        if u.hasPrefix("https://") { u = String(u.dropFirst(8)) }
        if u.hasPrefix("http://") { u = String(u.dropFirst(7)) }
        return u
    }
}
