use crate::api::client::ApiClient;
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminUser {
    pub id: String,
    pub email: String,
    pub name: String,
    pub provider: String,
    pub is_active: bool,
    pub accesses: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AdminUsersResponse {
    pub users: Vec<AdminUser>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AdminRoomsResponse {
    pub rooms: Vec<crate::api::rooms::Room>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct OnlineCountResponse {
    pub count: u32,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminSettings {
    pub id: Option<u32>,
    pub registration_enabled: bool,
    pub token_registration_only: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InviteToken {
    pub id: String,
    pub token: String,
    pub email: String,
    pub created_by: String,
    pub expires_at: String,
    pub used_at: Option<String>,
    pub used: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct InviteTokensResponse {
    pub tokens: Vec<InviteToken>,
}

pub async fn list_users(client: &ApiClient) -> Result<Vec<AdminUser>> {
    let resp: AdminUsersResponse = client.get("/admin/users").await?;
    Ok(resp.users)
}

pub async fn list_rooms(client: &ApiClient) -> Result<Vec<crate::api::rooms::Room>> {
    let resp: AdminRoomsResponse = client.get("/admin/rooms").await?;
    Ok(resp.rooms)
}

pub async fn online_count(client: &ApiClient) -> Result<u32> {
    let resp: OnlineCountResponse = client.get("/admin/online-count").await?;
    Ok(resp.count)
}

pub async fn get_settings(client: &ApiClient) -> Result<AdminSettings> {
    client.get("/admin/settings").await
}

pub async fn update_settings(client: &ApiClient, settings: AdminSettings) -> Result<AdminSettings> {
    client.put("/admin/settings", settings).await
}

pub async fn list_invite_tokens(client: &ApiClient) -> Result<Vec<InviteToken>> {
    let resp: InviteTokensResponse = client.get("/admin/invite-tokens").await?;
    Ok(resp.tokens)
}

pub async fn create_invite_token(
    client: &ApiClient,
    email: &str,
    expires_in_hours: u32,
) -> Result<InviteToken> {
    client.post("/admin/invite-tokens", serde_json::json!({
        "email": email,
        "expiresInHours": expires_in_hours
    })).await
}

pub async fn delete_invite_token(client: &ApiClient, id: &str) -> Result<()> {
    let _: serde_json::Value = client.delete(&format!("/admin/invite-tokens/{}", id)).await?;
    Ok(())
}

pub async fn kick_participant(client: &ApiClient, room_id: &str, identity: &str) -> Result<()> {
    let _: serde_json::Value = client.post(
        &format!("/admin/rooms/{}/participants/{}/kick", room_id, identity),
        serde_json::json!({})
    ).await?;
    Ok(())
}
