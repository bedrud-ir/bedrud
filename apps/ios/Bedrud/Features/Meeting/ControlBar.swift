import SwiftUI

struct ControlBar: View {
    @ObservedObject var roomManager: RoomManager
    let onLeave: () -> Void
    @Binding var showChat: Bool

    var body: some View {
        HStack(spacing: 0) {
            Spacer()

            // Microphone toggle
            controlButton(
                icon: roomManager.isMicrophoneEnabled ? "mic.fill" : "mic.slash.fill",
                label: "Mic",
                isActive: roomManager.isMicrophoneEnabled,
                activeColor: BedrudColors.foreground,
                inactiveColor: BedrudColors.destructive
            ) {
                Task {
                    try? await roomManager.toggleMicrophone()
                }
            }

            Spacer()

            // Camera toggle
            controlButton(
                icon: roomManager.isCameraEnabled ? "video.fill" : "video.slash.fill",
                label: "Camera",
                isActive: roomManager.isCameraEnabled,
                activeColor: BedrudColors.foreground,
                inactiveColor: BedrudColors.destructive
            ) {
                Task {
                    try? await roomManager.toggleCamera()
                }
            }

            Spacer()

            // Screen share toggle
            controlButton(
                icon: roomManager.isScreenShareEnabled
                    ? "rectangle.inset.filled.and.person.filled"
                    : "rectangle.on.rectangle",
                label: "Share",
                isActive: roomManager.isScreenShareEnabled,
                activeColor: BedrudColors.accent,
                inactiveColor: BedrudColors.foreground
            ) {
                Task {
                    try? await roomManager.toggleScreenShare()
                }
            }

            Spacer()

            // Chat toggle
            controlButton(
                icon: "bubble.left.fill",
                label: "Chat",
                isActive: showChat,
                activeColor: BedrudColors.accent,
                inactiveColor: BedrudColors.foreground
            ) {
                showChat.toggle()
            }

            Spacer()

            // Leave button
            controlButton(
                icon: "phone.down.fill",
                label: "Leave",
                isActive: false,
                activeColor: BedrudColors.destructive,
                inactiveColor: BedrudColors.destructive
            ) {
                onLeave()
            }

            Spacer()
        }
        .padding(.vertical, 12)
        .padding(.bottom, 8)
        .background(BedrudColors.card)
    }

    // MARK: - Control Button

    @ViewBuilder
    private func controlButton(
        icon: String,
        label: String,
        isActive: Bool,
        activeColor: Color,
        inactiveColor: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                ZStack {
                    Circle()
                        .fill(isActive ? activeColor.opacity(0.15) : inactiveColor.opacity(0.15))
                        .frame(width: 48, height: 48)

                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundStyle(isActive ? activeColor : inactiveColor)
                }

                Text(label)
                    .font(BedrudTypography.caption)
                    .foregroundStyle(BedrudColors.mutedForeground)
            }
        }
    }
}

// MARK: - Preview

#Preview {
    VStack {
        Spacer()
        ControlBar(
            roomManager: RoomManager(),
            onLeave: {},
            showChat: .constant(false)
        )
    }
    .background(BedrudColors.background)
}
