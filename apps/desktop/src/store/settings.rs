use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum Theme {
    Light,
    Dark,
    #[default] System,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum NoiseSuppression {
    #[default] None,
    RNNoise,
    Krisp,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Settings {
    pub theme: Theme,
    pub default_mic_device: Option<String>,
    pub default_cam_device: Option<String>,
    pub default_speaker_device: Option<String>,
    pub noise_suppression: NoiseSuppression,
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
