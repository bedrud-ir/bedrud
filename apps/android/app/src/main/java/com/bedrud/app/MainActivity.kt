package com.bedrud.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.bedrud.app.core.instance.InstanceManager
import com.bedrud.app.ui.screens.auth.LoginScreen
import com.bedrud.app.ui.screens.auth.RegisterScreen
import com.bedrud.app.ui.screens.dashboard.DashboardScreen
import com.bedrud.app.ui.screens.instance.AddInstanceScreen
import com.bedrud.app.ui.screens.instance.InstanceListScreen
import com.bedrud.app.ui.screens.meeting.MeetingScreen
import com.bedrud.app.ui.theme.BedrudTheme
import org.koin.android.ext.android.inject

class MainActivity : ComponentActivity() {

    private val instanceManager: InstanceManager by inject()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            BedrudTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    BedrudNavHost(instanceManager = instanceManager)
                }
            }
        }
    }
}

object Routes {
    const val ADD_INSTANCE = "add_instance"
    const val INSTANCES = "instances"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val DASHBOARD = "dashboard"
    const val MEETING = "meeting/{roomName}"

    fun meeting(roomName: String): String = "meeting/$roomName"
}

@Composable
fun BedrudNavHost(instanceManager: InstanceManager) {
    val navController = rememberNavController()
    val instances by instanceManager.store.instances.collectAsState()
    val authManager by instanceManager.authManager.collectAsState()
    val isLoggedIn = authManager?.isLoggedIn?.collectAsState()?.value ?: false

    // React to auth/instance state changes and navigate accordingly
    LaunchedEffect(instances.isEmpty(), isLoggedIn, authManager) {
        val target = when {
            instances.isEmpty() -> Routes.ADD_INSTANCE
            !isLoggedIn -> Routes.LOGIN
            else -> Routes.DASHBOARD
        }
        navController.navigate(target) {
            popUpTo(0) { inclusive = true }
        }
    }

    NavHost(
        navController = navController,
        startDestination = Routes.ADD_INSTANCE
    ) {
        composable(Routes.ADD_INSTANCE) {
            AddInstanceScreen(
                onInstanceAdded = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.ADD_INSTANCE) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.INSTANCES) {
            InstanceListScreen(
                onNavigateToAddInstance = {
                    navController.navigate(Routes.ADD_INSTANCE)
                }
            )
        }

        composable(Routes.LOGIN) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Routes.DASHBOARD) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Routes.REGISTER)
                },
                onBack = {
                    navController.navigate(Routes.ADD_INSTANCE) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.REGISTER) {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.REGISTER) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                }
            )
        }

        composable(Routes.DASHBOARD) {
            DashboardScreen(
                onJoinRoom = { roomName ->
                    navController.navigate(Routes.meeting(roomName))
                },
                onLogout = {
                    instanceManager.authManager.value?.logout()
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onNavigateToAddInstance = {
                    navController.navigate(Routes.ADD_INSTANCE)
                },
                onNavigateToInstances = {
                    navController.navigate(Routes.INSTANCES)
                }
            )
        }

        composable(
            route = Routes.MEETING,
            arguments = listOf(
                navArgument("roomName") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val roomName = backStackEntry.arguments?.getString("roomName") ?: return@composable
            MeetingScreen(
                roomName = roomName,
                onLeave = {
                    navController.popBackStack()
                }
            )
        }
    }
}
