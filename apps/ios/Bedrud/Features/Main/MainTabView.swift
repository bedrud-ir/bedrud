import SwiftUI

enum AppTab: Hashable {
    case rooms
    case profile
    case settings
    case admin
    case join
}

struct MainTabView: View {
    @EnvironmentObject private var instanceManager: InstanceManager
    @State private var selectedTab: AppTab = .rooms
    @State private var showJoinSheet = false

    private var isAdmin: Bool {
        instanceManager.authManager?.currentUser?.isAdmin == true
    }

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

            if isAdmin {
                Tab("Admin", systemImage: "shield.fill", value: AppTab.admin) {
                    AdminView()
                }
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
