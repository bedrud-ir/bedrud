package com.bedrud.app.ui.screens.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.MeetingRoom
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Token
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.ListItem
import androidx.compose.material3.ListItemDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.bedrud.app.core.instance.InstanceManager
import com.bedrud.app.models.AdminRoom
import com.bedrud.app.models.AdminSettings
import com.bedrud.app.models.AdminUser
import com.bedrud.app.models.CreateInviteTokenRequest
import com.bedrud.app.models.InviteToken
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.koin.compose.koinInject

// ── Admin root (tab navigation) ───────────────────────────────────────────────

private enum class AdminTab(val label: String, val icon: ImageVector) {
    OVERVIEW("Overview", Icons.Default.AdminPanelSettings),
    USERS("Users", Icons.Default.Group),
    ROOMS("Rooms", Icons.Default.MeetingRoom),
    SETTINGS("Settings", Icons.Default.Settings)
}

@Composable
fun AdminScreen(
    modifier: Modifier = Modifier,
    instanceManager: InstanceManager = koinInject()
) {
    val adminApi = instanceManager.adminApi.collectAsState().value ?: return
    val authManager = instanceManager.authManager.collectAsState().value
    val currentUser by remember(authManager) {
        authManager?.currentUser ?: kotlinx.coroutines.flow.MutableStateFlow(null)
    }.collectAsState()

    // Only show admin panel to admins
    if (currentUser?.isAdmin != true) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Access denied. Admin privileges required.",
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        return
    }

    var selectedTab by rememberSaveable { mutableIntStateOf(0) }

    Scaffold(
        modifier = modifier,
        bottomBar = {
            NavigationBar {
                AdminTab.entries.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) }
                    )
                }
            }
        }
    ) { padding ->
        when (AdminTab.entries[selectedTab]) {
            AdminTab.OVERVIEW -> AdminOverviewContent(modifier = Modifier.padding(padding), adminApi = adminApi)
            AdminTab.USERS -> AdminUsersContent(modifier = Modifier.padding(padding), adminApi = adminApi)
            AdminTab.ROOMS -> AdminRoomsContent(modifier = Modifier.padding(padding), adminApi = adminApi)
            AdminTab.SETTINGS -> AdminSettingsContent(modifier = Modifier.padding(padding), adminApi = adminApi)
        }
    }
}

