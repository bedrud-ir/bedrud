# Appliance Mode

Bedrud is designed to run as a self-contained "appliance" for video meetings. A single executable binary packages everything needed — frontend, backend, and the LiveKit media server.

## Key Features

| Feature | Description |
|---------|-------------|
| Zero external dependencies | No Node.js, Redis, or separate media server needed |
| Embedded media server | LiveKit binary included and managed automatically |
| Embedded frontend | Svelte 5 UI compiled into the Go binary |
| SQLite storage | No database server required |
| Built-in TLS | Self-signed certificates or Let's Encrypt |
| Built-in installer | Configures systemd, directories, and configs |

## Running the Binary

### Start the Bedrud Server

```bash
./bedrud --run --config config.yaml
```

### Start the LiveKit Media Server

```bash
./bedrud --livekit --config livekit.yaml
```

The binary contains both the API server and the media server. Use flags to choose which to start.

## Installation

### Quick Install (Debian/Ubuntu)

```bash
# With Let's Encrypt TLS
sudo ./bedrud install --tls --domain meet.example.com --email admin@example.com

# With self-signed certificate
sudo ./bedrud install --tls --ip 1.2.3.4

# Plain HTTP (dev only)
sudo ./bedrud install --ip 1.2.3.4
```

### What the Installer Does

| Step | Description |
|------|-------------|
| 1 | Creates `/etc/bedrud/`, `/var/lib/bedrud/`, `/var/log/bedrud/` |
| 2 | Copies binary to `/usr/local/bin/bedrud` |
| 3 | Generates `config.yaml` with your server settings |
| 4 | Generates `livekit.yaml` for the media server |
| 5 | Creates `livekit.service` and `bedrud.service` systemd units |
| 6 | Enables and starts both services |
| 7 | Initializes the database and certificate cache |

### Service Architecture

After installation, two systemd services run:

```
┌──────────────────┐     ┌──────────────────┐
│  bedrud.service  │     │  livekit.service  │
│                  │     │                   │
│  bedrud --run    │────►│  bedrud --livekit │
│  (API + Web UI)  │     │  (WebRTC media)   │
└──────────────────┘     └───────────────────┘
         │
         ▼
   ┌──────────┐
   │  SQLite  │
   │ database │
   └──────────┘
```

## Configuration Files

| File | Purpose |
|------|---------|
| `/etc/bedrud/config.yaml` | Main server configuration |
| `/etc/bedrud/livekit.yaml` | Media server configuration |
| `/var/lib/bedrud/bedrud.db` | SQLite database |
| `/var/log/bedrud/bedrud.log` | Application logs |

See the [Configuration Reference](../getting-started/configuration.md) for all options.

## Post-Installation

### Create Your First Admin

```bash
./bedrud-cli -create -email="admin@example.com" -password="securepassword" -name="Admin"
./bedrud-cli -make-admin -email="admin@example.com"
```

### Check Service Status

```bash
systemctl status bedrud livekit
```

### View Logs

```bash
tail -f /var/log/bedrud/bedrud.log
journalctl -u bedrud -f
```

## Uninstallation

```bash
sudo ./bedrud uninstall
```

This completely removes:

- Systemd service files
- Binary from `/usr/local/bin/`
- Configuration in `/etc/bedrud/`
- Data in `/var/lib/bedrud/`
- Logs in `/var/log/bedrud/`
