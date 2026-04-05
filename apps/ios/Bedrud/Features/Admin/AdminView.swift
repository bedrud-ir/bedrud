import SwiftUI

enum AdminTab: String, CaseIterable {
    case overview = "Overview"
    case users = "Users"
    case rooms = "Rooms"
    case settings = "Settings"

    var systemImage: String {
        switch self {
        case .overview: return "chart.bar.fill"
        case .users: return "person.3.fill"
        case .rooms: return "video.fill"
        case .settings: return "slider.horizontal.3"
        }
    }
}

struct AdminView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @State private var selectedTab: AdminTab = .overview

    var body: some View {
        if instanceManager.authManager?.currentUser?.isAdmin == true {
            TabView(selection: $selectedTab) {
                ForEach(AdminTab.allCases, id: \.self) { tab in
                    Tab(tab.rawValue, systemImage: tab.systemImage, value: tab) {
                        adminContent(for: tab)
                    }
                }
            }
            .tabViewStyle(.sidebarAdaptable)
        } else {
            ContentUnavailableView("Admin Access Required", systemImage: "lock.shield")
        }
    }

    @ViewBuilder
    private func adminContent(for tab: AdminTab) -> some View {
        switch tab {
        case .overview: AdminOverviewView()
        case .users: AdminUsersView()
        case .rooms: AdminRoomsView()
        case .settings: AdminSettingsView()
        }
    }
}
