import SwiftUI

struct OnboardingPageView: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: icon)
                .font(.system(size: 70))
                .foregroundStyle(BedrudColors.primary)
                .padding(.bottom, 8)

            Text(title)
                .font(BedrudTypography.title)
                .foregroundStyle(BedrudColors.foreground)
                .multilineTextAlignment(.center)

            Text(description)
                .font(BedrudTypography.body)
                .foregroundStyle(BedrudColors.mutedForeground)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()
            Spacer()
        }
    }
}
