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

    let instances = InstanceManager::load()?;

    let window = AppWindow::new()?;

    if let Some(active) = instances.active() {
        let base_url = active.base_url.clone();
        let instance_id = active.id.clone();

        let api = ApiClient::new(&base_url);
        let session = SessionStore::new(&instance_id);

        window.set_instance_url(base_url.into());

        let ctx = Arc::new(AppContext {
            rt: rt.clone(),
            api: api.clone(),
            session: session.clone(),
            instances: Arc::new(Mutex::new(instances)),
        });
        wire(&window, ctx);

        // Auto-login if saved token exists (spawned AFTER wire so on_load_rooms is registered)
        if let Some(token) = session.load_access_token() {
            api.set_token(Some(token));
            let api_clone = api.clone();
            let session_clone = session.clone();
            let ww = window.as_weak();
            rt.spawn(async move {
                match crate::api::auth::me(&api_clone).await {
                    Ok(user) => {
                        slint::invoke_from_event_loop(move || {
                            if let Some(w) = ww.upgrade() {
                                let is_admin = user.is_admin();
                                w.set_user_name(user.name.into());
                                w.set_is_admin(is_admin);
                                w.set_current_screen(NavScreen::Dashboard);
                                w.invoke_load_rooms();
                            }
                        }).ok();
                    }
                    Err(_) => {
                        let _ = session_clone.clear();
                        slint::invoke_from_event_loop(move || {
                            if let Some(w) = ww.upgrade() {
                                w.set_login_error("Session expired. Please log in again.".into());
                                w.set_current_screen(NavScreen::Login);
                            }
                        }).ok();
                    }
                }
            });
        } else {
            window.set_current_screen(NavScreen::Login);
        }
    } else {
        window.set_current_screen(NavScreen::AddInstance);
    }

    window.run()?;
    Ok(())
}
