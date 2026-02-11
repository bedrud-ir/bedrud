import SwiftUI

struct RoomCardView: View {
    let room: UserRoomResponse
    let isJoining: Bool
    let onJoin: () -> Void
    var onDelete: (() -> Void)?
    var onSettings: (() -> Void)?

    var body: some View {
        Button(action: onJoin) {
            HStack(spacing: 14) {
                // Room icon
                ZStack(alignment: .bottomTrailing) {
                    Text(String(room.name.prefix(1)).uppercased())
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .background(roomColor)
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    Circle()
                        .fill(room.isActive ? .green : .gray)
                        .frame(width: 12, height: 12)
                        .overlay(
                            Circle().stroke(Color.systemBackground, lineWidth: 2)
                        )
                        .offset(x: 3, y: 3)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(room.name)
                        .font(.body.weight(.medium))
                        .foregroundStyle(.primary)
                        .lineLimit(1)

                    HStack(spacing: 6) {
                        Label("\(room.maxParticipants ?? 0)", systemImage: "person.2")

                        if room.settings.e2ee {
                            Text("\u{00B7}")
                            Label("E2EE", systemImage: "lock.shield.fill")
                                .foregroundStyle(.green)
                        }
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }

                Spacer()

                if isJoining {
                    ProgressView()
                } else {
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .tint(.primary)
        .disabled(isJoining || !room.isActive)
        .contextMenu {
            // Info section
            Section {
                Label(room.mode.capitalized, systemImage: modeIcon)
                Label(room.isActive ? "Active" : "Inactive", systemImage: room.isActive ? "circle.fill" : "circle")
                Label("Max \(room.maxParticipants ?? 0) participants", systemImage: "person.2")
            }

            // Settings section
            Section("Settings") {
                Label(
                    room.settings.allowVideo ? "Video enabled" : "Video disabled",
                    systemImage: room.settings.allowVideo ? "video.fill" : "video.slash.fill"
                )
                Label(
                    room.settings.allowAudio ? "Audio enabled" : "Audio disabled",
                    systemImage: room.settings.allowAudio ? "mic.fill" : "mic.slash.fill"
                )
                Label(
                    room.settings.allowChat ? "Chat enabled" : "Chat disabled",
                    systemImage: room.settings.allowChat ? "bubble.left.fill" : "bubble.left.slash.fill"
                )
                if room.settings.e2ee {
                    Label("End-to-end encrypted", systemImage: "lock.shield.fill")
                }
                if room.settings.requireApproval {
                    Label("Requires approval", systemImage: "person.badge.shield.checkmark")
                }
            }

            // Actions
            Section {
                Button(action: onJoin) {
                    Label("Join Room", systemImage: "arrow.right.circle")
                }
                .disabled(!room.isActive)

                if let onSettings {
                    Button(action: onSettings) {
                        Label("Settings", systemImage: "gearshape")
                    }
                }

                if let onDelete {
                    Button(role: .destructive, action: onDelete) {
                        Label("Delete Room", systemImage: "trash")
                    }
                }
            }
        } preview: {
            RoomPreview(room: room, color: roomColor, modeIcon: modeIcon)
        }
    }

    // MARK: - Helpers

    private var modeIcon: String {
        switch room.mode.lowercased() {
        case "meeting":   return "video"
        case "webinar":   return "person.wave.2"
        case "clubhouse": return "mic"
        default:          return "rectangle.stack"
        }
    }

    var roomColor: Color {
        let colors: [Color] = [.blue, .purple, .orange, .pink, .teal, .indigo, .mint, .cyan]
        let hash = room.name.unicodeScalars.reduce(0) { $0 + Int($1.value) }
        return colors[hash % colors.count]
    }
}

// MARK: - Context Menu Preview

private struct RoomPreview: View {
    let room: UserRoomResponse
    let color: Color
    let modeIcon: String

    var body: some View {
        VStack(spacing: 16) {
            Text(String(room.name.prefix(1)).uppercased())
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .frame(width: 72, height: 72)
                .background(color)
                .clipShape(RoundedRectangle(cornerRadius: 18))

            VStack(spacing: 4) {
                Text(room.name)
                    .font(.title3.bold())

                HStack(spacing: 8) {
                    Label(room.mode.capitalized, systemImage: modeIcon)
                    Text("\u{00B7}")
                    Label("\(room.maxParticipants ?? 0)", systemImage: "person.2")
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)
            }

            HStack(spacing: 16) {
                settingPill(icon: "video.fill", enabled: room.settings.allowVideo)
                settingPill(icon: "mic.fill", enabled: room.settings.allowAudio)
                settingPill(icon: "bubble.left.fill", enabled: room.settings.allowChat)
                if room.settings.e2ee {
                    settingPill(icon: "lock.shield.fill", enabled: true, tint: .green)
                }
            }
        }
        .padding(24)
        .frame(width: 260)
    }

    private func settingPill(icon: String, enabled: Bool, tint: Color = .primary) -> some View {
        Image(systemName: icon)
            .font(.body)
            .foregroundStyle(enabled ? tint : Color.gray.opacity(0.3))
            .frame(width: 36, height: 36)
            .background(.ultraThinMaterial)
            .clipShape(Circle())
    }
}

#Preview {
    List {
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
            onJoin: {},
            onDelete: {}
        )
    }
    #if os(iOS)
    .listStyle(.insetGrouped)
    #else
    .listStyle(.inset)
    #endif
}
