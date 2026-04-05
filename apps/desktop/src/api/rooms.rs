use crate::api::client::ApiClient;
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomSettings {
    pub allow_chat: bool,
    pub allow_video: bool,
    pub allow_audio: bool,
    pub require_approval: bool,
    pub e2ee: bool,
}

impl Default for RoomSettings {
    fn default() -> Self {
        Self {
            allow_chat: true,
            allow_video: false,
            allow_audio: true,
            require_approval: false,
            e2ee: false,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Room {
    pub id: String,
    pub name: String,
    pub created_by: Option<String>,
    pub admin_id: Option<String>,
    pub is_active: bool,
    pub is_public: bool,
    pub max_participants: i32,
    pub settings: RoomSettings,
    pub mode: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinRoomResponse {
    pub id: String,
    pub name: String,
    pub token: String,
    pub livekit_host: String,
    pub admin_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRoomRequest {
    pub name: Option<String>,
    pub is_public: bool,
    pub max_participants: i32,
    pub settings: RoomSettings,
}

pub async fn list_rooms(client: &ApiClient) -> Result<Vec<Room>> {
    client.get("/room/list").await
}

pub async fn create_room(client: &ApiClient, req: CreateRoomRequest) -> Result<Room> {
    client.post("/room/create", req).await
}

pub async fn join_room(client: &ApiClient, room_name: &str) -> Result<JoinRoomResponse> {
    client.post("/room/join", serde_json::json!({ "roomName": room_name })).await
}

pub async fn guest_join_room(
    client: &ApiClient,
    room_name: &str,
    guest_name: &str,
) -> Result<JoinRoomResponse> {
    client.post("/room/guest-join", serde_json::json!({
        "roomName": room_name,
        "guestName": guest_name
    })).await
}

pub async fn delete_room(client: &ApiClient, room_id: &str) -> Result<()> {
    let _: serde_json::Value = client.delete(&format!("/room/{}", room_id)).await?;
    Ok(())
}

pub async fn kick_participant(client: &ApiClient, room_id: &str, identity: &str) -> Result<()> {
    let _: serde_json::Value = client.post(
        &format!("/room/{}/kick/{}", room_id, identity),
        serde_json::json!({})
    ).await?;
    Ok(())
}

pub async fn mute_participant(client: &ApiClient, room_id: &str, identity: &str) -> Result<()> {
    let _: serde_json::Value = client.post(
        &format!("/room/{}/mute/{}", room_id, identity),
        serde_json::json!({})
    ).await?;
    Ok(())
}

pub async fn ban_participant(client: &ApiClient, room_id: &str, identity: &str) -> Result<()> {
    let _: serde_json::Value = client.post(
        &format!("/room/{}/ban/{}", room_id, identity),
        serde_json::json!({})
    ).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api::client::ApiClient;
    use mockito::Server;

    #[tokio::test]
    async fn list_rooms_deserializes_array() {
        let mut server = Server::new_async().await;
        server.mock("GET", "/api/room/list")
            .with_status(200)
            .with_body(r#"[{"id":"r1","name":"test-room","isActive":true,"isPublic":false,"maxParticipants":20,"settings":{"allowChat":true,"allowVideo":false,"allowAudio":true,"requireApproval":false,"e2ee":false},"mode":"standard"}]"#)
            .create_async().await;

        let client = ApiClient::new(server.url());
        let rooms = list_rooms(&client).await.unwrap();
        assert_eq!(rooms.len(), 1);
        assert_eq!(rooms[0].name, "test-room");
    }

    #[tokio::test]
    async fn join_room_returns_token_and_host() {
        let mut server = Server::new_async().await;
        server.mock("POST", "/api/room/join")
            .with_status(200)
            .with_body(r#"{"id":"r1","name":"test-room","token":"lk-token","livekitHost":"ws://lk:7880","adminId":"u1"}"#)
            .create_async().await;

        let client = ApiClient::new(server.url());
        let resp = join_room(&client, "test-room").await.unwrap();
        assert_eq!(resp.token, "lk-token");
        assert_eq!(resp.livekit_host, "ws://lk:7880");
    }
}
