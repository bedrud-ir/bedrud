use crate::api::client::ApiClient;
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub email: String,
    pub name: String,
    pub provider: String,
    pub avatar_url: Option<String>,
    pub accesses: Option<Vec<String>>,
    pub is_active: bool,
}

impl User {
    pub fn is_admin(&self) -> bool {
        self.accesses.as_ref().map_or(false, |a| {
            a.iter().any(|x| x == "admin" || x == "superadmin")
        })
    }

    pub fn is_superadmin(&self) -> bool {
        self.accesses.as_ref().map_or(false, |a| a.iter().any(|x| x == "superadmin"))
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuthResponse {
    pub user: User,
    pub tokens: AuthTokens,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PublicSettings {
    #[serde(rename = "registrationEnabled")]
    pub registration_enabled: bool,
    #[serde(rename = "tokenRegistrationOnly")]
    pub token_registration_only: bool,
}

// Passkey types
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyLoginBeginResponse {
    pub challenge: String,
    pub rp_id: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyLoginFinishRequest {
    pub credential_id: String,
    pub client_data_json: String,
    pub authenticator_data: String,
    pub signature: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeySignupBeginResponse {
    pub challenge: String,
    pub user: PasskeyUserInfo,
    pub rp: PasskeyRpInfo,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyUserInfo {
    pub id: String,
    pub name: String,
    pub display_name: String,
}

#[derive(Debug, Deserialize)]
pub struct PasskeyRpInfo {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyFinishRequest {
    pub client_data_json: String,
    pub attestation_object: String,
}

pub async fn login(client: &ApiClient, email: &str, password: &str) -> Result<AuthResponse> {
    client.post("/auth/login", serde_json::json!({
        "email": email,
        "password": password
    })).await
}

pub async fn register(
    client: &ApiClient,
    email: &str,
    name: &str,
    password: &str,
    invite_token: Option<&str>,
) -> Result<AuthResponse> {
    let mut body = serde_json::json!({
        "email": email,
        "name": name,
        "password": password
    });
    if let Some(token) = invite_token {
        body["inviteToken"] = serde_json::Value::String(token.to_string());
    }
    client.post("/auth/register", body).await
}

pub async fn guest_login(client: &ApiClient, name: &str) -> Result<AuthResponse> {
    client.post("/auth/guest-login", serde_json::json!({
        "name": name
    })).await
}

pub async fn me(client: &ApiClient) -> Result<User> {
    client.get("/auth/me").await
}

pub async fn refresh(client: &ApiClient, refresh_token: &str) -> Result<AuthTokens> {
    client.post("/auth/refresh", serde_json::json!({
        "refresh_token": refresh_token
    })).await
}

pub async fn logout(client: &ApiClient, refresh_token: &str) -> Result<()> {
    // The server returns an empty body on success; we use serde_json::Value to absorb any response
    let _: serde_json::Value = client.post("/auth/logout", serde_json::json!({
        "refresh_token": refresh_token
    })).await?;
    Ok(())
}

pub async fn get_public_settings(client: &ApiClient) -> Result<PublicSettings> {
    client.get("/auth/settings").await
}

pub async fn passkey_login_begin(client: &ApiClient) -> Result<PasskeyLoginBeginResponse> {
    client.post("/auth/passkey/login/begin", serde_json::json!({})).await
}

pub async fn passkey_login_finish(
    client: &ApiClient,
    req: PasskeyLoginFinishRequest,
) -> Result<AuthResponse> {
    client.post("/auth/passkey/login/finish", req).await
}

pub async fn passkey_signup_begin(
    client: &ApiClient,
    email: &str,
    name: &str,
    invite_token: Option<&str>,
) -> Result<PasskeySignupBeginResponse> {
    let mut body = serde_json::json!({
        "email": email,
        "name": name
    });
    if let Some(token) = invite_token {
        body["inviteToken"] = serde_json::Value::String(token.to_string());
    }
    client.post("/auth/passkey/signup/begin", body).await
}

pub async fn passkey_signup_finish(
    client: &ApiClient,
    req: PasskeyFinishRequest,
) -> Result<AuthResponse> {
    client.post("/auth/passkey/signup/finish", req).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api::client::ApiClient;
    use mockito::Server;

    fn make_auth_resp() -> serde_json::Value {
        serde_json::json!({
            "user": {
                "id": "abc",
                "email": "test@example.com",
                "name": "Test",
                "provider": "local",
                "accesses": ["user"],
                "isActive": true
            },
            "tokens": {
                "accessToken": "aaa",
                "refreshToken": "bbb"
            }
        })
    }

    #[tokio::test]
    async fn login_returns_user_and_tokens() {
        let mut server = Server::new_async().await;
        server.mock("POST", "/api/auth/login")
            .with_status(200)
            .with_body(make_auth_resp().to_string())
            .create_async().await;

        let client = ApiClient::new(server.url());
        let resp = login(&client, "test@example.com", "pass").await.unwrap();
        assert_eq!(resp.user.email, "test@example.com");
        assert_eq!(resp.tokens.access_token, "aaa");
    }

    #[test]
    fn user_is_admin_checks_accesses() {
        let user = User {
            id: "1".into(), email: "a@b.com".into(), name: "A".into(),
            provider: "local".into(), avatar_url: None,
            accesses: Some(vec!["superadmin".into()]),
            is_active: true,
        };
        assert!(user.is_admin());
        assert!(user.is_superadmin());
    }
}
