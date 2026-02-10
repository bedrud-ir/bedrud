package com.bedrud.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun BedrudCard(
    modifier: Modifier = Modifier,
    title: String? = null,
    subtitle: String? = null,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val shape = RoundedCornerShape(12.dp)
    val border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)

    val cardColors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface
    )

    if (onClick != null) {
        Card(
            onClick = onClick,
            modifier = modifier.fillMaxWidth(),
            shape = shape,
            border = border,
            colors = cardColors,
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            CardContent(title, subtitle, content)
        }
    } else {
        Card(
            modifier = modifier.fillMaxWidth(),
            shape = shape,
            border = border,
            colors = cardColors,
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            CardContent(title, subtitle, content)
        }
    }
}

@Composable
private fun ColumnScope.CardContent(
    title: String?,
    subtitle: String?,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        if (title != null) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
        if (subtitle != null) {
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        if (title != null || subtitle != null) {
            androidx.compose.foundation.layout.Spacer(
                modifier = Modifier.padding(top = 12.dp)
            )
        }
        content()
    }
}
