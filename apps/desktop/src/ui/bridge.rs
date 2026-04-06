use std::sync::{Arc, Mutex};
use tokio::runtime::Runtime;
use slint::ComponentHandle;
use slint::Model;

use crate::AppWindow;
use crate::NavScreen;
use crate::RoomData;
use crate::ChatMessage;
use crate::InstanceData;
use crate::api::{auth, rooms};
use crate::api::client::ApiClient;
use crate::auth::session::SessionStore;
use crate::store::instance::InstanceManager;
use crate::store::settings::{Settings, NoiseSuppression};
use crate::livekit::devices;

pub struct AppContext {
    pub rt: Arc<Runtime>,
    pub api: ApiClient,
    pub session: SessionStore,
    pub instances: Arc<Mutex<InstanceManager>>,
}

/// Wire all Slint callbacks on AppWindow to their Rust handlers.
pub fn wire(window: &AppWindow, ctx: Arc<AppContext>) {
    let w = window.as_weak();

    // login
    {
        let api = ctx.api.clone();
        let session = ctx.session.clone();
        let rt = ctx.rt.clone();
        let ww = w.clone();
        window.on_login(move |email, password| {
            log::info!("[bridge] login attempt for {}", email);
            let api = api.clone();
            let session = session.clone();
            let ww = ww.clone();
            if let Some(w) = ww.upgrade() { w.set_login_loading(true); }
            rt.spawn(async move {
                let result = auth::login(&api, &email, &password).await;
                slint::invoke_from_event_loop(move || {
                    if let Some(w) = ww.upgrade() {
                        w.set_login_loading(false);
                        match result {
                            Ok(resp) => {
                                log::info!("[bridge] login success: {}", resp.user.name);
                                api.set_token(Some(resp.tokens.access_token.clone()));
                                let _ = session.save_access_token(&resp.tokens.access_token);
                                if let Some(rt_tok) = resp.tokens.refresh_token.as_deref() {
                                    let _ = session.save_refresh_token(rt_tok);
                                }
                                let is_admin = resp.user.is_admin();
                                w.set_user_name(resp.user.name.into());
                                w.set_is_admin(is_admin);
                                w.set_current_screen(NavScreen::Dashboard);
                                w.invoke_load_rooms();
                            }
                            Err(e) => {
                                log::error!("[bridge] login failed: {}", e);
                                w.set_login_error(e.to_string().into());
                            }
                        }
                    }
                }).ok();
            });
        });
    }

    // load_rooms
    {
        let api = ctx.api.clone();
        let rt = ctx.rt.clone();
        let ww = w.clone();
        window.on_load_rooms(move || {
            let api = api.clone();
            let ww = ww.clone();
            if let Some(w) = ww.upgrade() { w.set_dashboard_loading(true); }
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
    }

    // navigate_to
    {
        let ww = w.clone();
        window.on_navigate_to(move |screen| {
            log::info!("[bridge] navigate to {:?}", screen);
            if let Some(w) = ww.upgrade() { w.set_current_screen(screen); }
        });
    }

    // load_instances
    {
        let ww = w.clone();
        let instances = ctx.instances.clone();
        window.on_load_instances(move || {
            log::info!("[bridge] loading instance list");
            let mgr = instances.lock().unwrap();
            let active_id = mgr.active().map(|a| a.id.clone());
            let list: Vec<InstanceData> = mgr.instances().iter().map(|i| InstanceData {
                id: i.id.clone().into(),
                label: i.label.clone().into(),
                base_url: i.base_url.clone().into(),
                is_active: Some(&i.id) == active_id.as_ref(),
            }).collect();
            drop(mgr);
            if let Some(w) = ww.upgrade() {
                w.set_instance_list(std::rc::Rc::new(slint::VecModel::from(list)).into());
            }
        });
    }

    // switch_instance
    {
        let ww = w.clone();
        let instances = ctx.instances.clone();
        let rt = ctx.rt.clone();
        window.on_switch_instance(move |id| {
            log::info!("[bridge] switching to instance {}", id);
            let mut mgr = instances.lock().unwrap();
            if let Err(e) = mgr.set_active(&id) {
                log::error!("[bridge] switch-instance failed: {}", e);
                drop(mgr);
                return;
            }
            let inst = mgr.active().unwrap();
            let base_url = inst.base_url.clone();
            let instance_id = inst.id.clone();
            drop(mgr);

            let api = ApiClient::new(&base_url);
            let session = SessionStore::new(&instance_id);

            if let Some(w) = ww.upgrade() {
                w.set_instance_url(base_url.into());

                let new_ctx = Arc::new(AppContext {
                    rt: rt.clone(),
                    api: api.clone(),
                    session: session.clone(),
                    instances: instances.clone(),
                });
                wire(&w, new_ctx);

                // Try auto-login on the switched instance
                if let Some(token) = session.load_access_token() {
                    log::info!("[bridge] switched instance has saved token, auto-login");
                    api.set_token(Some(token));
                    let api2 = api.clone();
                    let session2 = session.clone();
                    let ww2 = w.as_weak();
                    rt.spawn(async move {
                        match auth::me(&api2).await {
                            Ok(user) => {
                                log::info!("[bridge] auto-login success: {}", user.name);
                                slint::invoke_from_event_loop(move || {
                                    if let Some(w) = ww2.upgrade() {
                                        let is_admin = user.is_admin();
                                        w.set_user_name(user.name.into());
                                        w.set_is_admin(is_admin);
                                        w.set_current_screen(NavScreen::Dashboard);
                                        w.invoke_load_rooms();
                                    }
                                }).ok();
                            }
                            Err(e) => {
                                log::warn!("[bridge] auto-login failed: {}", e);
                                let _ = session2.clear();
                                slint::invoke_from_event_loop(move || {
                                    if let Some(w) = ww2.upgrade() {
                                        w.set_current_screen(NavScreen::Login);
                                    }
                                }).ok();
                            }
                        }
                    });
                } else {
                    w.set_current_screen(NavScreen::Login);
                }
            }
        });
    }

    // delete_instance
    {
        let ww = w.clone();
        let instances = ctx.instances.clone();
        window.on_delete_instance(move |id| {
            log::info!("[bridge] deleting instance {}", id);
            let mut mgr = instances.lock().unwrap();
            if let Err(e) = mgr.remove(&id) {
                log::error!("[bridge] delete-instance failed: {}", e);
                drop(mgr);
                return;
            }
            // Refresh the list
            let active_id = mgr.active().map(|a| a.id.clone());
            let list: Vec<InstanceData> = mgr.instances().iter().map(|i| InstanceData {
                id: i.id.clone().into(),
                label: i.label.clone().into(),
                base_url: i.base_url.clone().into(),
                is_active: Some(&i.id) == active_id.as_ref(),
            }).collect();
            let has_instances = !list.is_empty();
            drop(mgr);

            if let Some(w) = ww.upgrade() {
                w.set_instance_list(std::rc::Rc::new(slint::VecModel::from(list)).into());
                if !has_instances {
                    w.set_current_screen(NavScreen::AddInstance);
                }
            }
        });
    }

    // logout
    {
        let api = ctx.api.clone();
        let session = ctx.session.clone();
        let rt = ctx.rt.clone();
        let ww = w.clone();
        window.on_logout(move || {
            let api = api.clone();
            let session = session.clone();
            let ww = ww.clone();
            if let Some(rt_tok) = session.load_refresh_token() {
                let api2 = api.clone();
                rt.spawn(async move {
                    let _ = auth::logout(&api2, &rt_tok).await;
                });
            }
            api.set_token(None);
            let _ = session.clear();
            if let Some(w) = ww.upgrade() { w.set_current_screen(NavScreen::Login); }
        });
    }

    // join_room
    {
        let api = ctx.api.clone();
        let rt = ctx.rt.clone();
        let ww = w.clone();
        window.on_join_room(move |room_name| {
            let api = api.clone();
            let ww = ww.clone();
            rt.spawn(async move {
                if let Ok(resp) = rooms::join_room(&api, &room_name).await {
                    let meeting_name = resp.name.clone();
                    slint::invoke_from_event_loop(move || {
                        if let Some(w) = ww.upgrade() {
                            w.set_meeting_room_name(meeting_name.into());
                            w.set_current_screen(NavScreen::Meeting);
                        }
                    }).ok();
                }
            });
        });
    }

    // end_call
    {
        let ww = w.clone();
        window.on_end_call(move || {
            if let Some(w) = ww.upgrade() {
                w.set_current_screen(NavScreen::Dashboard);
                w.invoke_load_rooms();
            }
        });
    }

    // toggle_mic (local state only)
    {
        let ww = w.clone();
        window.on_toggle_mic(move || {
            if let Some(w) = ww.upgrade() {
                let current = w.get_mic_enabled();
                w.set_mic_enabled(!current);
            }
        });
    }

    // toggle_cam (local state only)
    {
        let ww = w.clone();
        window.on_toggle_cam(move || {
            if let Some(w) = ww.upgrade() {
                let current = w.get_cam_enabled();
                w.set_cam_enabled(!current);
            }
        });
    }

    // Populate audio device lists and load saved settings into UI
    {
        let input_devs = devices::list_input_devices();
        let output_devs = devices::list_output_devices();
        let settings = Settings::load();

        let mic_names: Vec<slint::SharedString> = input_devs.iter().map(|d| d.name.clone().into()).collect();
        let speaker_names: Vec<slint::SharedString> = output_devs.iter().map(|d| d.name.clone().into()).collect();

        window.set_mic_devices(std::rc::Rc::new(slint::VecModel::from(mic_names)).into());
        window.set_speaker_devices(std::rc::Rc::new(slint::VecModel::from(speaker_names)).into());

        // Restore saved device selections (fall back to default device)
        if let Some(ref saved_mic) = settings.default_mic_device {
            if input_devs.iter().any(|d| &d.name == saved_mic) {
                window.set_selected_mic(saved_mic.clone().into());
            }
        }
        if window.get_selected_mic().is_empty() {
            if let Some(def) = input_devs.iter().find(|d| d.is_default) {
                window.set_selected_mic(def.name.clone().into());
            }
        }

        if let Some(ref saved_spk) = settings.default_speaker_device {
            if output_devs.iter().any(|d| &d.name == saved_spk) {
                window.set_selected_speaker(saved_spk.clone().into());
            }
        }
        if window.get_selected_speaker().is_empty() {
            if let Some(def) = output_devs.iter().find(|d| d.is_default) {
                window.set_selected_speaker(def.name.clone().into());
            }
        }

        // Restore noise suppression & echo cancellation
        let ns_idx = match settings.noise_suppression {
            NoiseSuppression::None => 0,
            NoiseSuppression::RNNoise => 1,
            NoiseSuppression::Krisp => 2,
        };
        window.set_noise_suppression_index(ns_idx);
        window.set_echo_cancellation(settings.echo_cancellation);

        log::info!(
            "[bridge] audio settings loaded: mic={:?} spk={:?} ns={} ec={}",
            window.get_selected_mic().to_string(),
            window.get_selected_speaker().to_string(),
            ns_idx,
            settings.echo_cancellation,
        );
    }

    // save_settings — persist to disk and navigate back
    {
        let ww = w.clone();
        window.on_save_settings(move || {
            if let Some(w) = ww.upgrade() {
                let settings = read_settings_from_ui(&w);
                if let Err(e) = settings.save() {
                    log::error!("[bridge] failed to save settings: {}", e);
                } else {
                    log::info!("[bridge] settings saved");
                }
                w.set_current_screen(NavScreen::Dashboard);
            }
        });
    }

    // settings_changed — live-apply audio settings during active call
    {
        let ww = w.clone();
        window.on_settings_changed(move || {
            if let Some(w) = ww.upgrade() {
                let mic = w.get_selected_mic().to_string();
                let spk = w.get_selected_speaker().to_string();
                let ns = w.get_noise_suppression_index();
                let ec = w.get_echo_cancellation();
                log::info!(
                    "[bridge] settings changed (live): mic={:?} spk={:?} ns={} ec={}",
                    mic, spk, ns, ec,
                );
                // TODO: apply to active LiveKit room when integrated:
                // - switch mic/speaker device
                // - toggle echo cancellation
                // - switch noise suppression processor
            }
        });
    }

    // passkey_login — stub: passkey is complex, just show an error
    {
        let ww = w.clone();
        window.on_passkey_login(move || {
            if let Some(w) = ww.upgrade() {
                w.set_login_error("Passkey login is not yet supported on desktop.".into());
            }
        });
    }

    // guest_login — call auth::guest_login
    {
        let api = ctx.api.clone();
        let session = ctx.session.clone();
        let rt = ctx.rt.clone();
        let ww = w.clone();
        window.on_guest_login(move |name| {
            let api = api.clone();
            let session = session.clone();
            let ww = ww.clone();
            rt.spawn(async move {
                let result = auth::guest_login(&api, &name).await;
                slint::invoke_from_event_loop(move || {
                    if let Some(w) = ww.upgrade() {
                        match result {
                            Ok(resp) => {
                                api.set_token(Some(resp.tokens.access_token.clone()));
                                let _ = session.save_access_token(&resp.tokens.access_token);
                                w.set_user_name(resp.user.name.into());
                                w.set_is_admin(false);
                                w.set_current_screen(NavScreen::Dashboard);
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
    }

    // register — call auth::register
    {
        let api = ctx.api.clone();
        let session = ctx.session.clone();
        let rt = ctx.rt.clone();
        let ww = w.clone();
        window.on_register(move |email, name, password, invite_token| {
            let api = api.clone();
            let session = session.clone();
            let ww = ww.clone();
            let invite = if invite_token.is_empty() { None } else { Some(invite_token.to_string()) };
            rt.spawn(async move {
                let result = auth::register(&api, &email, &name, &password, invite.as_deref()).await;
                slint::invoke_from_event_loop(move || {
                    if let Some(w) = ww.upgrade() {
                        match result {
                            Ok(resp) => {
                                api.set_token(Some(resp.tokens.access_token.clone()));
                                let _ = session.save_access_token(&resp.tokens.access_token);
                                let is_admin = resp.user.is_admin();
                                w.set_user_name(resp.user.name.into());
                                w.set_is_admin(is_admin);
                                w.set_current_screen(NavScreen::Dashboard);
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
    }

    // create_room — call rooms::create_room
    {
        let api = ctx.api.clone();
        let rt = ctx.rt.clone();
        let ww = w.clone();
        window.on_create_room(move |name, is_public, max_participants| {
            let api = api.clone();
            let ww = ww.clone();
            let room_name = if name.is_empty() {
                None
            } else {
                Some(name.to_string())
            };
            rt.spawn(async move {
                let req = rooms::CreateRoomRequest {
                    name: room_name,
                    is_public,
                    max_participants,
                    settings: rooms::RoomSettings::default(),
                };
                if rooms::create_room(&api, req).await.is_ok() {
                    slint::invoke_from_event_loop(move || {
                        if let Some(w) = ww.upgrade() {
                            w.invoke_load_rooms();
                        }
                    }).ok();
                }
            });
        });
    }

    // delete_room — call rooms::delete_room
    {
        let api = ctx.api.clone();
        let rt = ctx.rt.clone();
        let ww = w.clone();
        window.on_delete_room(move |room_id| {
            let api = api.clone();
            let ww = ww.clone();
            rt.spawn(async move {
                if rooms::delete_room(&api, &room_id).await.is_ok() {
                    slint::invoke_from_event_loop(move || {
                        if let Some(w) = ww.upgrade() {
                            w.invoke_load_rooms();
                        }
                    }).ok();
                }
            });
        });
    }

    // send_chat — append to chat messages model
    {
        let ww = w.clone();
        window.on_send_chat(move |message| {
            if let Some(w) = ww.upgrade() {
                let current = w.get_chat_messages();
                let mut messages: Vec<ChatMessage> = (0..current.row_count())
                    .map(|i| current.row_data(i).unwrap())
                    .collect();
                messages.push(ChatMessage {
                    sender: w.get_user_name(),
                    content: message,
                    timestamp: "".into(),
                    is_system: false,
                });
                w.set_chat_messages(std::rc::Rc::new(slint::VecModel::from(messages)).into());
            }
        });
    }
}

/// Read current audio settings from the Slint UI into a Settings struct.
fn read_settings_from_ui(w: &AppWindow) -> Settings {
    let mic = w.get_selected_mic().to_string();
    let spk = w.get_selected_speaker().to_string();
    let ns = match w.get_noise_suppression_index() {
        1 => NoiseSuppression::RNNoise,
        2 => NoiseSuppression::Krisp,
        _ => NoiseSuppression::None,
    };

    Settings {
        theme: crate::store::settings::Theme::default(), // theme handled separately
        default_mic_device: if mic.is_empty() { None } else { Some(mic) },
        default_cam_device: None,
        default_speaker_device: if spk.is_empty() { None } else { Some(spk) },
        noise_suppression: ns,
        echo_cancellation: w.get_echo_cancellation(),
    }
}
