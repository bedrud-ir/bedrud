use std::sync::{Arc, Mutex};
use tokio::runtime::Runtime;
use slint::ComponentHandle;
use slint::Model;

use crate::AppWindow;
use crate::NavScreen;
use crate::RoomData;
use crate::ChatMessage;
use crate::api::{auth, rooms};
use crate::api::client::ApiClient;
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

    // login
    {
        let api = ctx.api.clone();
        let session = ctx.session.clone();
        let rt = ctx.rt.clone();
        let ww = w.clone();
        window.on_login(move |email, password| {
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
            if let Some(w) = ww.upgrade() { w.set_current_screen(screen); }
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

    // save_settings (navigate back to dashboard)
    {
        let ww = w.clone();
        window.on_save_settings(move || {
            if let Some(w) = ww.upgrade() {
                w.set_current_screen(NavScreen::Dashboard);
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
