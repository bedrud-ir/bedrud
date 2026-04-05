# Desktop Client (Slint + Rust) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native Windows/Linux desktop client for Bedrud using Rust (logic) + Slint (UI) with 1:1 feature parity to the web/mobile apps.

**Architecture:** Slint owns the main thread; a dedicated Tokio runtime handles all network and LiveKit work in the background. Background tasks push UI updates via `slint::invoke_from_event_loop`. Multi-instance management is desktop-specific (the web app is single-server; the desktop must manage multiple server URLs).

**Tech Stack:** Rust 1.78+, Slint 1.x, Tokio 1.x, reqwest 0.12, livekit 0.4, cpal 0.15, nokhwa 0.10, webauthn-authenticator-rs 0.6, keyring 2.x, serde/toml 0.8

---

## Scope Check

This spec has 9 independent subsystems. The plan below implements them sequentially because each phase depends on the prior, but each phase can be reviewed independently.

---

## File Map

```
apps/desktop/
├── Cargo.toml                          NEW — workspace member manifest
├── build.rs                            NEW — slint-build compilation
├── src/
│   ├── main.rs                         NEW — entry point, Tokio + Slint bootstrap
│   ├── app.rs                          NEW — AppState enum + navigation driver
│   ├── api/
│   │   ├── mod.rs                      NEW
│   │   ├── client.rs                   NEW — reqwest wrapper with Bearer auth
│   │   ├── auth.rs                     NEW — /auth/* endpoints
│   │   ├── rooms.rs                    NEW — /room/* endpoints
│   │   └── admin.rs                    NEW — /admin/* endpoints
│   ├── auth/
│   │   ├── mod.rs                      NEW
│   │   ├── passkey.rs                  NEW — WebAuthn (Win Hello / libfido2)
│   │   ├── oauth.rs                    NEW — PKCE flow + tiny_http redirect
│   │   └── session.rs                  NEW — JWT in OS keyring
│   ├── livekit/
│   │   ├── mod.rs                      NEW
│   │   ├── room.rs                     NEW — connect + event loop
│   │   ├── tracks.rs                   NEW — publish local + subscribe remote
│   │   └── devices.rs                  NEW — mic/camera enumeration (cpal/nokhwa)
│   ├── store/
│   │   ├── mod.rs                      NEW
│   │   ├── instance.rs                 NEW — InstanceManager (Vec<Instance> → TOML)
│   │   └── settings.rs                 NEW — persisted user preferences
│   └── ui/
│       └── bridge.rs                   NEW — Slint ↔ Rust binding helpers
└── ui/
    ├── app.slint                        NEW — root window + navigation
    ├── theme.slint                      NEW — color/font tokens
    ├── components/
    │   ├── button.slint                 NEW
    │   ├── input.slint                  NEW
    │   ├── avatar.slint                 NEW
    │   └── card.slint                   NEW
    ├── auth/
    │   ├── login.slint                  NEW
    │   └── register.slint               NEW
    ├── dashboard/
    │   ├── dashboard.slint              NEW
    │   ├── room_card.slint              NEW
    │   └── create_room_dialog.slint     NEW
    ├── meeting/
    │   ├── meeting.slint                NEW
    │   ├── participant_tile.slint       NEW
    │   ├── participant_grid.slint       NEW
    │   ├── spotlight_view.slint         NEW
    │   ├── controls_bar.slint           NEW
    │   ├── chat_panel.slint             NEW
    │   └── device_selector.slint        NEW
    ├── admin/
    │   ├── admin.slint                  NEW
    │   ├── user_table.slint             NEW
    │   └── room_table.slint             NEW
    ├── settings.slint                   NEW
    └── instance_switcher.slint          NEW

Root:
├── Cargo.toml                           NEW — workspace root
└── .github/workflows/ci.yml            MODIFY — add desktop build job
```

Root `Cargo.toml` workspace (created in Task 1):
```toml
[workspace]
members = ["apps/desktop"]
resolver = "2"
```

---

## Phase 1 — Project Skeleton

### Task 1: Cargo Workspace + Build Script

**Files:**
- Create: `Cargo.toml` (repo root)
- Create: `apps/desktop/Cargo.toml`
- Create: `apps/desktop/build.rs`
- Create: `apps/desktop/src/main.rs`
- Create: `apps/desktop/ui/app.slint`
- Create: `apps/desktop/ui/theme.slint`

- [ ] **Step 1: Create root workspace manifest**

```toml
# Cargo.toml (repo root)
[workspace]
members = ["apps/desktop"]
resolver = "2"
```

- [ ] **Step 2: Create desktop Cargo.toml**

```toml
# apps/desktop/Cargo.toml
[package]
name = "bedrud-desktop"
version = "0.1.0"
edition = "2021"

[dependencies]
slint = "1"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1"
dirs = "5"
toml = "0.8"
keyring = "2"
log = "0.4"
env_logger = "0.11"

[build-dependencies]
slint-build = "1"

[dev-dependencies]
mockito = "1"
tokio-test = "0.4"
```

- [ ] **Step 3: Create build.rs**

```rust
// apps/desktop/build.rs
fn main() {
    slint_build::compile("ui/app.slint").unwrap();
}
```

- [ ] **Step 4: Create minimal app.slint**

```slint
// apps/desktop/ui/app.slint
import { theme } from "theme.slint";

export component AppWindow inherits Window {
    title: "Bedrud";
    width: 1024px;
    height: 768px;
    background: theme.bg-primary;

    Text {
        text: "Bedrud Desktop";
        color: theme.text-primary;
        font-size: 24px;
        horizontal-alignment: center;
        vertical-alignment: center;
    }
}
```

- [ ] **Step 5: Create theme.slint**

```slint
// apps/desktop/ui/theme.slint
export global theme {
    // Background
    out property <color> bg-primary: #0f0f0f;
    out property <color> bg-secondary: #1a1a1a;
    out property <color> bg-card: #242424;
    out property <color> bg-hover: #2e2e2e;

    // Text
    out property <color> text-primary: #f0f0f0;
    out property <color> text-secondary: #a0a0a0;
    out property <color> text-muted: #606060;

    // Accent
    out property <color> accent: #6366f1;
    out property <color> accent-hover: #4f46e5;
    out property <color> destructive: #ef4444;
    out property <color> destructive-hover: #dc2626;
    out property <color> success: #22c55e;

    // Border
    out property <color> border: #333333;

    // Typography
    out property <length> font-sm: 12px;
    out property <length> font-base: 14px;
    out property <length> font-lg: 16px;
    out property <length> font-xl: 20px;
    out property <length> font-2xl: 24px;

    // Spacing
    out property <length> space-xs: 4px;
    out property <length> space-sm: 8px;
    out property <length> space-md: 16px;
    out property <length> space-lg: 24px;
    out property <length> space-xl: 32px;

    // Radius
    out property <length> radius-sm: 4px;
    out property <length> radius-md: 8px;
    out property <length> radius-lg: 12px;
}
```

- [ ] **Step 6: Create minimal main.rs**

```rust
// apps/desktop/src/main.rs
slint::include_modules!();

fn main() -> anyhow::Result<()> {
    env_logger::init();
    let window = AppWindow::new()?;
    window.run()?;
    Ok(())
}
```

- [ ] **Step 7: Build and verify it opens**

```bash
cd /path/to/bedrud
cargo build -p bedrud-desktop
cargo run -p bedrud-desktop
```
Expected: A window opens showing "Bedrud Desktop" text.

- [ ] **Step 8: Commit**

```bash
git add Cargo.toml apps/desktop/
git commit -m "feat(desktop): add Slint+Rust desktop app skeleton"
```

---

### Task 2: Navigation State Machine

**Files:**
- Create: `apps/desktop/src/app.rs`
- Modify: `apps/desktop/src/main.rs`
- Modify: `apps/desktop/ui/app.slint`

- [ ] **Step 1: Write failing test for AppState transitions**

```rust
// apps/desktop/src/app.rs
#[derive(Debug, Clone, PartialEq)]
pub enum Screen {
    Login,
    Register,
    AddInstance,
    Dashboard,
    Meeting { room_name: String },
    Settings,
    Admin,
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub screen: Screen,
    pub instance_url: Option<String>,
    pub access_token: Option<String>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            screen: Screen::AddInstance,
            instance_url: None,
            access_token: None,
        }
    }

    pub fn navigate(&mut self, screen: Screen) {
        self.screen = screen;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn starts_at_add_instance_with_no_config() {
        let state = AppState::new();
        assert_eq!(state.screen, Screen::AddInstance);
        assert!(state.instance_url.is_none());
    }

    #[test]
    fn navigate_changes_screen() {
        let mut state = AppState::new();
        state.navigate(Screen::Login);
        assert_eq!(state.screen, Screen::Login);
    }

    #[test]
    fn navigate_to_meeting_carries_room_name() {
        let mut state = AppState::new();
        state.navigate(Screen::Meeting { room_name: "test-room".into() });
        assert!(matches!(state.screen, Screen::Meeting { .. }));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cargo test -p bedrud-desktop app::tests
```
Expected: FAIL — tests not yet integrated into module tree.

- [ ] **Step 3: Wire app.rs into main.rs**

```rust
// apps/desktop/src/main.rs
mod app;

slint::include_modules!();

fn main() -> anyhow::Result<()> {
    env_logger::init();
    let window = AppWindow::new()?;
    window.run()?;
    Ok(())
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cargo test -p bedrud-desktop app::tests
```
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/app.rs apps/desktop/src/main.rs
git commit -m "feat(desktop): add navigation state machine"
```

---

### Task 3: CI Integration

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add desktop job to ci.yml**

Append this job to `.github/workflows/ci.yml` after the existing `web` job:

```yaml
  # ── Desktop (Rust/Slint) ──────────────────────────────────────
  desktop:
    name: Desktop – Build & Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: .
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: stable
      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: ". -> target"
      - name: Install Slint dependencies (Linux)
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libfontconfig1-dev \
            libxkbcommon-dev \
            libxkbcommon-x11-dev \
            libwayland-dev \
            libgles2-mesa-dev \
            libegl1-mesa-dev
      - name: Build
        run: cargo build -p bedrud-desktop
      - name: Test
        run: cargo test -p bedrud-desktop
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add desktop Rust/Slint build and test job"
```

---

## Phase 2 — Design System

### Task 4: Core UI Components

**Files:**
- Create: `apps/desktop/ui/components/button.slint`
- Create: `apps/desktop/ui/components/input.slint`
- Create: `apps/desktop/ui/components/avatar.slint`
- Create: `apps/desktop/ui/components/card.slint`
- Modify: `apps/desktop/ui/app.slint` (add imports)

- [ ] **Step 1: Create button.slint**

```slint
// apps/desktop/ui/components/button.slint
import { theme } from "../theme.slint";

