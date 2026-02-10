package com.bedrud.app.ui.components

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonColors
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

enum class BedrudButtonVariant {
    PRIMARY,
    SECONDARY,
    OUTLINE,
    GHOST,
    DESTRUCTIVE
}

@Composable
fun BedrudButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: BedrudButtonVariant = BedrudButtonVariant.PRIMARY,
    enabled: Boolean = true,
    loading: Boolean = false,
    leadingIcon: @Composable (() -> Unit)? = null,
    trailingIcon: @Composable (() -> Unit)? = null
) {
    val shape = RoundedCornerShape(8.dp)

    when (variant) {
        BedrudButtonVariant.PRIMARY -> {
            Button(
                onClick = onClick,
                modifier = modifier.height(44.dp),
                enabled = enabled && !loading,
                shape = shape,
                contentPadding = PaddingValues(horizontal = 24.dp, vertical = 0.dp)
            ) {
                ButtonContent(text, loading, leadingIcon, trailingIcon)
            }
        }

        BedrudButtonVariant.SECONDARY -> {
            Button(
                onClick = onClick,
                modifier = modifier.height(44.dp),
                enabled = enabled && !loading,
                shape = shape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.secondary,
                    contentColor = MaterialTheme.colorScheme.onSecondary
                ),
                contentPadding = PaddingValues(horizontal = 24.dp, vertical = 0.dp)
            ) {
                ButtonContent(text, loading, leadingIcon, trailingIcon)
            }
        }

        BedrudButtonVariant.OUTLINE -> {
            OutlinedButton(
                onClick = onClick,
                modifier = modifier.height(44.dp),
                enabled = enabled && !loading,
                shape = shape,
                contentPadding = PaddingValues(horizontal = 24.dp, vertical = 0.dp)
            ) {
                ButtonContent(text, loading, leadingIcon, trailingIcon)
            }
        }

        BedrudButtonVariant.GHOST -> {
            TextButton(
                onClick = onClick,
                modifier = modifier.height(44.dp),
                enabled = enabled && !loading,
                shape = shape,
                contentPadding = PaddingValues(horizontal = 24.dp, vertical = 0.dp)
            ) {
                ButtonContent(text, loading, leadingIcon, trailingIcon)
            }
        }

        BedrudButtonVariant.DESTRUCTIVE -> {
            Button(
                onClick = onClick,
                modifier = modifier.height(44.dp),
                enabled = enabled && !loading,
                shape = shape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error,
                    contentColor = MaterialTheme.colorScheme.onError
                ),
                contentPadding = PaddingValues(horizontal = 24.dp, vertical = 0.dp)
            ) {
                ButtonContent(text, loading, leadingIcon, trailingIcon)
            }
        }
    }
}

@Composable
private fun ButtonContent(
    text: String,
    loading: Boolean,
    leadingIcon: @Composable (() -> Unit)?,
    trailingIcon: @Composable (() -> Unit)?
) {
    if (loading) {
        CircularProgressIndicator(
            modifier = Modifier.size(18.dp),
            strokeWidth = 2.dp,
            color = Color.Unspecified
        )
        Spacer(modifier = Modifier.width(8.dp))
    }

    leadingIcon?.let {
        it()
        Spacer(modifier = Modifier.width(8.dp))
    }

    Text(
        text = text,
        style = MaterialTheme.typography.labelLarge
    )

    trailingIcon?.let {
        Spacer(modifier = Modifier.width(8.dp))
        it()
    }
}
