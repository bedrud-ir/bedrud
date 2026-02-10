import SwiftUI

// MARK: - Shared Bedrud Styles
// Used by MeetingView, DashboardView, RoomCardView, etc.

struct BedrudTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<_Label>) -> some View {
        configuration
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(BedrudColors.muted)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(BedrudColors.border, lineWidth: 1)
            )
            .font(BedrudTypography.body)
    }
}

struct BedrudPrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(isEnabled ? BedrudColors.primary : BedrudColors.muted)
            .foregroundStyle(isEnabled ? BedrudColors.primaryForeground : BedrudColors.mutedForeground)
            .cornerRadius(8)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
    }
}

struct BedrudSecondaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(BedrudColors.secondary)
            .foregroundStyle(BedrudColors.secondaryForeground)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(BedrudColors.border, lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.9 : 1.0)
    }
}
