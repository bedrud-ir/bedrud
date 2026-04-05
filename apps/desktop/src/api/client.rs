use anyhow::{anyhow, Result};
use reqwest::{Client, Method};
use serde::{de::DeserializeOwned, Serialize};
use std::sync::{Arc, RwLock};

#[derive(Clone)]
pub struct ApiClient {
    inner: Client,
    base_url: Arc<RwLock<String>>,
    access_token: Arc<RwLock<Option<String>>>,
}

impl ApiClient {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            inner: Client::builder()
                .user_agent("bedrud-desktop/0.1")
                .build()
                .expect("HTTP client init failed"),
            base_url: Arc::new(RwLock::new(base_url.into())),
            access_token: Arc::new(RwLock::new(None)),
        }
    }

    pub fn set_token(&self, token: Option<String>) {
        *self.access_token.write().unwrap() = token;
    }

    pub fn set_base_url(&self, url: impl Into<String>) {
        *self.base_url.write().unwrap() = url.into();
    }

    pub fn base_url(&self) -> String {
        self.base_url.read().unwrap().clone()
    }

    async fn request<T: DeserializeOwned>(
        &self,
        method: Method,
        path: &str,
        body: Option<serde_json::Value>,
    ) -> Result<T> {
        let url = format!("{}/api{}", self.base_url.read().unwrap(), path);
        let mut req = self.inner.request(method, &url)
            .header("Content-Type", "application/json");

        if let Some(token) = self.access_token.read().unwrap().as_deref() {
            req = req.bearer_auth(token);
        }
        if let Some(body) = body {
            req = req.json(&body);
        }

        let resp = req.send().await?;
        let status = resp.status();
        if !status.is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(anyhow!("{}: {}", status, text));
        }
        Ok(resp.json::<T>().await?)
    }

    pub async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        self.request(Method::GET, path, None).await
    }

    pub async fn post<T: DeserializeOwned>(&self, path: &str, body: impl Serialize) -> Result<T> {
        self.request(Method::POST, path, Some(serde_json::to_value(body)?)).await
    }

    pub async fn put<T: DeserializeOwned>(&self, path: &str, body: impl Serialize) -> Result<T> {
        self.request(Method::PUT, path, Some(serde_json::to_value(body)?)).await
    }

    pub async fn delete<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        self.request(Method::DELETE, path, None).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockito::Server;
    use serde::Deserialize;

    #[derive(Debug, Deserialize)]
    struct TestResp { ok: bool }

    #[tokio::test]
    async fn get_sends_correct_path() {
        let mut server = Server::new_async().await;
        let mock = server.mock("GET", "/api/auth/me")
            .with_status(200)
            .with_body(r#"{"ok":true}"#)
            .create_async().await;

        let client = ApiClient::new(server.url());
        let resp: TestResp = client.get("/auth/me").await.unwrap();
        assert!(resp.ok);
        mock.assert_async().await;
    }

    #[tokio::test]
    async fn set_token_sends_bearer_header() {
        let mut server = Server::new_async().await;
        let mock = server.mock("GET", "/api/auth/me")
            .match_header("authorization", "Bearer test-token")
            .with_status(200)
            .with_body(r#"{"ok":true}"#)
            .create_async().await;

        let client = ApiClient::new(server.url());
        client.set_token(Some("test-token".into()));
        let resp: TestResp = client.get("/auth/me").await.unwrap();
        assert!(resp.ok);
        mock.assert_async().await;
    }

    #[tokio::test]
    async fn non_200_returns_error() {
        let mut server = Server::new_async().await;
        server.mock("GET", "/api/auth/me")
            .with_status(401)
            .with_body("Unauthorized")
            .create_async().await;

        let client = ApiClient::new(server.url());
        let result: Result<TestResp> = client.get("/auth/me").await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("401"));
    }
}
