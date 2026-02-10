package com.bedrud.app.models

import com.google.gson.annotations.SerializedName

data class User(
    val id: String,
    val email: String,
    val name: String,
    @SerializedName("avatarUrl")
    val avatarUrl: String? = null,
    @SerializedName("isAdmin")
    val isAdmin: Boolean = false,
    val provider: String? = null
)

data class AuthTokens(
    @SerializedName("accessToken")
    val accessToken: String,
    @SerializedName("refreshToken")
    val refreshToken: String
)
