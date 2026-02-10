package com.bedrud.app.ui.screens.instance

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.bedrud.app.core.instance.InstanceManager
import com.bedrud.app.models.Instance
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InstanceListScreen(
    onNavigateToAddInstance: () -> Unit,
    instanceManager: InstanceManager = koinInject()
) {
    val instances by instanceManager.store.instances.collectAsState()
    val activeId by instanceManager.store.activeInstanceId.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Servers") },
                actions = {
                    IconButton(onClick = onNavigateToAddInstance) {
                        Icon(Icons.Default.Add, contentDescription = "Add Server")
                    }
                }
            )
        }
    ) { padding ->
        if (instances.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "No servers configured",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                items(instances, key = { it.id }) { instance ->
                    InstanceRow(
                        instance = instance,
                        isActive = instance.id == activeId,
                        onSelect = {
                            instanceManager.switchTo(instance.id)
                        },
                        onDelete = {
                            instanceManager.removeInstance(instance.id)
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun InstanceRow(
    instance: Instance,
    isActive: Boolean,
    onSelect: () -> Unit,
    onDelete: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onSelect)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(parseColor(instance.iconColorHex)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = instance.displayName.take(1).uppercase(),
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = instance.displayName,
                    style = MaterialTheme.typography.bodyLarge,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = instance.serverURL,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        if (isActive) {
            Icon(
                Icons.Default.Check,
                contentDescription = "Active",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
        }

        IconButton(onClick = onDelete) {
            Icon(
                Icons.Default.Delete,
                contentDescription = "Delete",
                tint = MaterialTheme.colorScheme.error
            )
        }
    }
}

private fun parseColor(hex: String): Color {
    val h = hex.removePrefix("#")
    return try {
        Color(android.graphics.Color.parseColor("#$h"))
    } catch (e: Exception) {
        Color(0xFF3B82F6)
    }
}
