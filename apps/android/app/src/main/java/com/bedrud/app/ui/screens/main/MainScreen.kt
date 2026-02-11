package com.bedrud.app.ui.screens.main

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.VideoCall
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.VideoCall
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.bedrud.app.core.instance.InstanceManager
import com.bedrud.app.ui.screens.dashboard.DashboardContent
import com.bedrud.app.ui.screens.profile.ProfileContent
import com.bedrud.app.ui.screens.settings.SettingsContent
import org.koin.compose.koinInject

private data class TabItem(
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

private val tabs = listOf(
    TabItem("Rooms", Icons.Filled.VideoCall, Icons.Outlined.VideoCall),
    TabItem("Profile", Icons.Filled.Person, Icons.Outlined.Person),
    TabItem("Settings", Icons.Filled.Settings, Icons.Outlined.Settings)
)

@Composable
fun MainScreen(
    onJoinRoom: (String) -> Unit,
    onLogout: () -> Unit,
    onNavigateToAddInstance: () -> Unit,
    instanceManager: InstanceManager = koinInject()
) {
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        icon = {
                            Icon(
                                if (selectedTab == index) tab.selectedIcon else tab.unselectedIcon,
                                contentDescription = tab.label
                            )
                        },
                        label = { Text(tab.label) }
                    )
                }
            }
        }
    ) { padding ->
        when (selectedTab) {
            0 -> DashboardContent(
                modifier = Modifier.padding(padding),
                onJoinRoom = onJoinRoom,
                instanceManager = instanceManager
            )
            1 -> ProfileContent(
                modifier = Modifier.padding(padding),
                onLogout = onLogout,
                onNavigateToAddInstance = onNavigateToAddInstance,
                instanceManager = instanceManager
            )
            2 -> SettingsContent(
                modifier = Modifier.padding(padding)
            )
        }
    }
}
