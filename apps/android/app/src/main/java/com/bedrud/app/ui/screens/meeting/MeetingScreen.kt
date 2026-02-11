package com.bedrud.app.ui.screens.meeting

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.CallEnd
import androidx.compose.material.icons.filled.Cameraswitch
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.ScreenShare
import androidx.compose.material.icons.filled.StopScreenShare
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VideocamOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext
import coil.compose.AsyncImage
import com.bedrud.app.core.api.RoomApi
import com.bedrud.app.core.call.CallService
import com.bedrud.app.core.instance.InstanceManager
import com.bedrud.app.core.pip.PipStateHolder
import com.bedrud.app.core.livekit.ChatMessage
import com.bedrud.app.core.livekit.ConnectionState
import com.bedrud.app.models.JoinRoomRequest
import com.bedrud.app.models.JoinRoomResponse
import io.livekit.android.compose.ui.VideoTrackView
import io.livekit.android.room.participant.Participant
import io.livekit.android.room.track.Track
import kotlinx.coroutines.launch
import org.json.JSONObject
import org.koin.compose.koinInject

@Composable
fun MeetingScreen(
    roomName: String,
    onLeave: () -> Unit,
    instanceManager: InstanceManager = koinInject(),
    pipStateHolder: PipStateHolder = koinInject()
) {
    val roomApi = instanceManager.roomApi.collectAsState().value ?: return
    val roomManager = instanceManager.roomManager.collectAsState().value ?: return
    val authManager = instanceManager.authManager.collectAsState().value
    val currentUser by (authManager?.currentUser ?: kotlinx.coroutines.flow.MutableStateFlow(null)).collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    val isInPipMode by pipStateHolder.isInPipMode.collectAsState()

    // Track meeting state for PiP
    DisposableEffect(Unit) {
        pipStateHolder.setInMeeting(true)
        onDispose {
            pipStateHolder.setInMeeting(false)
        }
    }

    val connectionState by roomManager.connectionState.collectAsState()
    val isMicEnabled by roomManager.isMicEnabled.collectAsState()
    val isCameraEnabled by roomManager.isCameraEnabled.collectAsState()
    val isScreenShareEnabled by roomManager.isScreenShareEnabled.collectAsState()
    val error by roomManager.error.collectAsState()

    val participantVersion by roomManager.participantVersion.collectAsState()
    val chatMessages by roomManager.chatMessages.collectAsState()
    var showChat by remember { mutableStateOf(false) }
    var chatInput by remember { mutableStateOf("") }

    var roomInfo by remember { mutableStateOf<JoinRoomResponse?>(null) }
    var isJoining by remember { mutableStateOf(true) }

    // Request permissions
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.values.all { it }
        if (allGranted && roomInfo != null) {
            CallService.start(context, roomName, roomInfo!!.livekitHost, roomInfo!!.token, currentUser?.avatarUrl)
        }
    }

    // Join room via API and connect to LiveKit
    LaunchedEffect(roomName) {
        try {
            val response = roomApi.joinRoom(JoinRoomRequest(roomName = roomName))
            if (response.isSuccessful) {
                roomInfo = response.body()
                val info = roomInfo!!

                // Request permissions then connect
                permissionLauncher.launch(
                    arrayOf(
                        Manifest.permission.CAMERA,
                        Manifest.permission.RECORD_AUDIO
                    )
                )
            } else {
                snackbarHostState.showSnackbar("Failed to join room")
                isJoining = false
            }
        } catch (e: Exception) {
            snackbarHostState.showSnackbar(e.message ?: "Failed to join room")
            isJoining = false
        }
    }

    // Cleanup on dispose
    DisposableEffect(Unit) {
        onDispose {
            CallService.stop(context)
        }
    }

    // Handle server-side disconnect: when connection drops after being connected, leave
    var wasConnected by remember { mutableStateOf(false) }
    LaunchedEffect(connectionState) {
        if (connectionState == ConnectionState.CONNECTED) {
            wasConnected = true
        } else if (wasConnected && connectionState == ConnectionState.DISCONNECTED) {
            onLeave()
        }
    }

    // Show error
    LaunchedEffect(error) {
        error?.let {
            snackbarHostState.showSnackbar(it)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        when (connectionState) {
            ConnectionState.DISCONNECTED,
            ConnectionState.CONNECTING -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator()
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = if (connectionState == ConnectionState.CONNECTING)
                                "Connecting to $roomName..."
                            else "Preparing...",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                }
            }

            ConnectionState.CONNECTED,
            ConnectionState.RECONNECTING -> {
                val room = roomManager.room
                if (room != null) {
                    // Video grid (recomposes when participantVersion changes)
                    val participants = remember(participantVersion) {
                        buildList {
                            room.localParticipant.let { add(it) }
                            addAll(room.remoteParticipants.values)
                        }
                    }

                    val isAdmin = roomInfo?.let { info ->
                        room.localParticipant.identity?.value == info.adminId
                    } ?: false
                    val roomId = roomInfo?.id ?: ""

                    if (isInPipMode) {
                        // PiP mode: show single participant filling the screen
                        val pipParticipant = participants.firstOrNull {
                            it.identity != room.localParticipant.identity
                        } ?: participants.firstOrNull()

                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            if (pipParticipant != null) {
                                val videoTrack = pipParticipant.getTrackPublication(Track.Source.CAMERA)
                                    ?.track as? io.livekit.android.room.track.VideoTrack
                                if (videoTrack != null) {
                                    VideoTrackView(
                                        videoTrack = videoTrack,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                } else {
                                    Text(
                                        text = (pipParticipant.name ?: "").take(1).uppercase(),
                                        style = MaterialTheme.typography.displayLarge,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    } else {
                        // Normal mode
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(padding)
                        ) {
                            Column(
                                modifier = Modifier.fillMaxSize()
                            ) {
                                // Room header
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = roomName,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = MaterialTheme.colorScheme.onBackground,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )

                                    if (connectionState == ConnectionState.RECONNECTING) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            CircularProgressIndicator(
                                                modifier = Modifier.size(14.dp),
                                                strokeWidth = 2.dp
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "Reconnecting...",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.error
                                            )
                                        }
                                    }
                                }

                                val columns = when {
                                    participants.size <= 1 -> 1
                                    participants.size <= 4 -> 2
                                    else -> 3
                                }

                                LazyVerticalGrid(
                                    columns = GridCells.Fixed(columns),
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxWidth()
                                        .padding(horizontal = 8.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    items(
                                        participants,
                                        key = { it.identity?.value ?: it.hashCode() }
                                    ) { participant ->
                                        val isLocalParticipant = participant.identity == room.localParticipant.identity
                                        ParticipantTile(
                                            participant = participant,
                                            isAdmin = isAdmin,
                                            isLocalParticipant = isLocalParticipant,
                                            roomId = roomId,
                                            roomApi = roomApi,
                                            snackbarHostState = snackbarHostState,
                                            scope = scope
                                        )
                                    }
                                }

                                // Controls bar
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    horizontalArrangement = Arrangement.SpaceEvenly,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Mic toggle
                                    SmallFloatingActionButton(
                                        onClick = { scope.launch { roomManager.toggleMicrophone() } },
                                        containerColor = if (isMicEnabled)
                                            MaterialTheme.colorScheme.surfaceVariant
                                        else MaterialTheme.colorScheme.error
                                    ) {
                                        Icon(
                                            if (isMicEnabled) Icons.Default.Mic
                                            else Icons.Default.MicOff,
                                            contentDescription = "Toggle Microphone"
                                        )
                                    }

                                    // Camera toggle
                                    SmallFloatingActionButton(
                                        onClick = { scope.launch { roomManager.toggleCamera() } },
                                        containerColor = if (isCameraEnabled)
                                            MaterialTheme.colorScheme.surfaceVariant
                                        else MaterialTheme.colorScheme.error
                                    ) {
                                        Icon(
                                            if (isCameraEnabled) Icons.Default.Videocam
                                            else Icons.Default.VideocamOff,
                                            contentDescription = "Toggle Camera"
                                        )
                                    }

                                    // Switch camera
                                    SmallFloatingActionButton(
                                        onClick = { roomManager.switchCamera() },
                                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                                    ) {
                                        Icon(
                                            Icons.Default.Cameraswitch,
                                            contentDescription = "Switch Camera"
                                        )
                                    }

                                    // Screen share toggle
                                    SmallFloatingActionButton(
                                        onClick = { scope.launch { roomManager.toggleScreenShare() } },
                                        containerColor = if (isScreenShareEnabled)
                                            MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.surfaceVariant
                                    ) {
                                        Icon(
                                            if (isScreenShareEnabled) Icons.Default.StopScreenShare
                                            else Icons.Default.ScreenShare,
                                            contentDescription = "Toggle Screen Share"
                                        )
                                    }

                                    // Chat toggle
                                    SmallFloatingActionButton(
                                        onClick = { showChat = !showChat },
                                        containerColor = if (showChat)
                                            MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.surfaceVariant
                                    ) {
                                        Icon(
                                            Icons.AutoMirrored.Filled.Chat,
                                            contentDescription = "Toggle Chat"
                                        )
                                    }

                                    // Leave call
                                    FloatingActionButton(
                                        onClick = {
                                            CallService.stop(context)
                                            onLeave()
                                        },
                                        containerColor = MaterialTheme.colorScheme.error,
                                        contentColor = MaterialTheme.colorScheme.onError,
                                        elevation = FloatingActionButtonDefaults.elevation(
                                            defaultElevation = 0.dp
                                        )
                                    ) {
                                        Icon(
                                            Icons.Default.CallEnd,
                                            contentDescription = "Leave Call"
                                        )
                                    }
                                }
                            }

                            // Chat panel - slides in from the right
                            AnimatedVisibility(
                                visible = showChat,
                                enter = slideInHorizontally(initialOffsetX = { it }),
                                exit = slideOutHorizontally(targetOffsetX = { it }),
                                modifier = Modifier.align(Alignment.CenterEnd)
                            ) {
                                ChatPanel(
                                    messages = chatMessages,
                                    chatInput = chatInput,
                                    onChatInputChange = { chatInput = it },
                                    onSend = {
                                        if (chatInput.isNotBlank()) {
                                            scope.launch {
                                                roomManager.sendChatMessage(chatInput.trim())
                                                chatInput = ""
                                            }
                                        }
                                    },
                                    onClose = { showChat = false }
                                )
                            }
                        }
                    }
                }
            }

            ConnectionState.FAILED -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Connection Failed",
                            style = MaterialTheme.typography.headlineSmall,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = error ?: "Unable to connect to the meeting",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 32.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        androidx.compose.material3.FilledTonalButton(onClick = onLeave) {
                            Text("Go Back")
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun ParticipantTile(
    participant: Participant,
    isAdmin: Boolean = false,
    isLocalParticipant: Boolean = false,
    roomId: String = "",
    roomApi: RoomApi? = null,
    snackbarHostState: SnackbarHostState? = null,
    scope: kotlinx.coroutines.CoroutineScope? = null
) {
    val videoTrack = participant.getTrackPublication(Track.Source.CAMERA)
        ?.track as? io.livekit.android.room.track.VideoTrack

    val identity = participant.identity?.value ?: "Unknown"
    val name = participant.name?.ifBlank { identity } ?: identity

    // Parse avatar URL from participant metadata
    val avatarUrl = remember(participant.metadata) {
        participant.metadata?.let { meta ->
            try {
                val obj = JSONObject(meta)
                if (obj.has("avatarUrl")) obj.getString("avatarUrl") else null
            } catch (_: Exception) { null }
        }
    }

    var showMenu by remember { mutableStateOf(false) }
    var showKickConfirm by remember { mutableStateOf(false) }
    val showAdminMenu = isAdmin && !isLocalParticipant && roomApi != null

    if (showKickConfirm) {
        AlertDialog(
            onDismissRequest = { showKickConfirm = false },
            title = { Text("Kick Participant") },
            text = { Text("Are you sure you want to kick $name from the room?") },
            confirmButton = {
                TextButton(onClick = {
                    showKickConfirm = false
                    scope?.launch {
                        try {
                            roomApi?.kickParticipant(roomId, identity)
                        } catch (e: Exception) {
                            snackbarHostState?.showSnackbar(e.message ?: "Failed to kick participant")
                        }
                    }
                }) {
                    Text("Kick", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showKickConfirm = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f)
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .then(
                if (showAdminMenu) {
                    Modifier.combinedClickable(
                        onClick = {},
                        onLongClick = { showMenu = true }
                    )
                } else Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        if (videoTrack != null) {
            VideoTrackView(
                videoTrack = videoTrack,
                modifier = Modifier.fillMaxSize()
            )
        } else if (!avatarUrl.isNullOrBlank()) {
            AsyncImage(
                model = avatarUrl,
                contentDescription = "$name avatar",
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop
            )
        } else {
            // Initials placeholder
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = name.take(1).uppercase(),
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onPrimary
                )
            }
        }

        // Name label
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(8.dp)
                .background(
                    MaterialTheme.colorScheme.surface.copy(alpha = 0.7f),
                    RoundedCornerShape(4.dp)
                )
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Text(
                text = name,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        // Admin dropdown menu
        if (showAdminMenu) {
            DropdownMenu(
                expanded = showMenu,
                onDismissRequest = { showMenu = false }
            ) {
                DropdownMenuItem(
                    text = { Text("Mute") },
                    onClick = {
                        showMenu = false
                        scope?.launch {
                            try {
                                roomApi?.muteParticipant(roomId, identity)
                            } catch (e: Exception) {
                                snackbarHostState?.showSnackbar(e.message ?: "Failed to mute")
                            }
                        }
                    }
                )
                DropdownMenuItem(
                    text = { Text("Disable Video") },
                    onClick = {
                        showMenu = false
                        scope?.launch {
                            try {
                                roomApi?.disableParticipantVideo(roomId, identity)
                            } catch (e: Exception) {
                                snackbarHostState?.showSnackbar(e.message ?: "Failed to disable video")
                            }
                        }
                    }
                )
                DropdownMenuItem(
                    text = { Text("Bring to Stage") },
                    onClick = {
                        showMenu = false
                        scope?.launch {
                            try {
                                roomApi?.bringToStage(roomId, identity)
                            } catch (e: Exception) {
                                snackbarHostState?.showSnackbar(e.message ?: "Failed")
                            }
                        }
                    }
                )
                DropdownMenuItem(
                    text = { Text("Remove from Stage") },
                    onClick = {
                        showMenu = false
                        scope?.launch {
                            try {
                                roomApi?.removeFromStage(roomId, identity)
                            } catch (e: Exception) {
                                snackbarHostState?.showSnackbar(e.message ?: "Failed")
                            }
                        }
                    }
                )
                DropdownMenuItem(
                    text = { Text("Kick", color = MaterialTheme.colorScheme.error) },
                    onClick = {
                        showMenu = false
                        showKickConfirm = true
                    }
                )
            }
        }
    }
}

@Composable
private fun ChatPanel(
    messages: List<ChatMessage>,
    chatInput: String,
    onChatInputChange: (String) -> Unit,
    onSend: () -> Unit,
    onClose: () -> Unit
) {
    val listState = rememberLazyListState()

    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Column(
        modifier = Modifier
            .width(300.dp)
            .fillMaxHeight()
            .background(MaterialTheme.colorScheme.surface)
    ) {
        // Chat header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Chat",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            IconButton(onClick = onClose) {
                Icon(
                    Icons.Default.Close,
                    contentDescription = "Close Chat"
                )
            }
        }

        // Messages list
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(messages) { message ->
                ChatBubble(message = message)
            }
        }

        // Input row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = chatInput,
                onValueChange = onChatInputChange,
                placeholder = { Text("Type a message...") },
                singleLine = true,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(24.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            IconButton(
                onClick = onSend,
                enabled = chatInput.isNotBlank()
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Send",
                    tint = if (chatInput.isNotBlank())
                        MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun ChatBubble(message: ChatMessage) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (message.isLocal) Alignment.End else Alignment.Start
    ) {
        Text(
            text = message.senderName,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(2.dp))
        Box(
            modifier = Modifier
                .background(
                    if (message.isLocal) MaterialTheme.colorScheme.primaryContainer
                    else MaterialTheme.colorScheme.surfaceVariant,
                    RoundedCornerShape(12.dp)
                )
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Text(
                text = message.text,
                style = MaterialTheme.typography.bodyMedium,
                color = if (message.isLocal) MaterialTheme.colorScheme.onPrimaryContainer
                else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
