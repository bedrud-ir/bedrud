import SwiftUI

enum AppTab: Hashable {
    case rooms
    case profile
    case settings
    case join
}

struct MainTabView: View {
    @State private var selectedTab: AppTab = .rooms
    @State private var showJoinSheet = false

    var body: some View {
        TabView(selection: tabSelection) {
            Tab("Rooms", systemImage: "rectangle.stack.fill", value: AppTab.rooms) {
                DashboardView()
            }

            Tab("Profile", systemImage: "person.fill", value: AppTab.profile) {
                ProfileView()
            }

            Tab("Settings", systemImage: "gearshape.fill", value: AppTab.settings) {
                SettingsView()
            }

            Tab("Join", systemImage: "link.badge.plus", value: AppTab.join, role: .search) {
                Text("")
            }
        }
        .tabViewStyle(.sidebarAdaptable)
        .sheet(isPresented: $showJoinSheet) {
            JoinByURLSheet()
        }
    }

    private var tabSelection: Binding<AppTab> {
        Binding {
            selectedTab
        } set: { newTab in
            if newTab == .join {
                showJoinSheet = true
            } else {
                selectedTab = newTab
            }
        }
    }
}
