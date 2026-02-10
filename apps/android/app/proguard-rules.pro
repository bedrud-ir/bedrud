# Bedrud ProGuard Rules

# Keep LiveKit classes
-keep class io.livekit.** { *; }
-keep class livekit.** { *; }

# Keep Retrofit interfaces
-keep,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}

# Keep Gson serialized models
-keep class com.bedrud.app.models.** { *; }

# Keep Credential Manager classes
-keep class androidx.credentials.** { *; }
