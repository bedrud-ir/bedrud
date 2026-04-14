# Quick Start

Deploy Bedrud and join a video meeting in under 5 minutes.

**This guide:** Download → Install → Verify → Join. For alternatives see [Installation](installation.md). For config see [Configuration](configuration.md).

> **Single binary, no internet needed after download.** It includes an embedded media server and SQLite — it works on isolated networks. Transfer the file, run one command, done.

---

## What You Need

| Requirement | Details |
|-------------|---------|
| A Linux server | amd64, with `sudo` access and `systemd`. Windows: Docker or WSL2. macOS: build from source |
| Open ports | `8090`, `7880`, `50000–60000/udp`. For auto-TLS: also `80` and `443` |
| Tools | `curl`, `tar` |
| A domain (optional) | With DNS A record pointing to your server. No domain? Works with IP — see alternatives below |

> **How it works:** You run one Bedrud **server**. People join meetings in their **browser** (no install) or via **native apps** (Android, Windows, macOS, Linux).

---

## 1. Download

```bash
curl -fsSL -o bedrud.tar.xz https://github.com/bedrud-ir/bedrud/releases/latest/download/bedrud_linux_amd64.tar.xz
tar -xJf bedrud.tar.xz
chmod +x bedrud
```

> **No internet on the server?** Download on any machine, transfer via USB or `scp bedrud.tar.xz user@server:/tmp/`, then extract there. Binary is fully self-contained — zero outbound requests after transfer.

> **Download failed?** Check internet access, or verify the URL at [github.com/bedrud-ir/bedrud/releases](https://github.com/bedrud-ir/bedrud/releases/latest).

---

## 2. Install

Replace `meet.example.com` and `admin@example.com` with your values:

```bash
sudo ./bedrud install --tls --domain meet.example.com --email admin@example.com
```

Installs binary, generates config, creates systemd services, provisions TLS, starts everything.

> **Port 80 or 443 busy?** Stop conflicting services: `sudo systemctl stop nginx apache2 caddy`, then re-run.

> **No domain?** Use your server IP instead:
> ```bash
> sudo ./bedrud install --tls --ip 1.2.3.4
> ```
> This uses a self-signed certificate. Browsers will warn but video works. For trusted certs on internal networks, see [Internal TLS Guide](../guides/internal-tls.md).

---

## 3. Verify

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8090
```

Expect: `200`

> **Not 200?** Check service status: `sudo systemctl status bedrud livekit`. Check logs: `journalctl -u bedrud -u livekit --no-pager -n 50`.

---

## 4. Register & Create Admin

Open `https://meet.example.com` (or `https://<your-ip>:8090`) in your browser:

1. **Register** — create your account
2. **Promote to admin** — back in terminal:
   ```bash
   sudo ./bedrud user promote --email admin@example.com
   ```
   Or create a new admin user directly:
   ```bash
   sudo ./bedrud user create --email admin@example.com --password secret --name "Admin"
   sudo ./bedrud user promote --email admin@example.com
   ```
3. Log in (or refresh) — **Admin** section appears in sidebar (Overview, Users, Rooms, Settings). Success: you're admin.
4. **Create a room** → **Join** → **Share video/audio** — grant camera/mic permissions when prompted

> **Admin dashboard** — After promoting, log in to access the admin panel at `/dashboard/admin`. Manage users, rooms, system settings, and invite tokens.

> **CLI reference** — Full user management: `bedrud user promote`, `demote`, `create`, `delete`.

**Native clients** for Android, Windows, macOS, and Linux: [GitHub Releases](https://github.com/bedrud-ir/bedrud/releases/latest). Or share the meeting link — participants join in any browser.

---

## Alternative Install Paths

### Docker

```bash
docker run -d --name bedrud \
  -p 8090:8090 \
  -p 7880:7880 \
  -p 50000-60000:50000-60000/udp \
  -v bedrud-data:/var/lib/bedrud \
  ghcr.io/bedrud-ir/bedrud:latest
```

Custom config, Docker Compose, and env vars: see the [Docker guide](../guides/docker.md).

### Build from Source

Requires [Go 1.24+](https://go.dev/dl/) and [Bun](https://bun.sh/):

```bash
git clone https://github.com/bedrud-ir/bedrud.git
cd bedrud
make init
make local-run
```

`make init` installs LiveKit, creates config, fetches deps. `make local-run` builds and starts on `http://localhost:8090`.

### Plain HTTP (dev / localhost only)

```bash
sudo ./bedrud install --ip 127.0.0.1
```

> **Warning:** Browsers block camera/mic on non-HTTPS except `localhost`. HTTP is dev-only.

### Non-Linux Systems

The `install` command is Linux-only. Place binary in PATH manually:

| OS      | How                                       |
|---------|-------------------------------------------|
| macOS   | `sudo cp bedrud /usr/local/bin/`          |
| Windows | Move `bedrud.exe` to a folder in `%PATH%` |

---

## Internal Networks

No public domain or outbound internet? See the [Internal TLS Guide](../guides/internal-tls.md) for private CA setup and client trust store configuration.

---

## Configuration

Installer generates `/etc/bedrud/config.yaml`. Defaults work for most setups.
Change `jwtSecret` and `sessionSecret` for production, then restart:

```bash
sudo systemctl restart bedrud livekit
```

To adjust room capacity, timeouts, or media ports, see the [LiveKit section in Configuration](configuration.md#livekit-configuration).

Full reference: [Configuration](configuration.md)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 80/443 in use | `sudo systemctl stop nginx apache2 caddy` |
| Services won't start | `journalctl -u bedrud -u livekit --no-pager -n 50` |
| TLS cert errors | Verify DNS: `dig meet.example.com`. Must point to server IP |
| No video / WebRTC failed | HTTPS required for camera. Use `--tls`. Open UDP 50000–60000 on firewall |
| LiveKit port conflicts | Use `--lk-port`, `--lk-tcp-port`, `--lk-udp-port` flags |
| Firewall blocking media | `sudo ufw allow 8090/tcp && sudo ufw allow 7880/tcp && sudo ufw allow 50000:60000/udp` |
| Self-signed cert warnings | See [Internal TLS Guide](../guides/internal-tls.md) for private CA setup |

---

## Teardown

```bash
# Binary install
sudo ./bedrud uninstall

# Docker
docker stop bedrud && docker rm bedrud && docker volume rm bedrud-data

# Source build
# Ctrl+C to stop, then: make clean
```

---

## Next Steps

- [Configuration Reference](configuration.md) — ports, database, auth providers, TURN
- [Installation Guide](installation.md) — package managers, advanced flags, all methods
- [Internal TLS Guide](../guides/internal-tls.md) — air-gapped deployment, private CA
- [Deployment Guide](../guides/deployment.md) — production setup, reverse proxy, scaling
- [Architecture Overview](../architecture/overview.md) — how the pieces fit together
- [API Docs](http://localhost:8090/api/swagger) — Swagger UI (running instance)