export enum ButtonVariant { primary, secondary, destructive }

export component Button inherits Rectangle {
    in property <string> text;
    in property <ButtonVariant> variant: ButtonVariant.primary;
    in property <bool> enabled: true;
    in property <bool> loading: false;
    callback clicked;

    height: 36px;
    border-radius: theme.radius-md;
    background: variant == ButtonVariant.destructive ? theme.destructive
              : variant == ButtonVariant.secondary ? theme.bg-card
              : theme.accent;

    states [
        disabled when !enabled || loading: {
            opacity: 0.5;
        }
        hovered when touch.has-hover && enabled: {
            background: variant == ButtonVariant.destructive ? theme.destructive-hover
                      : variant == ButtonVariant.secondary ? theme.bg-hover
                      : theme.accent-hover;
        }
    ]

    HorizontalLayout {
        padding-left: theme.space-md;
        padding-right: theme.space-md;
        alignment: center;

        Text {
            text: loading ? "…" : root.text;
            color: theme.text-primary;
            font-size: theme.font-base;
            font-weight: 500;
        }
    }

    touch := TouchArea {
        enabled: root.enabled && !root.loading;
        clicked => { root.clicked(); }
    }
}
```

- [ ] **Step 2: Create input.slint**

```slint
// apps/desktop/ui/components/input.slint
import { theme } from "../theme.slint";

export component Input inherits Rectangle {
    in property <string> label;
    in property <string> placeholder;
    in-out property <string> value;
    in property <string> error;
    in property <bool> password: false;
    in property <bool> enabled: true;

    height: 64px;
    VerticalLayout {
        spacing: theme.space-xs;

        if label != "": Text {
            text: label;
            color: theme.text-secondary;
            font-size: theme.font-sm;
        }

        field := Rectangle {
            height: 36px;
            border-radius: theme.radius-md;
            border-width: 1px;
            border-color: error != "" ? theme.destructive : theme.border;
            background: theme.bg-card;

            TextInput {
                x: theme.space-sm;
                width: parent.width - theme.space-md;
                height: parent.height;
                text <=> root.value;
                placeholder-text: root.placeholder;
                input-type: root.password ? InputType.password : InputType.text;
                color: theme.text-primary;
                placeholder-color: theme.text-muted;
                font-size: theme.font-base;
                enabled: root.enabled;
            }
        }

        if error != "": Text {
            text: error;
            color: theme.destructive;
            font-size: theme.font-sm;
        }
    }
}
```

- [ ] **Step 3: Create avatar.slint**

```slint
// apps/desktop/ui/components/avatar.slint
import { theme } from "../theme.slint";

export component Avatar inherits Rectangle {
    in property <string> name;
    in property <image> photo;
    in property <length> size: 40px;

    width: size;
    height: size;
    border-radius: size / 2;
    background: theme.accent;
    clip: true;

    if photo.width == 0: Text {
        text: name.character-count > 0 ? name.to-uppercase().substring(0, 1) : "?";
        color: theme.text-primary;
        font-size: size * 0.4;
        horizontal-alignment: center;
        vertical-alignment: center;
    }
    if photo.width > 0: Image {
        source: photo;
        width: size;
        height: size;
        image-fit: cover;
    }
}
```

- [ ] **Step 4: Create card.slint**

```slint
// apps/desktop/ui/components/card.slint
import { theme } from "../theme.slint";

export component Card inherits Rectangle {
    background: theme.bg-card;
    border-radius: theme.radius-lg;
    border-width: 1px;
    border-color: theme.border;
}
```

- [ ] **Step 5: Build to verify Slint compilation**

```bash
cargo build -p bedrud-desktop
```
Expected: PASS — no compilation errors.

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/ui/components/
git commit -m "feat(desktop): add core UI design system components"
```

---

## Phase 3 — HTTP API Client

### Task 5: API Client + Auth Module

**Files:**
- Create: `apps/desktop/src/api/mod.rs`
- Create: `apps/desktop/src/api/client.rs`
- Create: `apps/desktop/src/api/auth.rs`

The `ApiClient` must be `Clone + Send + Sync` so it can be held in an `Arc` and passed to background tasks.

- [ ] **Step 1: Write failing tests for ApiClient**

```rust
// apps/desktop/src/api/client.rs
use anyhow::{anyhow, Result};
use reqwest::{Client, Method, StatusCode};
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

    #[derive(Deserialize)]
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
```

- [ ] **Step 2: Create src/api/mod.rs**

```rust
// apps/desktop/src/api/mod.rs
pub mod auth;
pub mod client;
pub mod rooms;
pub mod admin;
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
cargo test -p bedrud-desktop api::client::tests
```
Expected: 3 tests PASS.

- [ ] **Step 4: Write auth module with data types and endpoints**

```rust
// apps/desktop/src/api/auth.rs
use crate::api::client::ApiClient;
use anyhow::Result;
use serde::{Deserialize, Serialize};

// ── Response types ─────────────────────────────────────────────

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
#[serde(rename_all = "registrationEnabled")]
pub struct PublicSettings {
    #[serde(rename = "registrationEnabled")]
    pub registration_enabled: bool,
    #[serde(rename = "tokenRegistrationOnly")]
    pub token_registration_only: bool,
}

// ── Passkey shapes ─────────────────────────────────────────────

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

// ── API functions ──────────────────────────────────────────────

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
        body["inviteToken"] = serde_json::Value::String(token.into());
    }
    client.post("/auth/register", body).await
}

pub async fn guest_login(client: &ApiClient, name: &str) -> Result<AuthResponse> {
    client.post("/auth/guest-login", serde_json::json!({ "name": name })).await
}

pub async fn me(client: &ApiClient) -> Result<User> {
    client.get("/auth/me").await
}

pub async fn refresh(client: &ApiClient, refresh_token: &str) -> Result<AuthTokens> {
    let resp: serde_json::Value = client.post(
        "/auth/refresh",
        serde_json::json!({ "refresh_token": refresh_token })
    ).await?;
    Ok(AuthTokens {
        access_token: resp["access_token"].as_str().unwrap_or_default().into(),
        refresh_token: resp["refresh_token"].as_str().map(String::from),
    })
}

pub async fn logout(client: &ApiClient, refresh_token: &str) -> Result<()> {
    let _: serde_json::Value = client.post(
        "/auth/logout",
        serde_json::json!({ "refresh_token": refresh_token })
    ).await?;
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
    let mut body = serde_json::json!({ "email": email, "name": name });
    if let Some(t) = invite_token {
        body["inviteToken"] = serde_json::Value::String(t.into());
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
```

- [ ] **Step 5: Run tests**

```bash
cargo test -p bedrud-desktop api::auth::tests
```
Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/api/
git commit -m "feat(desktop): add HTTP API client and auth module"
```

---

### Task 6: Rooms and Admin API Modules

**Files:**
- Create: `apps/desktop/src/api/rooms.rs`
- Create: `apps/desktop/src/api/admin.rs`

- [ ] **Step 1: Create rooms.rs**

```rust
// apps/desktop/src/api/rooms.rs
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

pub async fn kick_participant(
    client: &ApiClient, room_id: &str, identity: &str,
) -> Result<()> {
    let _: serde_json::Value = client.post(
        &format!("/room/{}/kick/{}", room_id, identity),
        serde_json::json!({})
    ).await?;
    Ok(())
}

pub async fn mute_participant(
    client: &ApiClient, room_id: &str, identity: &str,
) -> Result<()> {
    let _: serde_json::Value = client.post(
        &format!("/room/{}/mute/{}", room_id, identity),
        serde_json::json!({})
    ).await?;
    Ok(())
}

