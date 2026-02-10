package com.bedrud.app.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.bedrud.app.core.instance.InstanceManager
import com.bedrud.app.models.CreateRoomRequest
import com.bedrud.app.models.Instance
import com.bedrud.app.models.UserRoomResponse
import com.bedrud.app.ui.components.BedrudButton
import com.bedrud.app.ui.components.BedrudButtonVariant
import com.bedrud.app.ui.components.BedrudCard
import com.bedrud.app.ui.screens.instance.InstanceSwitcherSheet
import kotlinx.coroutines.launch
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onJoinRoom: (String) -> Unit,
    onLogout: () -> Unit,
    onNavigateToAddInstance: () -> Unit,
    onNavigateToInstances: () -> Unit,
    instanceManager: InstanceManager = koinInject()
) {
    val roomApi = instanceManager.roomApi.collectAsState().value ?: return
    val authManager = instanceManager.authManager.collectAsState().value ?: return
    val activeInstance = instanceManager.store.instances.collectAsState().value
        .firstOrNull { it.id == instanceManager.store.activeInstanceId.collectAsState().value }
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var rooms by remember { mutableStateOf<List<UserRoomResponse>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showCreateDialog by remember { mutableStateOf(false) }
    var showJoinDialog by remember { mutableStateOf(false) }
    var showInstanceSwitcher by remember { mutableStateOf(false) }

    val user by authManager.currentUser.collectAsState()

    fun loadRooms() {
        scope.launch {
            isLoading = true
            try {
                val response = roomApi.listRooms()
                if (response.isSuccessful) {
                    rooms = response.body() ?: emptyList()
                } else {
                    snackbarHostState.showSnackbar("Failed to load rooms")
                }
            } catch (e: Exception) {
                snackbarHostState.showSnackbar(e.message ?: "Failed to load rooms")
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadRooms()
    }

    if (showCreateDialog) {
        CreateRoomDialog(
            onDismiss = { showCreateDialog = false },
            onCreate = { name ->
                scope.launch {
                    try {
                        val response = roomApi.createRoom(
                            CreateRoomRequest(name = name.ifBlank { null })
                        )
                        if (response.isSuccessful) {
                            val room = response.body()!!
                            showCreateDialog = false
                            onJoinRoom(room.name)
                        } else {
                            snackbarHostState.showSnackbar("Failed to create room")
                        }
                    } catch (e: Exception) {
                        snackbarHostState.showSnackbar(e.message ?: "Failed to create room")
                    }
                }
            }
        )
    }

    if (showJoinDialog) {
        JoinRoomDialog(
            onDismiss = { showJoinDialog = false },
            onJoin = { roomName ->
                showJoinDialog = false
                onJoinRoom(roomName)
            }
        )
    }

    if (showInstanceSwitcher) {
        InstanceSwitcherSheet(
            instanceManager = instanceManager,
            onDismiss = { showInstanceSwitcher = false },
            onAddInstance = onNavigateToAddInstance
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    if (activeInstance != null) {
                        Box(
                            modifier = Modifier
                                .padding(start = 12.dp)
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(parseInstanceColor(activeInstance.iconColorHex))
                                .clickable { showInstanceSwitcher = true },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = activeInstance.displayName.take(1).uppercase(),
                                style = MaterialTheme.typography.labelMedium,
                                color = Color.White
                            )
                        }
                    }
                },
                title = {
                    Column {
                        Text(activeInstance?.displayName ?: "Bedrud")
                        if (user != null) {
                            Text(
                                text = user!!.name,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { loadRooms() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    IconButton(onClick = onLogout) {
                        Icon(
                            Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = "Logout"
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                FloatingActionButton(
                    onClick = { showJoinDialog = true },
                    containerColor = MaterialTheme.colorScheme.secondary,
                    contentColor = MaterialTheme.colorScheme.onSecondary
                ) {
                    Icon(Icons.Default.Link, contentDescription = "Join Room")
                }
                FloatingActionButton(
                    onClick = { showCreateDialog = true },
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Create Room")
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (rooms.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Groups,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier
                            .height(64.dp)
                            .width(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "No rooms yet",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Create a room or join one to get started",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(rooms, key = { it.id }) { room ->
                    RoomCard(room = room, onJoin = { onJoinRoom(room.name) })
                }
            }
        }
    }
}

@Composable
private fun RoomCard(
    room: UserRoomResponse,
    onJoin: () -> Unit
) {
    BedrudCard(
        onClick = onJoin
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = room.name,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = if (room.isActive) "Active" else "Inactive",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (room.isActive) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = room.mode,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Max: ${room.maxParticipants}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            BedrudButton(
                text = "Join",
                onClick = onJoin,
                variant = BedrudButtonVariant.OUTLINE
            )
        }
    }
}

@Composable
private fun CreateRoomDialog(
    onDismiss: () -> Unit,
    onCreate: (String) -> Unit
) {
    var roomName by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Room") },
        text = {
            Column {
                Text(
                    "Enter a name for your room, or leave blank for an auto-generated name.",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = roomName,
                    onValueChange = { roomName = it },
                    label = { Text("Room Name (optional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onCreate(roomName) }) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun JoinRoomDialog(
    onDismiss: () -> Unit,
    onJoin: (String) -> Unit
) {
    var roomName by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Join Room") },
        text = {
            Column {
                Text(
                    "Enter the room name or paste a meeting link.",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = roomName,
                    onValueChange = { roomName = it },
                    label = { Text("Room Name or Link") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    // Extract room name from URL if pasted as link
                    val name = roomName.trim()
                        .removePrefix("https://bedrud.com/m/")
                        .removePrefix("http://bedrud.com/m/")
                        .trim('/')
                    if (name.isNotBlank()) {
                        onJoin(name)
                    }
                },
                enabled = roomName.isNotBlank()
            ) {
                Text("Join")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

private fun parseInstanceColor(hex: String): Color {
    val h = hex.removePrefix("#")
    return try {
        Color(android.graphics.Color.parseColor("#$h"))
    } catch (e: Exception) {
        Color(0xFF3B82F6)
    }
}
