//! LiveKit room connection stub.
//! The actual LiveKit integration requires a running LiveKit server.
//! Types here mirror the livekit Rust SDK v0.4 API for future wiring.

use serde::{Deserialize, Serialize};

pub struct RoomConfig {
    pub url: String,
    pub token: String,
}

/// System message sent over LiveKit data channel (topic: "system").
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemMessage {
    #[serde(rename = "type")]
    pub msg_type: String,
    pub event: String,
    pub actor: String,
    pub target: String,
    pub ts: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn system_message_roundtrip() {
        let msg = SystemMessage {
            msg_type: "system".into(),
            event: "kick".into(),
            actor: "mod-id".into(),
            target: "user-id".into(),
            ts: 1234567890,
        };
        let json = serde_json::to_string(&msg).unwrap();
        let parsed: SystemMessage = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.event, "kick");
        assert_eq!(parsed.target, "user-id");
    }
}