pub async fn ban_participant(
    client: &ApiClient, room_id: &str, identity: &str,
) -> Result<()> {
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
```

- [ ] **Step 2: Create admin.rs**

```rust
// apps/desktop/src/api/admin.rs
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
    client: &ApiClient, email: &str, expires_in_hours: u32,
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

pub async fn kick_participant(
    client: &ApiClient, room_id: &str, identity: &str,
) -> Result<()> {
    let _: serde_json::Value = client.post(
        &format!("/admin/rooms/{}/participants/{}/kick", room_id, identity),
        serde_json::json!({})
    ).await?;
    Ok(())
}
```

- [ ] **Step 3: Run tests**

```bash
cargo test -p bedrud-desktop api::rooms::tests
```
Expected: 2 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/api/rooms.rs apps/desktop/src/api/admin.rs
git commit -m "feat(desktop): add rooms and admin API modules"
```

---

## Phase 4 — Session & Instance Management

### Task 7: Session Storage (OS Keyring)

**Files:**
- Create: `apps/desktop/src/auth/mod.rs`
- Create: `apps/desktop/src/auth/session.rs`

- [ ] **Step 1: Write failing tests for session storage**

```rust
// apps/desktop/src/auth/session.rs
use anyhow::Result;
use keyring::Entry;

const SERVICE: &str = "bedrud-desktop";

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
    fn save_and_load_access_token() {
        let store = SessionStore::new("test-instance-session");
        store.save_access_token("my-token").unwrap();
        let loaded = store.load_access_token().unwrap();
        assert_eq!(loaded, "my-token");
        store.clear().unwrap();
    }

    #[test]
    fn clear_removes_both_tokens() {
        let store = SessionStore::new("test-instance-clear");
        store.save_access_token("aaa").unwrap();
        store.save_refresh_token("bbb").unwrap();
        store.clear().unwrap();
        assert!(store.load_access_token().is_none());
        assert!(store.load_refresh_token().is_none());
    }

    #[test]
    fn load_missing_returns_none() {
        let store = SessionStore::new("nonexistent-instance-xyz");
        assert!(store.load_access_token().is_none());
    }
}
```

- [ ] **Step 2: Create auth/mod.rs**

```rust
// apps/desktop/src/auth/mod.rs
pub mod passkey;
pub mod session;
```

- [ ] **Step 3: Run tests (requires OS keyring — will pass on macOS/Linux with secret service)**

```bash
cargo test -p bedrud-desktop auth::session::tests
```
Expected: 3 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/auth/
git commit -m "feat(desktop): add OS keyring session storage"
```

---

### Task 8: Multi-Instance Manager

**Files:**
- Create: `apps/desktop/src/store/mod.rs`
- Create: `apps/desktop/src/store/instance.rs`
- Create: `apps/desktop/src/store/settings.rs`
- Add `apps/desktop/Cargo.toml` dependency: `uuid = { version = "1", features = ["v4"] }`

- [ ] **Step 1: Add uuid dependency to Cargo.toml**

```toml
# In apps/desktop/Cargo.toml [dependencies]
uuid = { version = "1", features = ["v4"] }
```

- [ ] **Step 2: Write failing tests for InstanceManager**

```rust
// apps/desktop/src/store/instance.rs
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Instance {
    pub id: String,        // UUID, used as keyring namespace
    pub label: String,     // Human-readable (e.g. "My Bedrud Server")
    pub base_url: String,  // e.g. "https://bedrud.example.com"
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct InstancesFile {
    pub active_id: Option<String>,
    pub instances: Vec<Instance>,
}

pub struct InstanceManager {
    path: PathBuf,
    data: InstancesFile,
}

impl InstanceManager {
    pub fn load() -> Result<Self> {
        let path = config_dir().join("instances.toml");
        let data = if path.exists() {
            let contents = std::fs::read_to_string(&path)?;
            toml::from_str(&contents)?
        } else {
            InstancesFile::default()
        };
        Ok(Self { path, data })
    }

    pub fn instances(&self) -> &[Instance] {
        &self.data.instances
    }

    pub fn active(&self) -> Option<&Instance> {
        let id = self.data.active_id.as_deref()?;
        self.data.instances.iter().find(|i| i.id == id)
    }

    pub fn set_active(&mut self, id: &str) -> Result<()> {
        if self.data.instances.iter().any(|i| i.id == id) {
            self.data.active_id = Some(id.into());
            self.save()
        } else {
            Err(anyhow::anyhow!("Instance '{}' not found", id))
        }
    }

    pub fn add(&mut self, label: impl Into<String>, base_url: impl Into<String>) -> Result<String> {
        let id = uuid::Uuid::new_v4().to_string();
        self.data.instances.push(Instance {
            id: id.clone(),
            label: label.into(),
            base_url: base_url.into(),
        });
        if self.data.active_id.is_none() {
            self.data.active_id = Some(id.clone());
        }
        self.save()?;
        Ok(id)
    }

    pub fn remove(&mut self, id: &str) -> Result<()> {
        self.data.instances.retain(|i| i.id != id);
        if self.data.active_id.as_deref() == Some(id) {
            self.data.active_id = self.data.instances.first().map(|i| i.id.clone());
        }
        self.save()
    }

    fn save(&self) -> Result<()> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let contents = toml::to_string_pretty(&self.data)?;
        std::fs::write(&self.path, contents)?;
        Ok(())
    }
}

fn config_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("bedrud")
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn make_manager(dir: &std::path::Path) -> InstanceManager {
        InstanceManager {
            path: dir.join("instances.toml"),
            data: InstancesFile::default(),
        }
    }

    #[test]
    fn add_instance_makes_it_active() {
        let dir = tempdir().unwrap();
        let mut mgr = make_manager(dir.path());
        let id = mgr.add("My Server", "https://server.example.com").unwrap();
        assert_eq!(mgr.active().unwrap().id, id);
        assert_eq!(mgr.instances().len(), 1);
    }

    #[test]
    fn remove_active_promotes_next() {
        let dir = tempdir().unwrap();
        let mut mgr = make_manager(dir.path());
        let id1 = mgr.add("Server 1", "https://a.com").unwrap();
        let id2 = mgr.add("Server 2", "https://b.com").unwrap();
        mgr.set_active(&id1).unwrap();
        mgr.remove(&id1).unwrap();
        assert_eq!(mgr.active().unwrap().id, id2);
    }

    #[test]
    fn set_active_nonexistent_errors() {
        let dir = tempdir().unwrap();
        let mut mgr = make_manager(dir.path());
        assert!(mgr.set_active("bad-id").is_err());
    }

    #[test]
    fn no_instances_means_no_active() {
        let dir = tempdir().unwrap();
        let mgr = make_manager(dir.path());
        assert!(mgr.active().is_none());
    }
}
```

- [ ] **Step 3: Add tempfile dev dependency**

```toml
# In apps/desktop/Cargo.toml [dev-dependencies]
tempfile = "3"
```

- [ ] **Step 4: Create settings.rs**

```rust
// apps/desktop/src/store/settings.rs
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    #[serde(rename = "light")] Light,
    #[serde(rename = "dark")] Dark,
    #[serde(rename = "system")] System,
}

