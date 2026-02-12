# Installation

This guide covers all installation scenarios for deploying Bedrud to a production server.

## Prerequisites

- A Debian-based Linux server (Debian 12+ recommended)
- Root or sudo access
- Ports 80 and 443 available for HTTPS
- For Let's Encrypt, a domain name pointing to your server's IP

---

## Scenario 1: Fully Automated Install (Recommended)

Use the Python CLI tool to build, upload, and configure your server with a single command from your local machine.

```bash
cd tools/cli
uv run python bedrud.py --auto-config \
  --ip <your-server-ip> \
  --user root \
  --auth-key ~/.ssh/id_rsa \
  --domain meet.example.com \
  --acme-email admin@example.com
```

**What it does:**

1. Builds the backend binary (`dist/bedrud`)
2. Compresses it into `bedrud.tar.xz`
3. Uploads it to the server via rsync
4. Clears conflicting services (Nginx, Apache, Caddy)
5. Configures the firewall (UFW)
6. Runs the internal `install` logic on the server

---

## Scenario 2: Interactive Install

If you already have the `bedrud` binary on the server:

```bash
sudo ./bedrud install
```

The installer will prompt you for:

- **IP address** — auto-detected with confirmation
- **Domain** — if provided with an email, enables Let's Encrypt TLS
- **Self-signed TLS** — offered if no domain is provided

---

## Scenario 3: Non-Interactive (Flag-Based)

### Let's Encrypt (domain required)

```bash
sudo ./bedrud install --tls --domain meet.example.com --email webmaster@example.com
```

### Self-Signed TLS (IP-based)

```bash
sudo ./bedrud install --tls --ip 1.2.3.4
```

### Plain HTTP (dev/internal only)

```bash
sudo ./bedrud install --ip 1.2.3.4
```

### Self-Signed for a Domain (pre-DNS testing)

```bash
sudo ./bedrud install --tls --domain meet.example.com
```

### Custom Port

```bash
sudo ./bedrud install --tls --port 8443 --domain meet.example.com
```

### External Certificates

```bash
sudo ./bedrud install --tls --cert /path/to/fullchain.pem --key /path/to/privkey.pem
```

### Custom LiveKit Ports

```bash
sudo ./bedrud install --lk-port 9000 --lk-tcp-port 9001 --lk-udp-port 9002
```

---

## What the Installer Does

When you run `bedrud install`, the following happens:

| Step | Action |
|------|--------|
| 1 | Creates directories: `/etc/bedrud`, `/var/lib/bedrud`, `/var/log/bedrud` |
| 2 | Copies the binary to `/usr/local/bin/bedrud` |
| 3 | Generates `/etc/bedrud/config.yaml` with your settings |
| 4 | Generates `/etc/bedrud/livekit.yaml` for the media server |
| 5 | Creates two systemd services: `livekit.service` and `bedrud.service` |
| 6 | Enables and starts both services |
| 7 | Initializes the SQLite database and certificate cache |

### Service Entrypoints

```
bedrud --run --config /etc/bedrud/config.yaml       # API + web server
bedrud --livekit --config /etc/bedrud/livekit.yaml   # Media server
```

---

## Post-Installation

### Create an Admin User

```bash
./bedrud-cli -create -email="admin@example.com" -password="securepassword" -name="Admin User"
./bedrud-cli -make-admin -email="admin@example.com"
```

!!! note
    `bedrud-cli` is a separate utility for backend management tasks.

### Verify Services

```bash
systemctl status bedrud livekit
```

### View Logs

```bash
tail -f /var/log/bedrud/bedrud.log
```

---

## Uninstallation

To completely remove Bedrud:

```bash
sudo ./bedrud uninstall
```

This stops services, removes systemd units, deletes the binary from `/usr/local/bin`, and cleans up `/etc/bedrud`, `/var/lib/bedrud`, and `/var/log/bedrud`.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 80/443 in use | Stop conflicting web servers: `systemctl stop nginx apache2 caddy` |
| Services won't start | Check logs: `journalctl -u bedrud -u livekit --no-pager -n 50` |
| TLS certificate issues | Ensure your domain's DNS A record points to the server IP |
| LiveKit port conflicts | Use `--lk-port`, `--lk-tcp-port`, `--lk-udp-port` flags |
