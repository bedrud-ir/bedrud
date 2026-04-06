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
    log::info!("[main] starting bedrud-desktop");

    let rt = Arc::new(Runtime::new()?);

    let instances = InstanceManager::load()?;
    log::info!("[main] loaded {} instance(s)", instances.instances().len());
    let instances = Arc::new(Mutex::new(instances));

    let window = AppWindow::new()?;

    // Wire add-instance — always available, even with no active instance
    {
        let ww = window.as_weak();
        let rt_clone = rt.clone();
        let instances_clone = instances.clone();
        window.on_add_instance(move |label, url| {
            let url = url.trim().to_string();
            let label = label.trim().to_string();

            if url.is_empty() {
                log::warn!("[main] add-instance: empty URL");
                if let Some(w) = ww.upgrade() {
                    w.set_add_instance_error("Server URL is required.".into());
                }
                return;
            }

            let display_label = if label.is_empty() { url.clone() } else { label };
            log::info!("[main] adding instance label={:?} url={:?}", display_label, url);

            let mut mgr = instances_clone.lock().unwrap();
            match mgr.add(&display_label, &url) {
                Ok(_id) => {
                    log::info!("[main] instance added, navigating to login");
                    let inst = mgr.active().unwrap();
                    let base_url = inst.base_url.clone();
                    let instance_id = inst.id.clone();
                    drop(mgr);

                    let api = ApiClient::new(&base_url);
                    let session = SessionStore::new(&instance_id);

                    if let Some(w) = ww.upgrade() {
                        w.set_instance_url(base_url.into());
                        w.set_add_instance_error("".into());
                        w.set_add_instance_label("".into());
                        w.set_add_instance_url("".into());

                        let ctx = Arc::new(AppContext {
                            rt: rt_clone.clone(),
                            api,
                            session,
                            instances: instances_clone.clone(),
                        });
                        wire(&w, ctx);
                        w.set_current_screen(NavScreen::Login);
                    }
                }
                Err(e) => {
                    log::error!("[main] add-instance failed: {}", e);
                    drop(mgr);
                    if let Some(w) = ww.upgrade() {
                        w.set_add_instance_error(e.to_string().into());
                    }
                }
            }
        });
    }

    {
        let mgr = instances.lock().unwrap();
        if let Some(active) = mgr.active() {
            log::info!("[main] active instance: {} ({})", active.label, active.base_url);
            let base_url = active.base_url.clone();
            let instance_id = active.id.clone();
            drop(mgr);

            let api = ApiClient::new(&base_url);
            let session = SessionStore::new(&instance_id);

            window.set_instance_url(base_url.into());

            let ctx = Arc::new(AppContext {
                rt: rt.clone(),
                api: api.clone(),
                session: session.clone(),
                instances: instances.clone(),
            });
            wire(&window, ctx);

            // Auto-login if saved token exists
            if let Some(token) = session.load_access_token() {
                log::info!("[main] found saved token, attempting auto-login");
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
                        Err(e) => {
                            log::warn!("[main] auto-login failed: {}", e);
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
                log::info!("[main] no saved token, showing login");
                window.set_current_screen(NavScreen::Login);
            }
        } else {
            drop(mgr);
            log::info!("[main] no instances configured, showing add-instance");
            window.set_current_screen(NavScreen::AddInstance);
        }
    }

    window.run()?;
    Ok(())
}
