package com.bedrud.app.ui.screens.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.bedrud.app.models.RoomSettings
import com.bedrud.app.models.UserRoomResponse

@Composable
fun RoomSettingsDialog(
    room: UserRoomResponse,
    onDismiss: () -> Unit,
    onSave: (RoomSettings) -> Unit
) {
    var allowChat by remember { mutableStateOf(room.settings.allowChat) }
    var allowVideo by remember { mutableStateOf(room.settings.allowVideo) }
    var allowAudio by remember { mutableStateOf(room.settings.allowAudio) }
    var requireApproval by remember { mutableStateOf(room.settings.requireApproval) }
    var e2ee by remember { mutableStateOf(room.settings.e2ee) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Room Settings") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                SettingsToggleRow("Allow Chat", allowChat) { allowChat = it }
                SettingsToggleRow("Allow Video", allowVideo) { allowVideo = it }
                SettingsToggleRow("Allow Audio", allowAudio) { allowAudio = it }
                SettingsToggleRow("Require Approval", requireApproval) { requireApproval = it }
                SettingsToggleRow("End-to-End Encryption", e2ee) { e2ee = it }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                onSave(
                    RoomSettings(
                        allowChat = allowChat,
                        allowVideo = allowVideo,
                        allowAudio = allowAudio,
                        requireApproval = requireApproval,
                        e2ee = e2ee
                    )
                )
            }) {
                Text("Save")
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
private fun SettingsToggleRow(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.weight(1f)
        )
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}
