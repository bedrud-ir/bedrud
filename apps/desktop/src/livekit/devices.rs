use cpal::traits::{DeviceTrait, HostTrait};

#[derive(Debug, Clone)]
pub struct AudioDevice {
    pub id: String,
    pub name: String,
    pub is_default: bool,
}

pub fn list_input_devices() -> Vec<AudioDevice> {
    let host = cpal::default_host();
    let default_name = host.default_input_device()
        .and_then(|d| d.name().ok());

    let devices = match host.input_devices() {
        Ok(iter) => iter.collect::<Vec<_>>(),
        Err(_) => return vec![],
    };

    devices
        .into_iter()
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

    let devices = match host.output_devices() {
        Ok(iter) => iter.collect::<Vec<_>>(),
        Err(_) => return vec![],
    };

    devices
        .into_iter()
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
        let devices = list_input_devices();
        let _ = devices;
    }

    #[test]
    fn output_devices_returns_vec() {
        let devices = list_output_devices();
        let _ = devices;
    }
}
