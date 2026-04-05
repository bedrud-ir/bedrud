use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Instance {
    pub id: String,
    pub label: String,
    pub base_url: String,
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