// ── Overview ──────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun AdminOverviewContent(
    modifier: Modifier = Modifier,
    adminApi: com.bedrud.app.core.api.AdminApi
) {
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    var users by remember { mutableStateOf<List<AdminUser>>(emptyList()) }
    var rooms by remember { mutableStateOf<List<AdminRoom>>(emptyList()) }
    var onlineCount by remember { mutableIntStateOf(0) }
    var isLoading by remember { mutableStateOf(true) }
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    suspend fun load() {
        isLoading = true
        try {
            users = adminApi.listUsers().body()?.users ?: emptyList()
            rooms = adminApi.listRooms().body()?.rooms ?: emptyList()
            onlineCount = adminApi.getOnlineCount().body()?.get("count") ?: 0
        } catch (e: Exception) {
            snackbarHostState.showSnackbar(e.message ?: "Failed to load data")
        }
        isLoading = false
    }

    LaunchedEffect(adminApi) {
        load()
        // Auto-refresh online count every 30s
        while (true) {
            delay(30_000L)
            try { onlineCount = adminApi.getOnlineCount().body()?.get("count") ?: onlineCount } catch (_: Exception) {}
        }
    }

    Scaffold(
        modifier = modifier,
        topBar = { LargeTopAppBar(title = { Text("Admin Overview") }, scrollBehavior = scrollBehavior) },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .nestedScroll(scrollBehavior.nestedScrollConnection)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (isLoading) {
                Box(Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                // Stats grid
                FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), maxItemsInEachRow = 3) {
                    StatCard("Users", users.size, Icons.Default.Person)
                    StatCard("Active rooms", rooms.count { it.isActive }, Icons.Default.MeetingRoom)
                    StatCard("Online now", onlineCount, Icons.Default.Group)
                }

                // Recent users
                ElevatedCard(shape = RoundedCornerShape(16.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Recent sign-ups", style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(8.dp))
                        users.takeLast(5).reversed().forEach { user ->
                            ListItem(
                                headlineContent = { Text(user.name, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                supportingContent = { Text(user.email, style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant) },
                                leadingContent = { Icon(Icons.Default.Person, contentDescription = null) },
                                colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: Int, icon: ImageVector) {
    ElevatedCard(shape = RoundedCornerShape(12.dp), modifier = Modifier.width(100.dp)) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(6.dp))
            Text(value.toString(), style = MaterialTheme.typography.titleLarge)
            Text(label, style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

// ── Users ─────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminUsersContent(
    modifier: Modifier = Modifier,
    adminApi: com.bedrud.app.core.api.AdminApi
) {
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    var users by remember { mutableStateOf<List<AdminUser>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var search by remember { mutableStateOf("") }
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    LaunchedEffect(Unit) {
        isLoading = true
        try { users = adminApi.listUsers().body()?.users ?: emptyList() } catch (e: Exception) {
            snackbarHostState.showSnackbar(e.message ?: "Failed to load users")
        }
        isLoading = false
    }

    val filtered = remember(users, search) {
        if (search.isBlank()) users
        else users.filter { it.name.contains(search, true) || it.email.contains(search, true) }
    }

    Scaffold(
        modifier = modifier,
        topBar = { LargeTopAppBar(title = { Text("Users") }, scrollBehavior = scrollBehavior) },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding)
                .nestedScroll(scrollBehavior.nestedScrollConnection),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            item {
                OutlinedTextField(
                    value = search, onValueChange = { search = it },
                    placeholder = { Text("Search users…") },
                    singleLine = true, shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }
            if (isLoading) {
                item {
                    Box(Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            } else {
                items(filtered, key = { it.id }) { user ->
                    ListItem(
                        headlineContent = {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(user.name, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                if (user.isAdmin) {
                                    Icon(Icons.Default.AdminPanelSettings, contentDescription = "Admin",
                                        modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                                }
                            }
                        },
                        supportingContent = { Text(user.email, style = MaterialTheme.typography.bodySmall) },
                        leadingContent = {
                            Icon(Icons.Default.Person, contentDescription = null,
                                tint = if (user.isActive) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.onSurfaceVariant)
                        },
                        trailingContent = {
                            Row {
                                IconButton(onClick = {
                                    scope.launch {
                                        try {
                                            adminApi.setUserStatus(user.id, mapOf("active" to !user.isActive))
                                            users = users.map { if (it.id == user.id) it.copy(isActive = !user.isActive) else it }
                                        } catch (e: Exception) {
                                            snackbarHostState.showSnackbar(e.message ?: "Failed")
                                        }
                                    }
                                }) {
                                    Icon(
                                        if (user.isActive) Icons.Default.Block else Icons.Default.Check,
                                        contentDescription = if (user.isActive) "Ban" else "Unban",
                                        tint = if (user.isActive) MaterialTheme.colorScheme.error
                                        else MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    )
                    HorizontalDivider()
                }
            }
        }
    }
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminRoomsContent(
    modifier: Modifier = Modifier,
    adminApi: com.bedrud.app.core.api.AdminApi
) {
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    var rooms by remember { mutableStateOf<List<AdminRoom>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    LaunchedEffect(Unit) {
        isLoading = true
        try { rooms = adminApi.listRooms().body()?.rooms ?: emptyList() } catch (e: Exception) {
            snackbarHostState.showSnackbar(e.message ?: "Failed to load rooms")
        }
        isLoading = false
    }

    Scaffold(
        modifier = modifier,
        topBar = { LargeTopAppBar(title = { Text("Rooms") }, scrollBehavior = scrollBehavior) },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding)
                .nestedScroll(scrollBehavior.nestedScrollConnection),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            if (isLoading) {
                item {
                    Box(Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            } else {
                items(rooms, key = { it.id }) { room ->
                    ListItem(
                        headlineContent = {
                            Text(room.name.ifBlank { room.id.take(8) },
                                style = MaterialTheme.typography.bodyLarge.copy(fontFamily = FontFamily.Monospace),
                                maxLines = 1, overflow = TextOverflow.Ellipsis)
                        },
                        supportingContent = {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(if (room.isActive) "● Live" else "○ Idle",
                                    color = if (room.isActive) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.bodySmall)
                                Text("Max: ${room.maxParticipants}",
                                    style = MaterialTheme.typography.bodySmall)
                            }
                        },
                        leadingContent = { Icon(Icons.Default.MeetingRoom, contentDescription = null) },
                        trailingContent = {
                            IconButton(onClick = {
                                scope.launch {
                                    try {
                                        adminApi.deleteRoom(room.id)
                                        rooms = rooms.filter { it.id != room.id }
                                    } catch (e: Exception) {
                                        snackbarHostState.showSnackbar(e.message ?: "Failed to delete")
                                    }
                                }
                            }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete",
                                    tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    )
                    HorizontalDivider()
                }
            }
        }
    }
}

// ── Settings ──────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminSettingsContent(
    modifier: Modifier = Modifier,
    adminApi: com.bedrud.app.core.api.AdminApi
) {
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    val clipboard = LocalClipboardManager.current
    var settings by remember { mutableStateOf<AdminSettings?>(null) }
    var tokens by remember { mutableStateOf<List<InviteToken>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var tokenEmail by remember { mutableStateOf("") }
    var newToken by remember { mutableStateOf<InviteToken?>(null) }
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    LaunchedEffect(Unit) {
        isLoading = true
        try {
            settings = adminApi.getSettings().body()
            tokens = adminApi.listInviteTokens().body()?.tokens ?: emptyList()
        } catch (e: Exception) {
            snackbarHostState.showSnackbar(e.message ?: "Failed to load settings")
        }
        isLoading = false
    }

    Scaffold(
        modifier = modifier,
        topBar = { LargeTopAppBar(title = { Text("System Settings") }, scrollBehavior = scrollBehavior) },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize().padding(padding)
                .nestedScroll(scrollBehavior.nestedScrollConnection)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            settings?.let { s ->
                // Registration settings
                ElevatedCard(shape = RoundedCornerShape(16.dp)) {
                    Column {
                        Text("Registration", style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(start = 16.dp, top = 16.dp, end = 16.dp, bottom = 8.dp))
                        ListItem(
                            headlineContent = { Text("Allow Registrations") },
                            trailingContent = {
                                Switch(checked = s.registrationEnabled, onCheckedChange = { newVal ->
                                    scope.launch {
                                        val updated = s.copy(registrationEnabled = newVal)
                                        try { adminApi.updateSettings(updated); settings = updated }
                                        catch (e: Exception) { snackbarHostState.showSnackbar(e.message ?: "Failed") }
                                    }
                                })
                            },
                            colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                        )
                        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                        ListItem(
                            headlineContent = { Text("Require Invite Token") },
                            trailingContent = {
                                Switch(checked = s.tokenRegistrationOnly, onCheckedChange = { newVal ->
                                    scope.launch {
                                        val updated = s.copy(tokenRegistrationOnly = newVal)
                                        try { adminApi.updateSettings(updated); settings = updated }
                                        catch (e: Exception) { snackbarHostState.showSnackbar(e.message ?: "Failed") }
                                    }
                                })
                            },
                            colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                        )
                    }
                }
            }

            // Invite tokens
            ElevatedCard(shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Invite Tokens", style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(8.dp))

                    // New token generated highlight
                    newToken?.let { tok ->
                        ElevatedCard(
                            shape = RoundedCornerShape(8.dp),
                            colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(tok.token, modifier = Modifier.weight(1f),
                                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                                    maxLines = 1, overflow = TextOverflow.Ellipsis)
                                IconButton(onClick = { clipboard.setText(AnnotatedString(tok.token)) }) {
                                    Icon(Icons.Default.ContentCopy, contentDescription = "Copy")
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(
                            value = tokenEmail, onValueChange = { tokenEmail = it },
                            placeholder = { Text("Email (optional)") },
                            singleLine = true, shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(onClick = {
                            scope.launch {
                                try {
                                    val body = CreateInviteTokenRequest(
                                        email = tokenEmail.takeIf { it.isNotBlank() },
                                        expiresInHours = 168
                                    )
                                    val created = adminApi.createInviteToken(body).body()
                                    if (created != null) {
                                        tokens = tokens + created
                                        newToken = created
                                        tokenEmail = ""
                                    }
                                } catch (e: Exception) {
                                    snackbarHostState.showSnackbar(e.message ?: "Failed")
                                }
                            }
                        }) { Text("Generate") }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    tokens.forEach { tok ->
                        ListItem(
                            headlineContent = {
                                Text(tok.token.take(16) + "…",
                                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace))
                            },
                            supportingContent = {
                                Text(if (tok.used) "Used" else tok.email ?: "No email",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (tok.used) MaterialTheme.colorScheme.error
                                    else MaterialTheme.colorScheme.onSurfaceVariant)
                            },
                            leadingContent = { Icon(Icons.Default.Token, contentDescription = null) },
                            trailingContent = {
                                Row {
                                    IconButton(onClick = { clipboard.setText(AnnotatedString(tok.token)) }) {
                                        Icon(Icons.Default.ContentCopy, contentDescription = "Copy",
                                            modifier = Modifier.size(18.dp))
                                    }
                                    IconButton(onClick = {
                                        scope.launch {
                                            try {
                                                adminApi.deleteInviteToken(tok.id)
                                                tokens = tokens.filter { it.id != tok.id }
                                            } catch (e: Exception) {
                                                snackbarHostState.showSnackbar(e.message ?: "Failed")
                                            }
                                        }
                                    }) {
                                        Icon(Icons.Default.Delete, contentDescription = "Delete",
                                            tint = MaterialTheme.colorScheme.error,
                                            modifier = Modifier.size(18.dp))
                                    }
                                }
                            },
                            colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                        )
                        HorizontalDivider()
                    }
                }
            }
        }
    }
}