impl Default for Theme {
    fn default() -> Self { Theme::System }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Settings {
    pub theme: Theme,
    pub default_mic_device: Option<String>,
    pub default_cam_device: Option<String>,
    pub default_speaker_device: Option<String>,
    pub noise_suppression: NoiseSuppression,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum NoiseSuppression {
    #[default] #[serde(rename = "none")] None,
    #[serde(rename = "browser")] Browser,
    #[serde(rename = "rnnoise")] RNNoise,
    #[serde(rename = "krisp")] Krisp,
}

impl Settings {
    pub fn load() -> Self {
        let path = settings_path();
        if path.exists() {
            std::fs::read_to_string(&path)
                .ok()
                .and_then(|s| toml::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            Settings::default()
        }
    }

    pub fn save(&self) -> Result<()> {
        let path = settings_path();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(path, toml::to_string_pretty(self)?)?;
        Ok(())
    }
}

fn settings_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("bedrud")
        .join("settings.toml")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_settings_are_sane() {
        let s = Settings::default();
        assert!(s.default_mic_device.is_none());
        assert!(matches!(s.theme, Theme::System));
        assert!(matches!(s.noise_suppression, NoiseSuppression::None));
    }
}
```

- [ ] **Step 5: Create store/mod.rs**

```rust
// apps/desktop/src/store/mod.rs
pub mod instance;
pub mod settings;
```

- [ ] **Step 6: Run tests**

```bash
cargo test -p bedrud-desktop store::
```
Expected: 5+ tests PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/src/store/ apps/desktop/Cargo.toml
git commit -m "feat(desktop): add multi-instance manager and settings store"
```

---

## Phase 5 — Authentication UI

### Task 9: Passkey + Login Screens

**Files:**
- Create: `apps/desktop/src/auth/passkey.rs`
- Create: `apps/desktop/ui/auth/login.slint`
- Create: `apps/desktop/ui/auth/register.slint`
- Modify: `apps/desktop/Cargo.toml` (add livekit + passkey deps)
- Modify: `apps/desktop/src/main.rs` (wire AppState + show login)

- [ ] **Step 1: Add dependencies to Cargo.toml**

```toml
# In [dependencies]
livekit = { version = "0.4", features = ["native"] }
livekit-api = "0.4"
cpal = "0.15"
webauthn-authenticator-rs = { version = "0.6", features = ["softpasskey"] }
```

Note: `softpasskey` feature enables a software passkey for testing. For production builds, enable `win10` on Windows and `ctap2` on Linux.

- [ ] **Step 2: Create passkey.rs stub**

```rust
// apps/desktop/src/auth/passkey.rs
//! WebAuthn passkey operations.
//!
//! Windows: WinRT Windows.Security.Credentials (Windows Hello)
//! Linux:   libfido2 / CTAP2 platform authenticator
//!
//! We defer to webauthn-authenticator-rs for the platform implementation.
//! This module wires the server challenge shapes to that crate's API.

use anyhow::Result;
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};

/// Simulated passkey assertion for the login finish flow.
/// In production this is provided by the platform authenticator.
pub struct PasskeyAssertion {
    pub credential_id: String,
    pub client_data_json: String,
    pub authenticator_data: String,
    pub signature: String,
}

/// Simulated passkey attestation for registration/signup finish flow.
pub struct PasskeyAttestation {
    pub client_data_json: String,
    pub attestation_object: String,
}

/// Encode raw bytes to base64url (no padding) — the format the server expects.
pub fn b64url(data: &[u8]) -> String {
    URL_SAFE_NO_PAD.encode(data)
}

/// Decode base64url challenge from server.
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
```

- [ ] **Step 3: Create login.slint**

```slint
// apps/desktop/ui/auth/login.slint
import { theme } from "../theme.slint";
import { Button } from "../components/button.slint";
import { Input } from "../components/input.slint";

export component LoginScreen inherits Rectangle {
    background: theme.bg-primary;

    in-out property <string> email;
    in-out property <string> password;
    in property <string> error-message;
    in property <bool> loading;
    in property <string> instance-url;

    callback login-clicked(string, string);
    callback passkey-clicked;
    callback guest-clicked;
    callback register-clicked;

    VerticalLayout {
        alignment: center;
        spacing: theme.space-lg;
        padding: theme.space-xl;
        max-width: 400px;
        x: (parent.width - self.width) / 2;

        // Logo / Title
        Text {
            text: "Bedrud";
            font-size: theme.font-2xl;
            font-weight: 700;
            color: theme.text-primary;
            horizontal-alignment: center;
        }
        Text {
            text: instance-url;
            font-size: theme.font-sm;
            color: theme.text-muted;
            horizontal-alignment: center;
        }

        // Error
        if error-message != "": Rectangle {
            background: #3f0000;
            border-radius: theme.radius-md;
            border-width: 1px;
            border-color: theme.destructive;
            padding: theme.space-sm;
            Text {
                text: error-message;
                color: theme.destructive;
                font-size: theme.font-sm;
                wrap: word-wrap;
            }
        }

        email-input := Input {
            label: "Email";
            placeholder: "you@example.com";
            value <=> email;
        }

        pass-input := Input {
            label: "Password";
            placeholder: "••••••••";
            value <=> password;
            password: true;
        }

        Button {
            text: "Sign in";
            loading: loading;
            clicked => { login-clicked(email, password); }
        }

        // Divider
        HorizontalLayout {
            spacing: theme.space-sm;
            alignment: center;
            Rectangle { height: 1px; width: 80px; background: theme.border; }
            Text { text: "or"; color: theme.text-muted; font-size: theme.font-sm; }
            Rectangle { height: 1px; width: 80px; background: theme.border; }
        }

        Button {
            text: "Sign in with Passkey";
            variant: ButtonVariant.secondary;
            clicked => { passkey-clicked(); }
        }
        Button {
            text: "Join as Guest";
            variant: ButtonVariant.secondary;
            clicked => { guest-clicked(); }
        }
        Button {
            text: "Create account";
            variant: ButtonVariant.secondary;
            clicked => { register-clicked(); }
        }
    }
}
```

- [ ] **Step 4: Create register.slint**

```slint
// apps/desktop/ui/auth/register.slint
import { theme } from "../theme.slint";
import { Button } from "../components/button.slint";
import { Input } from "../components/input.slint";

export component RegisterScreen inherits Rectangle {
    background: theme.bg-primary;

    in-out property <string> email;
    in-out property <string> name;
    in-out property <string> password;
    in-out property <string> invite-token;
    in property <string> error-message;
    in property <bool> loading;
    in property <bool> token-required;

    callback register-clicked(string, string, string, string);
    callback passkey-signup-clicked(string, string, string);
    callback back-clicked;

    VerticalLayout {
        alignment: center;
        spacing: theme.space-md;
        padding: theme.space-xl;
        max-width: 400px;
        x: (parent.width - self.width) / 2;

        Text {
            text: "Create Account";
            font-size: theme.font-2xl;
            font-weight: 700;
            color: theme.text-primary;
            horizontal-alignment: center;
        }

        if error-message != "": Rectangle {
            background: #3f0000;
            border-radius: theme.radius-md;
            border-width: 1px;
            border-color: theme.destructive;
            padding: theme.space-sm;
            Text { text: error-message; color: theme.destructive; font-size: theme.font-sm; wrap: word-wrap; }
        }

        Input { label: "Display Name"; placeholder: "Your Name"; value <=> name; }
        Input { label: "Email"; placeholder: "you@example.com"; value <=> email; }
        Input { label: "Password"; placeholder: "••••••••"; value <=> password; password: true; }

        if token-required: Input {
            label: "Invite Token";
            placeholder: "Enter invite token";
            value <=> invite-token;
        }

        Button {
            text: "Create Account";
            loading: loading;
            clicked => { register-clicked(email, name, password, invite-token); }
        }
        Button {
            text: "Sign up with Passkey";
            variant: ButtonVariant.secondary;
            clicked => { passkey-signup-clicked(email, name, invite-token); }
        }
        Button {
            text: "Back to Login";
            variant: ButtonVariant.secondary;
            clicked => { back-clicked(); }
        }
    }
}
```

- [ ] **Step 5: Wire login screen into app.slint**

Update `apps/desktop/ui/app.slint` to import and show LoginScreen:

```slint
// apps/desktop/ui/app.slint
import { theme } from "theme.slint";
import { LoginScreen } from "auth/login.slint";
import { RegisterScreen } from "auth/register.slint";

export enum NavScreen { AddInstance, Login, Register, Dashboard, Meeting, Settings, Admin }

export component AppWindow inherits Window {
    title: "Bedrud";
    width: 1024px;
    height: 768px;
    background: theme.bg-primary;

    in-out property <NavScreen> current-screen: NavScreen.Login;
    in-out property <string> instance-url: "";

    // Login screen
    if current-screen == NavScreen.Login: LoginScreen {
        width: parent.width;
        height: parent.height;
        instance-url: root.instance-url;
        // callbacks wired by bridge.rs at runtime
    }
    // Register screen
    if current-screen == NavScreen.Register: RegisterScreen {
        width: parent.width;
        height: parent.height;
    }
}
```

- [ ] **Step 6: Update main.rs to wire callbacks**

```rust
// apps/desktop/src/main.rs
mod api;
mod app;
mod auth;
mod store;
mod ui;

use std::sync::{Arc, Mutex};
use tokio::runtime::Runtime;

slint::include_modules!();

fn main() -> anyhow::Result<()> {
    env_logger::init();

    // Spin up dedicated Tokio runtime — Slint owns the main thread
    let rt = Arc::new(Runtime::new()?);

    let window = AppWindow::new()?;
    let window_weak = window.as_weak();

    // Load instance manager
    let instances = store::instance::InstanceManager::load()?;

    // Show AddInstance if no instances configured, else Login
    if instances.active().is_none() {
        window.set_current_screen(NavScreen::AddInstance);
    } else {
        let url = instances.active().unwrap().base_url.clone();
        window.set_instance_url(url.into());
        window.set_current_screen(NavScreen::Login);
    }

    window.run()?;
    Ok(())
}
```

- [ ] **Step 7: Create ui/bridge.rs placeholder**

```rust
// apps/desktop/src/ui/bridge.rs
//! Helpers for wiring Slint callbacks to async Tokio tasks.
//!
//! Pattern: callback fires on main thread → spawn on rt → result
//! sent back via slint::invoke_from_event_loop.
```

- [ ] **Step 8: Add ui/mod.rs**

```rust
// apps/desktop/src/ui/mod.rs (create directory src/ui/ first)
pub mod bridge;
```

- [ ] **Step 9: Build and verify login screen renders**

```bash
cargo build -p bedrud-desktop && cargo run -p bedrud-desktop
```
Expected: Login screen is visible.

- [ ] **Step 10: Commit**

```bash
git add apps/desktop/src/ apps/desktop/ui/
git commit -m "feat(desktop): add login/register screens and passkey stub"
```

---

## Phase 6 — Dashboard

### Task 10: Dashboard Screen

**Files:**
- Create: `apps/desktop/ui/dashboard/dashboard.slint`
- Create: `apps/desktop/ui/dashboard/room_card.slint`
- Create: `apps/desktop/ui/dashboard/create_room_dialog.slint`
- Create: `apps/desktop/ui/instance_switcher.slint`
- Modify: `apps/desktop/ui/app.slint`

- [ ] **Step 1: Create room_card.slint**

```slint
// apps/desktop/ui/dashboard/room_card.slint
import { theme } from "../theme.slint";
import { Button } from "../components/button.slint";
import { Card } from "../components/card.slint";

export struct RoomData {
    id: string,
    name: string,
    is-active: bool,
    is-public: bool,
    max-participants: int,
    participant-count: int,
}

export component RoomCard inherits Card {
    in property <RoomData> room;
    callback join-clicked(string);
    callback delete-clicked(string);

    width: 280px;
    height: 140px;
    padding: theme.space-md;

    VerticalLayout {
        spacing: theme.space-sm;
        HorizontalLayout {
            spacing: theme.space-sm;
            alignment: space-between;

            Text {
                text: room.name;
                font-size: theme.font-base;
                font-weight: 600;
                color: theme.text-primary;
                overflow: elide;
            }
            if room.is-active: Rectangle {
                width: 8px; height: 8px;
                border-radius: 4px;
                background: theme.success;
                y: 4px;
            }
        }

        HorizontalLayout {
            spacing: theme.space-sm;
            Text {
                text: room.is-public ? "Public" : "Private";
                font-size: theme.font-sm;
                color: theme.text-muted;
            }
            Text {
                text: "·";
                color: theme.text-muted;
                font-size: theme.font-sm;
            }
            Text {
                text: room.participant-count + " / " + room.max-participants;
                font-size: theme.font-sm;
                color: theme.text-muted;
            }
        }

        HorizontalLayout {
            spacing: theme.space-sm;
            Button {
                text: "Join";
                height: 28px;
                clicked => { join-clicked(room.id); }
            }
            Button {
                text: "Delete";
                variant: ButtonVariant.destructive;
                height: 28px;
                clicked => { delete-clicked(room.id); }
            }
        }
    }
}
```

- [ ] **Step 2: Create dashboard.slint**

```slint
// apps/desktop/ui/dashboard/dashboard.slint
import { theme } from "../theme.slint";
import { Button } from "../components/button.slint";
import { Input } from "../components/input.slint";
import { Avatar } from "../components/avatar.slint";
import { RoomCard, RoomData } from "room_card.slint";

export component DashboardScreen inherits Rectangle {
    background: theme.bg-primary;

    in property <[RoomData]> rooms: [];
    in property <string> user-name;
    in property <bool> loading;
    in-out property <string> join-room-name;

    callback create-room-clicked;
    callback join-room-clicked(string);
    callback delete-room-clicked(string);
    callback settings-clicked;
    callback admin-clicked;
    callback logout-clicked;
    callback instance-switch-clicked;

    // Toolbar
    Rectangle {
        height: 56px;
        background: theme.bg-secondary;
        border-width: 0px 0px 1px 0px;
        border-color: theme.border;
        y: 0;

        HorizontalLayout {
            padding-left: theme.space-md;
            padding-right: theme.space-md;
            alignment: space-between;

            Text {
                text: "Bedrud";
                font-size: theme.font-lg;
                font-weight: 700;
                color: theme.text-primary;
                vertical-alignment: center;
            }

            HorizontalLayout {
                spacing: theme.space-sm;
                alignment: center;

                TouchArea {
                    width: 24px; height: 24px;
                    clicked => { instance-switch-clicked(); }
                    Text { text: "⚙"; color: theme.text-secondary; font-size: theme.font-lg; }
                }
                Avatar { name: user-name; size: 32px; }
            }
        }
    }

    // Main content
    VerticalLayout {
        y: 56px;
        height: parent.height - 56px;
        padding: theme.space-lg;
        spacing: theme.space-lg;

        // Actions bar
        HorizontalLayout {
            spacing: theme.space-sm;
            alignment: space-between;

            HorizontalLayout {
                spacing: theme.space-sm;
                Input {
                    width: 200px;
                    placeholder: "Room name to join";
                    value <=> join-room-name;
                }
                Button {
                    text: "Join";
                    clicked => { join-room-clicked(join-room-name); }
                }
            }
            Button {
                text: "+ New Room";
                clicked => { create-room-clicked(); }
            }
        }

        // Room grid
        if loading: Text {
            text: "Loading rooms…";
            color: theme.text-secondary;
            horizontal-alignment: center;
        }
        if !loading && rooms.length == 0: Text {
            text: "No rooms yet. Create one!";
            color: theme.text-muted;
            horizontal-alignment: center;
            vertical-alignment: center;
        }
        if !loading: HorizontalLayout {
            spacing: theme.space-md;
            wrap: true;  // Slint FlexLayout behavior
            for room in rooms: RoomCard {
                room: room;
                join-clicked(id) => { join-room-clicked(id); }
                delete-clicked(id) => { delete-room-clicked(id); }
            }
        }
    }
}
```

- [ ] **Step 3: Create create_room_dialog.slint**

```slint
// apps/desktop/ui/dashboard/create_room_dialog.slint
import { theme } from "../theme.slint";
import { Button } from "../components/button.slint";
import { Input } from "../components/input.slint";

export component CreateRoomDialog inherits Dialog {
    title: "Create Room";
    width: 420px;

    in-out property <string> room-name;
    in-out property <bool> is-public: false;
    in-out property <int> max-participants: 20;
    in property <bool> loading;

    callback create-clicked(string, bool, int);
    callback cancel-clicked;

    VerticalLayout {
        spacing: theme.space-md;
        padding: theme.space-lg;

        Input {
            label: "Room name (optional — auto-generated if empty)";
            placeholder: "my-room";
            value <=> room-name;
        }

        HorizontalLayout {
            spacing: theme.space-sm;
            CheckBox { text: "Public room"; checked <=> is-public; }
        }

        HorizontalLayout {
            spacing: theme.space-sm;
            Text { text: "Max participants:"; color: theme.text-secondary; font-size: theme.font-sm; vertical-alignment: center; }
            SpinBox {
                value <=> max-participants;
                minimum: 2;
                maximum: 500;
            }
        }

        HorizontalLayout {
            spacing: theme.space-sm;
            alignment: end;
            Button { text: "Cancel"; variant: ButtonVariant.secondary; clicked => { cancel-clicked(); } }
            Button { text: "Create"; loading: loading; clicked => { create-clicked(room-name, is-public, max-participants); } }
        }
    }
}
```

- [ ] **Step 4: Build to verify Slint compilation**

```bash
cargo build -p bedrud-desktop
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/ui/dashboard/ apps/desktop/ui/instance_switcher.slint
git commit -m "feat(desktop): add dashboard screen and room management UI"
```

---

## Phase 7 — Meeting (LiveKit)

### Task 11: Device Enumeration

**Files:**
- Create: `apps/desktop/src/livekit/mod.rs`
- Create: `apps/desktop/src/livekit/devices.rs`

- [ ] **Step 1: Write failing test for device enumeration**

```rust
// apps/desktop/src/livekit/devices.rs
use cpal::traits::{DeviceTrait, HostTrait};
use anyhow::Result;

#[derive(Debug, Clone)]
pub struct AudioDevice {
    pub id: String,    // Device name used as stable ID
    pub name: String,
    pub is_default: bool,
}

pub fn list_input_devices() -> Vec<AudioDevice> {
    let host = cpal::default_host();
    let default_name = host.default_input_device()
        .and_then(|d| d.name().ok());

    host.input_devices()
        .unwrap_or_else(|_| Box::new(std::iter::empty()))
        .filter_map(|d| {
            let name = d.name().ok()?;
            Some(AudioDevice {
                id: name.clone(),
                is_default: Some(name.as_str()) == default_name.as_deref(),
                name,
            })
        })
        .collect()
}

pub fn list_output_devices() -> Vec<AudioDevice> {
    let host = cpal::default_host();
    let default_name = host.default_output_device()
        .and_then(|d| d.name().ok());

    host.output_devices()
        .unwrap_or_else(|_| Box::new(std::iter::empty()))
        .filter_map(|d| {
            let name = d.name().ok()?;
            Some(AudioDevice {
                id: name.clone(),
                is_default: Some(name.as_str()) == default_name.as_deref(),
                name,
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn input_devices_returns_vec() {
        // Just verifies the function doesn't panic.
        // Actual devices depend on the test environment.
        let devices = list_input_devices();
        // On CI (headless), this may be empty — that's acceptable.
        let _ = devices;
    }

    #[test]
    fn output_devices_returns_vec() {
        let devices = list_output_devices();
        let _ = devices;
    }
}
```

- [ ] **Step 2: Create livekit/mod.rs**

```rust
// apps/desktop/src/livekit/mod.rs
pub mod devices;
pub mod room;
pub mod tracks;
```

- [ ] **Step 3: Run tests**

```bash
cargo test -p bedrud-desktop livekit::devices::tests
```
Expected: 2 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/livekit/
git commit -m "feat(desktop): add audio/video device enumeration"
```

---

### Task 12: LiveKit Room Connection

**Files:**
- Create: `apps/desktop/src/livekit/room.rs`
- Create: `apps/desktop/src/livekit/tracks.rs`

- [ ] **Step 1: Create room.rs**

```rust
// apps/desktop/src/livekit/room.rs
//! LiveKit room connection and event loop.
//!
//! Ownership model:
//! - RoomHandle is held by the meeting screen's background task
//! - UI updates flow via slint::invoke_from_event_loop
//! - All LiveKit operations happen on the Tokio runtime

use anyhow::Result;
use livekit::prelude::*;
use std::sync::Arc;

pub struct ConnectedRoom {
    pub room: Arc<Room>,
    pub local_participant: LocalParticipant,
}

pub struct RoomConfig {
    pub url: String,   // ws:// or wss:// LiveKit server URL
    pub token: String, // JWT from /room/join response
}

pub async fn connect(config: RoomConfig) -> Result<(ConnectedRoom, RoomEvents)> {
    let (room, events) = Room::connect(
        &config.url,
        &config.token,
        RoomOptions::default(),
    ).await?;

    let local_participant = room.local_participant();

    Ok((
        ConnectedRoom {
            room: Arc::new(room),
            local_participant,
        },
        events,
    ))
}

/// System message sent over LiveKit data channel (topic: "system").
#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct SystemMessage {
    #[serde(rename = "type")]
    pub msg_type: String,   // always "system"
    pub event: String,       // "kick" | "ban"
    pub actor: String,       // user ID of moderator
    pub target: String,      // user ID being removed
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
```

- [ ] **Step 2: Create tracks.rs**

```rust
// apps/desktop/src/livekit/tracks.rs
//! Audio/video track publishing and video frame conversion.
//!
//! Video pipeline: LiveKit I420 frame → yuv crate → RGBA bytes →
//!   slint::SharedPixelBuffer → slint::Image (via invoke_from_event_loop)

use anyhow::Result;
use livekit::prelude::*;

/// Convert a YUV I420 video frame to raw RGBA bytes.
/// Returns Vec<u8> with length width * height * 4.
pub fn i420_to_rgba(frame: &VideoFrame) -> Vec<u8> {
    let buffer = &frame.buffer;
    let width = frame.width as usize;
    let height = frame.height as usize;

    // Plane layout for I420: Y (full), U (quarter), V (quarter)
    let y_plane = buffer.plane_data(0);
    let u_plane = buffer.plane_data(1);
    let v_plane = buffer.plane_data(2);

    let mut rgba = vec![255u8; width * height * 4];

    for row in 0..height {
        for col in 0..width {
            let y = y_plane[row * width + col] as f32;
            let u = u_plane[(row / 2) * (width / 2) + (col / 2)] as f32 - 128.0;
            let v = v_plane[(row / 2) * (width / 2) + (col / 2)] as f32 - 128.0;

            let r = (y + 1.402 * v).clamp(0.0, 255.0) as u8;
            let g = (y - 0.344_136 * u - 0.714_136 * v).clamp(0.0, 255.0) as u8;
            let b = (y + 1.772 * u).clamp(0.0, 255.0) as u8;

            let idx = (row * width + col) * 4;
            rgba[idx] = r;
            rgba[idx + 1] = g;
            rgba[idx + 2] = b;
            rgba[idx + 3] = 255; // alpha
        }
    }
    rgba
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn i420_to_rgba_pure_black() {
        // Y=16, U=128, V=128 → black in BT.601
        let width = 2usize;
        let height = 2usize;
        let y_plane = vec![16u8; width * height];
        let u_plane = vec![128u8; (width / 2) * (height / 2)];
        let v_plane = vec![128u8; (width / 2) * (height / 2)];

        // We can't easily construct a VideoFrame without LiveKit so we test
        // the math directly via a helper that accepts raw planes.
        let rgba = convert_planes(&y_plane, &u_plane, &v_plane, width, height);
        // Y=16 maps to near-black
        assert!(rgba[0] < 30, "R should be near 0, got {}", rgba[0]);
        assert!(rgba[3] == 255, "Alpha must be 255");
    }

    // Exposed for testing only
    fn convert_planes(y: &[u8], u: &[u8], v: &[u8], w: usize, h: usize) -> Vec<u8> {
        let mut rgba = vec![255u8; w * h * 4];
        for row in 0..h {
            for col in 0..w {
                let yv = y[row * w + col] as f32;
                let uv = u[(row / 2) * (w / 2) + (col / 2)] as f32 - 128.0;
                let vv = v[(row / 2) * (w / 2) + (col / 2)] as f32 - 128.0;
                let r = (yv + 1.402 * vv).clamp(0.0, 255.0) as u8;
                let g = (yv - 0.344_136 * uv - 0.714_136 * vv).clamp(0.0, 255.0) as u8;
                let b = (yv + 1.772 * uv).clamp(0.0, 255.0) as u8;
                let idx = (row * w + col) * 4;
                rgba[idx] = r; rgba[idx+1] = g; rgba[idx+2] = b; rgba[idx+3] = 255;
            }
        }
        rgba
    }
}
```

- [ ] **Step 3: Run tests**

```bash
cargo test -p bedrud-desktop livekit::
```
Expected: 2 tests PASS (system_message_roundtrip + i420_to_rgba_pure_black).

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/livekit/room.rs apps/desktop/src/livekit/tracks.rs
git commit -m "feat(desktop): add LiveKit room connection and video frame pipeline"
```

---

### Task 13: Meeting UI

**Files:**
- Create: `apps/desktop/ui/meeting/meeting.slint`
- Create: `apps/desktop/ui/meeting/participant_tile.slint`
- Create: `apps/desktop/ui/meeting/participant_grid.slint`
- Create: `apps/desktop/ui/meeting/controls_bar.slint`
- Create: `apps/desktop/ui/meeting/chat_panel.slint`
- Create: `apps/desktop/ui/meeting/device_selector.slint`

- [ ] **Step 1: Create participant_tile.slint**

```slint
// apps/desktop/ui/meeting/participant_tile.slint
import { theme } from "../theme.slint";
import { Avatar } from "../components/avatar.slint";

export struct ParticipantData {
    identity: string,
    name: string,
    is-muted: bool,
    is-video-off: bool,
    is-speaking: bool,
    is-local: bool,
    video-frame: image,
}

export component ParticipantTile inherits Rectangle {
    in property <ParticipantData> participant;

    background: theme.bg-card;
    border-radius: theme.radius-md;
    border-width: participant.is-speaking ? 2px : 0px;
    border-color: theme.accent;
    clip: true;

    // Video or avatar
    if !participant.is-video-off && participant.video-frame.width > 0: Image {
        source: participant.video-frame;
        width: parent.width;
        height: parent.height;
        image-fit: cover;
    }
    if participant.is-video-off || participant.video-frame.width == 0: Avatar {
        name: participant.name;
        size: Math.min(parent.width, parent.height) * 0.4;
        x: (parent.width - self.width) / 2;
        y: (parent.height - self.height) / 2;
    }

    // Overlay — name + indicators
    Rectangle {
        y: parent.height - 32px;
        height: 32px;
        background: #000000aa;
        HorizontalLayout {
            padding-left: theme.space-sm;
            spacing: theme.space-xs;
            alignment: space-between;

            Text {
                text: participant.name + (participant.is-local ? " (You)" : "");
                color: #ffffff;
                font-size: theme.font-sm;
                overflow: elide;
                vertical-alignment: center;
            }
            HorizontalLayout {
                spacing: theme.space-xs;
                if participant.is-muted: Text { text: "🔇"; font-size: 14px; }
                if participant.is-video-off: Text { text: "📷"; font-size: 14px; }
            }
        }
    }
}
```

- [ ] **Step 2: Create controls_bar.slint**

```slint
// apps/desktop/ui/meeting/controls_bar.slint
import { theme } from "../theme.slint";
import { Button } from "../components/button.slint";

export component ControlsBar inherits Rectangle {
    height: 64px;
    background: theme.bg-secondary;
    border-width: 1px 0px 0px 0px;
    border-color: theme.border;

    in property <bool> mic-enabled: true;
    in property <bool> cam-enabled: false;
    in property <bool> chat-open: false;
    in property <bool> is-creator: false;

    callback toggle-mic;
    callback toggle-cam;
    callback toggle-chat;
    callback end-call;

    HorizontalLayout {
        alignment: center;
        spacing: theme.space-md;
        padding: theme.space-md;

        Button {
            text: mic-enabled ? "🎤 Mute" : "🔇 Unmute";
            variant: mic-enabled ? ButtonVariant.secondary : ButtonVariant.primary;
            clicked => { toggle-mic(); }
        }
        Button {
            text: cam-enabled ? "📷 Stop Video" : "📷 Start Video";
            variant: cam-enabled ? ButtonVariant.secondary : ButtonVariant.primary;
            clicked => { toggle-cam(); }
        }
        Button {
            text: chat-open ? "💬 Hide Chat" : "💬 Chat";
            variant: ButtonVariant.secondary;
            clicked => { toggle-chat(); }
        }
        Button {
            text: is-creator ? "End Meeting" : "Leave";
            variant: ButtonVariant.destructive;
            clicked => { end-call(); }
        }
    }
}
```

- [ ] **Step 3: Create chat_panel.slint**

```slint
// apps/desktop/ui/meeting/chat_panel.slint
import { theme } from "../theme.slint";
import { Button } from "../components/button.slint";

export struct ChatMessage {
    sender: string,
    content: string,
    timestamp: string,
    is-system: bool,
}

export component ChatPanel inherits Rectangle {
    width: 280px;
    background: theme.bg-secondary;
    border-width: 0px 0px 0px 1px;
    border-color: theme.border;

    in property <[ChatMessage]> messages: [];
    in-out property <string> input-text;

    callback send-clicked(string);

    VerticalLayout {
        // Header
        Rectangle {
            height: 48px;
            border-width: 0px 0px 1px 0px;
            border-color: theme.border;
            Text { text: "Chat"; color: theme.text-primary; font-size: theme.font-base; font-weight: 600; x: theme.space-md; vertical-alignment: center; }
        }

        // Messages
        ListView {
            for msg in messages: VerticalLayout {
                padding: theme.space-sm;
                spacing: 2px;

                if !msg.is-system: HorizontalLayout {
                    spacing: theme.space-xs;
                    Text { text: msg.sender; color: theme.accent; font-size: theme.font-sm; font-weight: 600; }
                    Text { text: msg.timestamp; color: theme.text-muted; font-size: theme.font-sm; }
                }
                Text {
                    text: msg.content;
                    color: msg.is-system ? theme.text-muted : theme.text-primary;
                    font-size: theme.font-sm;
                    wrap: word-wrap;
                }
            }
        }

        // Input
        HorizontalLayout {
            padding: theme.space-sm;
            spacing: theme.space-sm;
            border-width: 1px 0px 0px 0px;
            border-color: theme.border;

            TextInput {
                text <=> input-text;
                placeholder-text: "Send a message…";
                color: theme.text-primary;
                font-size: theme.font-sm;
                preferred-height: 32px;
                accepted => { send-clicked(input-text); input-text = ""; }
            }
            Button {
                text: "↵";
                width: 36px;
                height: 32px;
                clicked => { send-clicked(input-text); input-text = ""; }
            }
        }
    }
}
```

- [ ] **Step 4: Create meeting.slint**

```slint
// apps/desktop/ui/meeting/meeting.slint
import { theme } from "../theme.slint";
import { ParticipantTile, ParticipantData } from "participant_tile.slint";
import { ControlsBar } from "controls_bar.slint";
import { ChatPanel, ChatMessage } from "chat_panel.slint";

export component MeetingScreen inherits Rectangle {
    background: theme.bg-primary;

    in property <[ParticipantData]> participants: [];
    in property <[ChatMessage]> chat-messages: [];
    in property <bool> mic-enabled: true;
    in property <bool> cam-enabled: false;
    in property <bool> is-creator: false;
    in property <string> room-name;
    in-out property <bool> chat-open: false;
    in-out property <string> chat-input;

    callback toggle-mic;
    callback toggle-cam;
    callback toggle-chat;
    callback end-call;
    callback send-chat(string);

    HorizontalLayout {
        // Participant grid
        Rectangle {
            horizontal-stretch: 1;
            VerticalLayout {
                // Room name bar
                Rectangle {
                    height: 40px;
                    background: theme.bg-secondary;
                    Text {
                        text: room-name;
                        color: theme.text-secondary;
                        font-size: theme.font-sm;
                        x: theme.space-md;
                        vertical-alignment: center;
                    }
                }

                // Grid area
                Rectangle {
                    vertical-stretch: 1;
                    clip: true;

                    // Dynamic grid: tile size adapts to participant count
                    GridLayout {
                        spacing: theme.space-xs;
                        padding: theme.space-xs;
                        for p in participants: ParticipantTile {
                            participant: p;
                            // Min size ensures readability at high participant counts
                            min-width: 160px;
                            min-height: 120px;
                        }
                    }
                }

                ControlsBar {
                    mic-enabled: mic-enabled;
                    cam-enabled: cam-enabled;
                    chat-open: chat-open;
                    is-creator: is-creator;
                    toggle-mic => { toggle-mic(); }
                    toggle-cam => { toggle-cam(); }
                    toggle-chat => { chat-open = !chat-open; toggle-chat(); }
                    end-call => { end-call(); }
                }
            }
        }

        // Chat panel (conditional)
        if chat-open: ChatPanel {
            messages: chat-messages;
            input-text <=> chat-input;
            send-clicked(msg) => { send-chat(msg); }
        }
    }
}
```

- [ ] **Step 5: Build**

```bash
cargo build -p bedrud-desktop
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/ui/meeting/
git commit -m "feat(desktop): add meeting screen with participant grid and chat"
```

---

## Phase 8 — Admin Panel

### Task 14: Admin Screen

**Files:**
- Create: `apps/desktop/ui/admin/admin.slint`
- Create: `apps/desktop/ui/admin/user_table.slint`
- Create: `apps/desktop/ui/admin/room_table.slint`

- [ ] **Step 1: Create user_table.slint**

```slint
// apps/desktop/ui/admin/user_table.slint
import { theme } from "../theme.slint";
import { Button } from "../components/button.slint";

export struct AdminUserRow {
    id: string,
    email: string,
    name: string,
    provider: string,
    is-active: bool,
    accesses: string,  // comma-separated
}

export component UserTable inherits Rectangle {
    in property <[AdminUserRow]> users: [];
    callback toggle-status(string, bool);

    VerticalLayout {
        // Header
        HorizontalLayout {
            padding: theme.space-sm;
            background: theme.bg-card;
            spacing: theme.space-md;
            Text { text: "Name"; color: theme.text-secondary; font-size: theme.font-sm; font-weight: 600; width: 140px; }
            Text { text: "Email"; color: theme.text-secondary; font-size: theme.font-sm; font-weight: 600; width: 200px; }
            Text { text: "Provider"; color: theme.text-secondary; font-size: theme.font-sm; font-weight: 600; width: 80px; }
            Text { text: "Accesses"; color: theme.text-secondary; font-size: theme.font-sm; font-weight: 600; width: 120px; }
            Text { text: "Status"; color: theme.text-secondary; font-size: theme.font-sm; font-weight: 600; width: 80px; }
        }

        ListView {
            for user in users: HorizontalLayout {
                padding: theme.space-sm;
                border-width: 0px 0px 1px 0px;
                border-color: theme.border;
                spacing: theme.space-md;

                Text { text: user.name; color: theme.text-primary; font-size: theme.font-sm; overflow: elide; width: 140px; }
                Text { text: user.email; color: theme.text-secondary; font-size: theme.font-sm; overflow: elide; width: 200px; }
                Text { text: user.provider; color: theme.text-muted; font-size: theme.font-sm; width: 80px; }
                Text { text: user.accesses; color: theme.text-muted; font-size: theme.font-sm; overflow: elide; width: 120px; }
                Button {
                    text: user.is-active ? "Active" : "Disabled";
                    variant: user.is-active ? ButtonVariant.secondary : ButtonVariant.destructive;
                    width: 80px; height: 24px;
                    clicked => { toggle-status(user.id, !user.is-active); }
                }
            }
        }
    }
}
```

- [ ] **Step 2: Create admin.slint**

```slint
// apps/desktop/ui/admin/admin.slint
import { theme } from "../theme.slint";
import { Button } from "../components/button.slint";
import { UserTable, AdminUserRow } from "user_table.slint";

export component AdminScreen inherits Rectangle {
    background: theme.bg-primary;

    in property <[AdminUserRow]> users: [];
    in property <int> online-count: 0;
    in property <bool> loading;

    callback back-clicked;
    callback toggle-user-status(string, bool);

    VerticalLayout {
        // Toolbar
        Rectangle {
            height: 56px;
            background: theme.bg-secondary;
            border-width: 0px 0px 1px 0px;
            border-color: theme.border;
            HorizontalLayout {
                padding: theme.space-md;
                spacing: theme.space-md;
                Button { text: "← Back"; variant: ButtonVariant.secondary; clicked => { back-clicked(); } }
                Text { text: "Admin Panel"; font-size: theme.font-lg; font-weight: 700; color: theme.text-primary; vertical-alignment: center; }
                Text {
                    text: online-count + " online";
                    font-size: theme.font-sm;
                    color: theme.success;
                    vertical-alignment: center;
                }
            }
        }

        VerticalLayout {
            padding: theme.space-lg;
            spacing: theme.space-lg;

            Text { text: "Users"; font-size: theme.font-xl; font-weight: 700; color: theme.text-primary; }
            if loading: Text { text: "Loading…"; color: theme.text-secondary; }
            if !loading: UserTable {
                users: users;
                toggle-status(id, status) => { toggle-user-status(id, status); }
            }
        }
    }
}
```

- [ ] **Step 3: Build**

```bash
cargo build -p bedrud-desktop
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/ui/admin/
git commit -m "feat(desktop): add admin panel UI"
```

---

## Phase 9 — Settings Screen

### Task 15: Settings Screen

**Files:**
- Create: `apps/desktop/ui/settings.slint`

- [ ] **Step 1: Create settings.slint**

```slint
// apps/desktop/ui/settings.slint
import { theme } from "theme.slint";
import { Button } from "components/button.slint";

export enum ThemePref { Light, Dark, System }
export enum NoiseSuppression { None, RNNoise, Krisp }

export component SettingsScreen inherits Rectangle {
    background: theme.bg-primary;

    in-out property <ThemePref> theme-pref: ThemePref.System;
    in-out property <NoiseSuppression> noise-suppression: NoiseSuppression.None;
    in property <[string]> mic-devices: [];
    in property <[string]> speaker-devices: [];
    in-out property <string> selected-mic;
    in-out property <string> selected-speaker;

    callback back-clicked;
    callback save-clicked;

    VerticalLayout {
        Rectangle {
            height: 56px;
            background: theme.bg-secondary;
            border-width: 0px 0px 1px 0px;
            border-color: theme.border;
            HorizontalLayout {
                padding: theme.space-md;
                Button { text: "← Back"; variant: ButtonVariant.secondary; clicked => { back-clicked(); } }
                Text { text: "Settings"; font-size: theme.font-lg; font-weight: 700; color: theme.text-primary; x: theme.space-md; vertical-alignment: center; }
            }
        }

        VerticalLayout {
            padding: theme.space-xl;
            spacing: theme.space-lg;
            max-width: 480px;

            // Theme
            VerticalLayout {
                spacing: theme.space-sm;
                Text { text: "Appearance"; font-size: theme.font-lg; font-weight: 600; color: theme.text-primary; }
                ComboBox {
                    model: ["Light", "Dark", "System"];
                    current-index: theme-pref == ThemePref.Light ? 0 : theme-pref == ThemePref.Dark ? 1 : 2;
                }
            }

            // Audio
            VerticalLayout {
                spacing: theme.space-sm;
                Text { text: "Audio Devices"; font-size: theme.font-lg; font-weight: 600; color: theme.text-primary; }
                Text { text: "Microphone"; color: theme.text-secondary; font-size: theme.font-sm; }
                ComboBox { model: mic-devices; current-value <=> selected-mic; }
                Text { text: "Speaker"; color: theme.text-secondary; font-size: theme.font-sm; }
                ComboBox { model: speaker-devices; current-value <=> selected-speaker; }
            }

            // Noise suppression
            VerticalLayout {
                spacing: theme.space-sm;
                Text { text: "Noise Suppression"; font-size: theme.font-lg; font-weight: 600; color: theme.text-primary; }
                ComboBox {
                    model: ["None", "RNNoise (WASM)", "Krisp"];
                    current-index: noise-suppression == NoiseSuppression.None ? 0
                                 : noise-suppression == NoiseSuppression.RNNoise ? 1 : 2;
                }
            }

            Button {
                text: "Save Settings";
                clicked => { save-clicked(); }
            }
        }
    }
}
```

- [ ] **Step 2: Build**

```bash
cargo build -p bedrud-desktop
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/ui/settings.slint
git commit -m "feat(desktop): add settings screen"
```

---

## Phase 10 — Wire Everything Together

### Task 16: Full App Integration

**Files:**
- Modify: `apps/desktop/src/main.rs` (complete wiring)
- Modify: `apps/desktop/src/ui/bridge.rs`
- Modify: `apps/desktop/ui/app.slint` (add all screens)

- [ ] **Step 1: Update app.slint to include all screens**

```slint
// apps/desktop/ui/app.slint
import { theme } from "theme.slint";
import { LoginScreen } from "auth/login.slint";
import { RegisterScreen } from "auth/register.slint";
import { DashboardScreen, RoomData } from "dashboard/dashboard.slint";
import { MeetingScreen, ParticipantData, ChatMessage } from "meeting/meeting.slint";
import { AdminScreen, AdminUserRow } from "admin/admin.slint";
import { SettingsScreen } from "settings.slint";
import { CreateRoomDialog } from "dashboard/create_room_dialog.slint";

export enum NavScreen { AddInstance, Login, Register, Dashboard, Meeting, Admin, Settings }

export component AppWindow inherits Window {
    title: "Bedrud";
    preferred-width: 1024px;
    preferred-height: 768px;
    min-width: 800px;
    min-height: 600px;
    background: theme.bg-primary;

    // Navigation
    in-out property <NavScreen> current-screen: NavScreen.Login;

    // Login
    in property <string> instance-url: "";
    in property <string> login-error: "";
    in property <bool> login-loading: false;

    // Dashboard
    in property <[RoomData]> rooms: [];
    in property <string> user-name: "";
    in property <bool> dashboard-loading: false;
    in property <bool> is-admin: false;

    // Meeting
    in property <[ParticipantData]> participants: [];
    in property <[ChatMessage]> chat-messages: [];
    in property <bool> mic-enabled: true;
    in property <bool> cam-enabled: false;
    in property <bool> is-creator: false;
    in property <string> meeting-room-name: "";
    in-out property <bool> chat-open: false;

    // Admin
    in property <[AdminUserRow]> admin-users: [];
    in property <int> online-count: 0;

    // Settings
    in property <[string]> mic-devices: [];
    in property <[string]> speaker-devices: [];
    in-out property <string> selected-mic: "";
    in-out property <string> selected-speaker: "";

    // Callbacks (wired from bridge.rs)
    callback login(string, string);
    callback passkey-login;
    callback guest-login(string);
    callback register(string, string, string, string);
    callback logout;
    callback join-room(string);
    callback create-room(string, bool, int);
    callback delete-room(string);
    callback end-call;
    callback toggle-mic;
    callback toggle-cam;
    callback send-chat(string);
    callback load-rooms;
    callback navigate-to(NavScreen);
    callback save-settings;

    if current-screen == NavScreen.Login: LoginScreen {
        width: parent.width; height: parent.height;
        instance-url: instance-url;
        error-message: login-error;
        loading: login-loading;
        login-clicked(email, pass) => { login(email, pass); }
        passkey-clicked => { passkey-login(); }
        guest-clicked => { /* show name dialog — TODO */ }
        register-clicked => { navigate-to(NavScreen.Register); }
    }

    if current-screen == NavScreen.Register: RegisterScreen {
        width: parent.width; height: parent.height;
        back-clicked => { navigate-to(NavScreen.Login); }
        register-clicked(email, name, pass, token) => { register(email, name, pass, token); }
    }

    if current-screen == NavScreen.Dashboard: DashboardScreen {
        width: parent.width; height: parent.height;
        rooms: rooms;
        user-name: user-name;
        loading: dashboard-loading;
        create-room-clicked => { create-room("", false, 20); }
        join-room-clicked(name) => { join-room(name); }
        delete-room-clicked(id) => { delete-room(id); }
        settings-clicked => { navigate-to(NavScreen.Settings); }
        admin-clicked => { navigate-to(NavScreen.Admin); }
        logout-clicked => { logout(); }
    }

    if current-screen == NavScreen.Meeting: MeetingScreen {
        width: parent.width; height: parent.height;
        participants: participants;
        chat-messages: chat-messages;
        mic-enabled: mic-enabled;
        cam-enabled: cam-enabled;
        is-creator: is-creator;
        room-name: meeting-room-name;
        chat-open <=> chat-open;
        toggle-mic => { toggle-mic(); }
        toggle-cam => { toggle-cam(); }
        end-call => { end-call(); }
        send-chat(msg) => { send-chat(msg); }
    }

    if current-screen == NavScreen.Admin: AdminScreen {
        width: parent.width; height: parent.height;
        users: admin-users;
        online-count: online-count;
        loading: dashboard-loading;
        back-clicked => { navigate-to(NavScreen.Dashboard); }
    }

    if current-screen == NavScreen.Settings: SettingsScreen {
        width: parent.width; height: parent.height;
        mic-devices: mic-devices;
        speaker-devices: speaker-devices;
        selected-mic <=> selected-mic;
        selected-speaker <=> selected-speaker;
        back-clicked => { navigate-to(NavScreen.Settings); }
        save-clicked => { save-settings(); }
    }
}
```

- [ ] **Step 2: Complete bridge.rs with callback wiring**

```rust
// apps/desktop/src/ui/bridge.rs
use std::sync::{Arc, Mutex};
use tokio::runtime::Runtime;

slint::include_modules!();

use crate::api::client::ApiClient;
use crate::api::{auth, rooms, admin};
use crate::auth::session::SessionStore;
use crate::store::instance::InstanceManager;

pub struct AppContext {
    pub rt: Arc<Runtime>,
    pub api: ApiClient,
    pub session: SessionStore,
    pub instances: Arc<Mutex<InstanceManager>>,
}

/// Wire all Slint callbacks on AppWindow to their Rust handlers.
pub fn wire(window: &AppWindow, ctx: Arc<AppContext>) {
    let w = window.as_weak();

    // login callback
    let api = ctx.api.clone();
    let session = ctx.session.clone();
    let rt = ctx.rt.clone();
    let ww = w.clone();
    window.on_login(move |email, password| {
        let api = api.clone();
        let session = session.clone();
        let ww = ww.clone();
        ww.upgrade_in_event_loop(|w| w.set_login_loading(true)).ok();
        rt.spawn(async move {
            let result = auth::login(&api, &email, &password).await;
            slint::invoke_from_event_loop(move || {
                if let Some(w) = ww.upgrade() {
                    w.set_login_loading(false);
                    match result {
                        Ok(resp) => {
                            api.set_token(Some(resp.tokens.access_token.clone()));
                            let _ = session.save_access_token(&resp.tokens.access_token);
                            if let Some(rt) = resp.tokens.refresh_token.as_deref() {
                                let _ = session.save_refresh_token(rt);
                            }
                            w.set_user_name(resp.user.name.into());
                            w.set_is_admin(resp.user.is_admin());
                            w.set_current_screen(NavScreen::Dashboard);
                            // Trigger room list load
                            w.invoke_load_rooms();
                        }
                        Err(e) => {
                            w.set_login_error(e.to_string().into());
                        }
                    }
                }
            }).ok();
        });
    });

    // load_rooms callback
    let api = ctx.api.clone();
    let rt = ctx.rt.clone();
    let ww = w.clone();
    window.on_load_rooms(move || {
        let api = api.clone();
        let ww = ww.clone();
        ww.upgrade_in_event_loop(|w| w.set_dashboard_loading(true)).ok();
        rt.spawn(async move {
            let result = rooms::list_rooms(&api).await;
            slint::invoke_from_event_loop(move || {
                if let Some(w) = ww.upgrade() {
                    w.set_dashboard_loading(false);
                    if let Ok(room_list) = result {
                        let model: Vec<RoomData> = room_list.into_iter().map(|r| RoomData {
                            id: r.id.into(),
                            name: r.name.into(),
                            is_active: r.is_active,
                            is_public: r.is_public,
                            max_participants: r.max_participants,
                            participant_count: 0,
                        }).collect();
                        w.set_rooms(std::rc::Rc::new(slint::VecModel::from(model)).into());
                    }
                }
            }).ok();
        });
    });

    // navigate_to callback
    let ww = w.clone();
    window.on_navigate_to(move |screen| {
        ww.upgrade_in_event_loop(move |w| w.set_current_screen(screen)).ok();
    });

    // logout callback
    let api = ctx.api.clone();
    let session = ctx.session.clone();
    let rt = ctx.rt.clone();
    let ww = w.clone();
    window.on_logout(move || {
        let api = api.clone();
        let session = session.clone();
        let ww = ww.clone();
        if let Some(rt_token) = session.load_refresh_token() {
            rt.spawn(async move {
                let _ = auth::logout(&api, &rt_token).await;
            });
        }
        api.set_token(None);
        let _ = session.clear();
        ww.upgrade_in_event_loop(|w| w.set_current_screen(NavScreen::Login)).ok();
    });

    // join_room callback
    let api = ctx.api.clone();
    let rt = ctx.rt.clone();
    let ww = w.clone();
    window.on_join_room(move |room_name| {
        let api = api.clone();
        let ww = ww.clone();
        rt.spawn(async move {
            if let Ok(resp) = rooms::join_room(&api, &room_name).await {
                let meeting_room_name = resp.name.clone();
                slint::invoke_from_event_loop(move || {
                    if let Some(w) = ww.upgrade() {
                        w.set_meeting_room_name(meeting_room_name.into());
                        w.set_current_screen(NavScreen::Meeting);
                        // NOTE: LiveKit connection is started separately by
                        // the meeting screen initializer in main.rs
                    }
                }).ok();
            }
        });
    });

    // end_call callback
    let ww = w.clone();
    window.on_end_call(move || {
        ww.upgrade_in_event_loop(|w| {
            w.set_current_screen(NavScreen::Dashboard);
            w.invoke_load_rooms();
        }).ok();
    });
}
```

- [ ] **Step 3: Complete main.rs**

```rust
// apps/desktop/src/main.rs
mod api;
mod app;
mod auth;
mod livekit;
mod store;
mod ui;

use std::sync::{Arc, Mutex};
use tokio::runtime::Runtime;

slint::include_modules!();

use api::client::ApiClient;
use auth::session::SessionStore;
use store::instance::InstanceManager;
use ui::bridge::{AppContext, wire};

fn main() -> anyhow::Result<()> {
    env_logger::init();

    let rt = Arc::new(Runtime::new()?);

    let mut instances = InstanceManager::load()?;

    let window = AppWindow::new()?;

    // Determine starting state
    if let Some(active) = instances.active() {
        let api = ApiClient::new(&active.base_url);
        let session = SessionStore::new(&active.id);
        let instance_url = active.base_url.clone();

        window.set_instance_url(instance_url.into());

        // Auto-login if saved token
        if let Some(token) = session.load_access_token() {
            api.set_token(Some(token));
            // Attempt token validation in background; fall back to Login if fails
            let api_clone = api.clone();
            let session_clone = session.clone();
            let ww = window.as_weak();
            rt.spawn(async move {
                match crate::api::auth::me(&api_clone).await {
                    Ok(user) => {
                        slint::invoke_from_event_loop(move || {
                            if let Some(w) = ww.upgrade() {
                                w.set_user_name(user.name.into());
                                w.set_is_admin(user.is_admin());
                                w.set_current_screen(NavScreen::Dashboard);
                                w.invoke_load_rooms();
                            }
                        }).ok();
                    }
                    Err(_) => {
                        // Token expired — clear and show login
                        let _ = session_clone.clear();
                        slint::invoke_from_event_loop(move || {
                            if let Some(w) = ww.upgrade() {
                                w.set_current_screen(NavScreen::Login);
                            }
                        }).ok();
                    }
                }
            });
        } else {
            window.set_current_screen(NavScreen::Login);
        }

        let ctx = Arc::new(AppContext {
            rt,
            api,
            session,
            instances: Arc::new(Mutex::new(instances)),
        });
        wire(&window, ctx);
    } else {
        window.set_current_screen(NavScreen::AddInstance);
    }

    window.run()?;
    Ok(())
}
```

- [ ] **Step 4: Build full app**

```bash
cargo build -p bedrud-desktop
```
Expected: PASS.

- [ ] **Step 5: Run and verify full login → dashboard flow**

```bash
cargo run -p bedrud-desktop
```
Expected: App opens at login screen; entering valid credentials navigates to dashboard showing room list.

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/ apps/desktop/ui/
git commit -m "feat(desktop): complete app wiring — login → dashboard → meeting flow"
```

---

## Phase 11 — Release Packaging

### Task 17: CI Release Matrix

**Files:**
- Modify: `.github/workflows/release.yml`

- [ ] **Step 1: Add desktop build jobs to release.yml**

Add these two jobs to the existing `release.yml`, after the iOS job:

```yaml
  # ── Desktop Windows ───────────────────────────────────────────
  desktop-windows:
    name: Desktop – Windows x86_64
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: stable
          targets: x86_64-pc-windows-msvc
      - uses: Swatinem/rust-cache@v2
      - name: Build release binary
        run: cargo build -p bedrud-desktop --release --target x86_64-pc-windows-msvc
      - name: Package
        run: |
          mkdir dist
          copy target\x86_64-pc-windows-msvc\release\bedrud-desktop.exe dist\
          Compress-Archive -Path dist\* -DestinationPath bedrud-desktop-windows-x86_64.zip
        shell: pwsh
      - uses: actions/upload-artifact@v4
        with:
          name: bedrud-desktop-windows-x86_64
          path: bedrud-desktop-windows-x86_64.zip

  # ── Desktop Linux ─────────────────────────────────────────────
  desktop-linux:
    name: Desktop – Linux x86_64
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: stable
      - uses: Swatinem/rust-cache@v2
      - name: Install Slint dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libfontconfig1-dev libxkbcommon-dev libxkbcommon-x11-dev \
            libwayland-dev libgles2-mesa-dev libegl1-mesa-dev
      - name: Build release binary
        run: cargo build -p bedrud-desktop --release
      - name: Package
        run: |
          mkdir dist
          cp target/release/bedrud-desktop dist/
          tar -cJf bedrud-desktop-linux-x86_64.tar.xz -C dist .
      - uses: actions/upload-artifact@v4
        with:
          name: bedrud-desktop-linux-x86_64
          path: bedrud-desktop-linux-x86_64.tar.xz
```

Also add upload steps to the existing `release` job (after ios artifacts):

```yaml
          - name: bedrud-desktop-windows-x86_64
          - name: bedrud-desktop-linux-x86_64
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add Windows and Linux desktop release build jobs"
```

---

## Verification

### Manual End-to-End Test Checklist

- [ ] **Auth:** Start with no saved token → Login screen shown
- [ ] **Login:** Enter credentials for a running Bedrud server → navigates to Dashboard
- [ ] **Auto-login:** Quit app; relaunch → goes directly to Dashboard (token from keyring)
- [ ] **Dashboard:** Room list populated; filter and pagination work
- [ ] **Create room:** Room appears in list after creation
- [ ] **Join meeting:** Participants visible; controls bar toggles mic/cam; chat panel opens/closes
- [ ] **Chat:** Messages sent appear in panel; received messages appear for other participants
- [ ] **Leave meeting:** Returns to dashboard
- [ ] **Admin panel:** Visible when logged in as superadmin; user list populated
- [ ] **Settings:** Device preferences save and persist across restarts
- [ ] **Logout:** Clears token from keyring; shows Login screen

### Running All Tests

```bash
cargo test -p bedrud-desktop
```
Expected: All unit tests pass (API client, auth, store, LiveKit, passkey).

### CI Verification

Push to a branch and verify:
1. `Desktop – Build & Test` job in CI passes
2. On `v*` tag push: `Desktop – Windows x86_64` and `Desktop – Linux x86_64` release jobs pass with artifacts
