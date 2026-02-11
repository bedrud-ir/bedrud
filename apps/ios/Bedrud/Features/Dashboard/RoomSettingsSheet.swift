import SwiftUI

struct RoomSettingsSheet: View {
    let room: UserRoomResponse
    let roomAPI: RoomAPI?
    var onSaved: (() -> Void)?

    @Environment(\.dismiss) private var dismiss
    @State private var allowChat: Bool
    @State private var allowVideo: Bool
    @State private var allowAudio: Bool
    @State private var requireApproval: Bool
    @State private var e2ee: Bool
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(room: UserRoomResponse, roomAPI: RoomAPI?, onSaved: (() -> Void)? = nil) {
        self.room = room
        self.roomAPI = roomAPI
        self.onSaved = onSaved
        _allowChat = State(initialValue: room.settings.allowChat)
        _allowVideo = State(initialValue: room.settings.allowVideo)
        _allowAudio = State(initialValue: room.settings.allowAudio)
        _requireApproval = State(initialValue: room.settings.requireApproval)
        _e2ee = State(initialValue: room.settings.e2ee)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Media") {
                    Toggle("Allow Video", isOn: $allowVideo)
                    Toggle("Allow Audio", isOn: $allowAudio)
                    Toggle("Allow Chat", isOn: $allowChat)
                }

                Section("Security") {
                    Toggle("Require Approval", isOn: $requireApproval)
                    Toggle("End-to-End Encryption", isOn: $e2ee)
                }

                if let errorMessage {
                    Section {
                        Label(errorMessage, systemImage: "xmark.circle.fill")
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }
                }
            }
            .navigationTitle("Room Settings")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await save() }
                    }
                    .disabled(isSaving)
                }
            }
        }
        .presentationDetents([.medium])
    }

    private func save() async {
        guard let roomAPI else { return }
        isSaving = true
        errorMessage = nil

        let settings = RoomSettings(
            allowChat: allowChat,
            allowVideo: allowVideo,
            allowAudio: allowAudio,
            requireApproval: requireApproval,
            e2ee: e2ee
        )

        do {
            try await roomAPI.updateRoomSettings(roomId: room.id, settings: settings)
            onSaved?()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }

        isSaving = false
    }
}
