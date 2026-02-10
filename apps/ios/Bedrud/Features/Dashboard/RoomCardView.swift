import SwiftUI

struct RoomCardView: View {
    let room: UserRoomResponse
    let isJoining: Bool
    let onJoin: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header row
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(room.name)
                        .font(BedrudTypography.headline)
                        .foregroundStyle(BedrudColors.foreground)
                        .lineLimit(1)

                    HStack(spacing: 8) {
                        statusBadge
                        modeBadge
                    }
                }

                Spacer()

                // Participants indicator
                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 12))
                    Text("\(room.maxParticipants)")
                        .font(BedrudTypography.caption)
                }
                .foregroundStyle(BedrudColors.mutedForeground)
            }

            // Settings row
            HStack(spacing: 12) {
                settingIndicator(icon: "video.fill", enabled: room.settings.allowVideo, label: "Video")
                settingIndicator(icon: "mic.fill", enabled: room.settings.allowAudio, label: "Audio")
                settingIndicator(icon: "bubble.left.fill", enabled: room.settings.allowChat, label: "Chat")

                if room.settings.e2ee {
                    HStack(spacing: 3) {
                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 10))
                        Text("E2EE")
                            .font(BedrudTypography.caption)
                    }
                    .foregroundStyle(BedrudColors.accent)
                }
            }

            // Join button
            Button(action: onJoin) {
                if isJoining {
                    ProgressView()
                        .tint(BedrudColors.primaryForeground)
                } else {
                    Text("Join Room")
                        .font(BedrudTypography.body.bold())
                }
            }
            .buttonStyle(BedrudPrimaryButtonStyle())
            .disabled(isJoining || !room.isActive)
        }
        .padding(16)
        .background(BedrudColors.card)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(BedrudColors.border, lineWidth: 1)
        )
    }

    // MARK: - Subviews

    private var statusBadge: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(room.isActive ? Color.green : BedrudColors.mutedForeground)
                .frame(width: 6, height: 6)

            Text(room.isActive ? "Active" : "Inactive")
                .font(BedrudTypography.caption)
                .foregroundStyle(room.isActive ? Color.green : BedrudColors.mutedForeground)
        }
    }

    private var modeBadge: some View {
        Text(room.mode.capitalized)
            .font(BedrudTypography.caption)
            .foregroundStyle(BedrudColors.accentForeground)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(BedrudColors.accent)
            .cornerRadius(4)
    }

    private func settingIndicator(icon: String, enabled: Bool, label: String) -> some View {
        HStack(spacing: 3) {
            Image(systemName: icon)
                .font(.system(size: 10))
            Text(label)
                .font(BedrudTypography.caption)
        }
        .foregroundStyle(enabled ? BedrudColors.foreground : BedrudColors.mutedForeground.opacity(0.5))
    }
}

// MARK: - Preview

#Preview {
    RoomCardView(
        room: UserRoomResponse(
            id: "1",
            name: "Team Standup",
            createdBy: "user1",
            isActive: true,
            maxParticipants: 10,
            expiresAt: "2025-12-31T00:00:00Z",
            settings: RoomSettings(
                allowChat: true,
                allowVideo: true,
                allowAudio: true,
                requireApproval: false,
                e2ee: true
            ),
            relationship: "owner",
            mode: "meeting"
        ),
        isJoining: false,
        onJoin: {}
    )
    .padding()
}
