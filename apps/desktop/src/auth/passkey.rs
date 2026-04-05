// Passkey WebAuthn stub — implementation in Task 9
use anyhow::Result;
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};

pub fn b64url(data: &[u8]) -> String {
    URL_SAFE_NO_PAD.encode(data)
}

pub fn decode_challenge(challenge: &str) -> Result<Vec<u8>> {
    Ok(URL_SAFE_NO_PAD.decode(challenge)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn b64url_roundtrip() {
        let data = b"hello world challenge bytes";
        let encoded = b64url(data);
        let decoded = decode_challenge(&encoded).unwrap();
        assert_eq!(decoded, data);
    }
}
