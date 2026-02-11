import SwiftUI

struct ControlBar: View {
    @ObservedObject var roomManager: RoomManager
    let onLeave: () -> Void
    @Binding var showChat: Bool

    var body: some View {
        HStack(spacing: 0) {
            Spacer()

            // Microphone
            controlButton(
                icon: roomManager.isMicrophoneEnabled ? "mic.fill" : "mic.slash.fill",
                label: "Mic",
                isActive: roomManager.isMicrophoneEnabled,
                tint: roomManager.isMicrophoneEnabled ? .primary : .red
            ) {
                Task { try? await roomManager.toggleMicrophone() }
            }

            Spacer()

            // Camera
            controlButton(
                icon: roomManager.isCameraEnabled ? "video.fill" : "video.slash.fill",
                label: "Camera",
                isActive: roomManager.isCameraEnabled,
                tint: roomManager.isCameraEnabled ? .primary : .red
            ) {
                Task { try? await roomManager.toggleCamera() }
            }

            Spacer()

            // Screen share
            controlButton(
                icon: roomManager.isScreenShareEnabled
                    ? "rectangle.inset.filled.and.person.filled"
                    : "rectangle.on.rectangle",
                label: "Share",
                isActive: roomManager.isScreenShareEnabled,
                tint: roomManager.isScreenShareEnabled ? .accentColor : .primary
            ) {
                Task { try? await roomManager.toggleScreenShare() }
            }

            Spacer()

            // Chat
            controlButton(
                icon: "bubble.left.fill",
                label: "Chat",
                isActive: showChat,
                tint: showChat ? .accentColor : .primary
            ) {
                showChat.toggle()
            }

            Spacer()

            // Leave
            Button(action: onLeave) {
                VStack(spacing: 4) {
                    Image(systemName: "phone.down.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(.white)
                        .frame(width: 48, height: 48)
                        .background(.red)
                        .clipShape(Circle())

                    Text("Leave")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .buttonStyle(.plain)

            Spacer()
        }
        .padding(.vertical, 12)
        .padding(.bottom, 8)
        .background(Color.secondarySystemBackground)
    }

    // MARK: - Control Button

    private func controlButton(
        icon: String,
        label: String,
        isActive: Bool,
        tint: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundStyle(tint)
                    .frame(width: 48, height: 48)
                    .background(tint.opacity(0.12))
                    .clipShape(Circle())

                Text(label)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .buttonStyle(.plain)
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
}
