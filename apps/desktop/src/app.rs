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
