use anyhow::Result;
use keyring::Entry;

const SERVICE: &str = "bedrud-desktop";

#[derive(Clone)]
pub struct SessionStore {
    instance_id: String,
}

impl SessionStore {
    pub fn new(instance_id: impl Into<String>) -> Self {
        Self { instance_id: instance_id.into() }
    }

    fn entry(&self, key: &str) -> Result<Entry> {
        Ok(Entry::new(SERVICE, &format!("{}:{}", self.instance_id, key))?)
    }

    pub fn save_access_token(&self, token: &str) -> Result<()> {
        self.entry("access_token")?.set_password(token)?;
        Ok(())
    }

    pub fn load_access_token(&self) -> Option<String> {
        self.entry("access_token").ok()?.get_password().ok()
    }

    pub fn save_refresh_token(&self, token: &str) -> Result<()> {
        self.entry("refresh_token")?.set_password(token)?;
        Ok(())
    }

    pub fn load_refresh_token(&self) -> Option<String> {
        self.entry("refresh_token").ok()?.get_password().ok()
    }

    pub fn clear(&self) -> Result<()> {
        if let Ok(e) = self.entry("access_token") { let _ = e.delete_credential(); }
        if let Ok(e) = self.entry("refresh_token") { let _ = e.delete_credential(); }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "requires OS keyring (D-Bus/secret-service on Linux, Keychain on macOS)"]
    fn save_and_load_access_token() {
        let store = SessionStore::new("test-instance-session");
        store.save_access_token("my-token").unwrap();
        let loaded = store.load_access_token().unwrap();
        assert_eq!(loaded, "my-token");
        store.clear().unwrap();
    }

    #[test]
    #[ignore = "requires OS keyring (D-Bus/secret-service on Linux, Keychain on macOS)"]
    fn clear_removes_both_tokens() {
        let store = SessionStore::new("test-instance-clear");
        store.save_access_token("aaa").unwrap();
        store.save_refresh_token("bbb").unwrap();
        store.clear().unwrap();
        assert!(store.load_access_token().is_none());
        assert!(store.load_refresh_token().is_none());
    }

    #[test]
    #[ignore = "requires OS keyring (D-Bus/secret-service on Linux, Keychain on macOS)"]
    fn load_missing_returns_none() {
        let store = SessionStore::new("nonexistent-instance-xyz-987");
        assert!(store.load_access_token().is_none());
    }
}
