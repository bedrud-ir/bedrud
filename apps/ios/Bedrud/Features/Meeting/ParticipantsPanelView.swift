import SwiftUI
import LiveKit

struct ParticipantsPanelView: View {
    let participants: [Participant]
    let localIdentity: String?
    let isModerator: Bool
    let roomId: String
    let roomAPI: RoomAPI?
    let onClose: () -> Void

    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Participants (\(participants.count))")
                    .font(.headline)
                Spacer()
                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            Divider()

            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(participants, id: \.identity) { participant in
                        ParticipantRow(
                            participant: participant,
                            isLocal: participant.identity?.stringValue == localIdentity,
                            isModerator: isModerator,
                            roomId: roomId,
                            roomAPI: roomAPI,
                            onError: { errorMessage = $0 }
                        )
                        Divider().padding(.leading, 60)
                    }
                }
            }
        }
        .frame(width: 280)
        .background(Color(.systemBackground))
        .alert("Error", isPresented: .constant(errorMessage != nil)) {
            Button("OK") { errorMessage = nil }
        } message: { Text(errorMessage ?? "") }
    }
}

// MARK: - Participant Row

private struct ParticipantRow: View {
    let participant: Participant
    let isLocal: Bool
    let isModerator: Bool
    let roomId: String
    let roomAPI: RoomAPI?
    let onError: (String) -> Void

    @State private var showActions = false

    private var identity: String { participant.identity?.stringValue ?? "" }
    private var name: String { participant.name?.ifEmpty(identity) ?? identity }

    var body: some View {
        HStack(spacing: 10) {
            // Avatar
            Circle()
                .fill(avatarColor(for: name))
                .frame(width: 36, height: 36)
                .overlay(
                    Text(name.prefix(1).uppercased())
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                )

            // Name + labels
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Text(name)
                        .font(.subheadline)
                        .lineLimit(1)
                    if isLocal {
                        Text("you")
                            .font(.caption2)
                            .foregroundStyle(.accentColor)
                    }
                }
            }

            Spacer()

            // Moderation menu (remote participants only)
            if isModerator && !isLocal {
                Menu {
                    Button("Mute") { perform(.mute) }
                    Button("Kick", role: .destructive) { perform(.kick) }
                    Button("Ban", role: .destructive) { perform(.ban) }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .frame(width: 32, height: 32)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    private enum Action { case mute, kick, ban }

    private func perform(_ action: Action) {
        guard let api = roomAPI else { return }
        Task {
            do {
                switch action {
                case .mute: try await api.muteParticipant(roomId: roomId, identity: identity)
                case .kick: try await api.kickParticipant(roomId: roomId, identity: identity)
                case .ban:  try await api.banParticipant(roomId: roomId, identity: identity)
                }
            } catch {
                onError(error.localizedDescription)
            }
        }
    }

    private func avatarColor(for name: String) -> Color {
        let colors: [Color] = [.indigo, .purple, .teal, .cyan, .orange, .pink]
        return colors[abs(name.hashValue) % colors.count]
    }
}

// MARK: - String helper

private extension String {
    func ifEmpty(_ fallback: String) -> String {
        isEmpty ? fallback : self
    }
}
