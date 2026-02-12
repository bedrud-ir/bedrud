import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var settingsStore: SettingsStore
    @State private var currentPage = 0

    private let pages: [(icon: String, title: String, description: String)] = [
        (
            "video.fill",
            "Welcome to Bedrud",
            "Self-hosted video meetings you can trust. Connect with anyone, anywhere."
        ),
        (
            "lock.shield.fill",
            "HD Video Calls",
            "End-to-end encrypted, high-quality video and audio calls."
        ),
        (
            "iphone.and.arrow.right.inward",
            "Cross-Platform",
            "Works seamlessly on iOS, Android, and Web — join from any device."
        ),
        (
            "server.rack",
            "Your Server, Your Data",
            "Fully self-hosted. No third-party tracking, no data leaving your infrastructure."
        ),
    ]

    var body: some View {
        VStack {
            TabView(selection: $currentPage) {
                ForEach(Array(pages.enumerated()), id: \.offset) { index, page in
                    OnboardingPageView(
                        icon: page.icon,
                        title: page.title,
                        description: page.description
                    )
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))

            Button {
                settingsStore.hasCompletedOnboarding = true
            } label: {
                Text("Get Started")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.horizontal, 32)
            .padding(.bottom, 48)
        }
        .background(BedrudColors.background)
    }
}
