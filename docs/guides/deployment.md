# Deployment Guide

This guide explains how to deploy Bedrud to a production server.

## Deployment Options

| Method | Best For |
|--------|----------|
| [Package Manager (apt/AUR)](#package-manager) | Managed install on supported Linux distros |
| [Automated CLI](#automated-cli-deployment) | Quick remote setup |
| [Manual Install](#manual-installation) | Full control over configuration |
| [Docker](#docker-deployment) | Containerized environments |
| [Appliance Mode](appliance.md) | Single-binary all-in-one setup |

---

## Package Manager

Install Bedrud on Debian/Ubuntu or Arch Linux using the native package manager. This is the recommended method for persistent server deployments where you want automatic updates via `apt upgrade` or the AUR.

See the [Package Installation guide](packages.md) for full instructions, including adding the apt GPG key and repository.

```bash
# Ubuntu / Debian
sudo apt install bedrud

# Arch Linux (AUR)
yay -S bedrud-bin
```

After installation, run the interactive installer to configure TLS, systemd services, and the database:

```bash
sudo bedrud install
```

---

## Automated CLI Deployment

The fastest way to deploy. Run from your local machine:

```bash
cd tools/cli
uv run python bedrud.py --auto-config \
  --ip <server-ip> \
  --user root \
  --auth-key ~/.ssh/id_rsa \
  --domain meet.example.com \
  --acme-email admin@example.com
```

This will:

1. Build the backend binary locally
2. Compress and upload it via rsync
3. Clear conflicting web servers
4. Configure the firewall
5. Install and start services on the server

### CLI Options

| Flag | Description |
|------|-------------|
| `--ip` | Server IP address |
| `--user` | SSH user (default: root) |
| `--auth-key` | Path to SSH private key |
| `--domain` | Domain name for Let's Encrypt |
| `--acme-email` | Email for Let's Encrypt |
| `--uninstall` | Remove Bedrud from server |

---

## Manual Installation

### 1. Build the Binary

```bash
make build-dist
```

This produces `dist/bedrud_linux_amd64.tar.xz`.

### 2. Upload to Server

```bash
scp dist/bedrud_linux_amd64.tar.xz root@server:/tmp/
ssh root@server "cd /tmp && tar xf bedrud_linux_amd64.tar.xz"
```

### 3. Install

```bash
ssh root@server
sudo /tmp/bedrud install --tls --domain meet.example.com --email admin@example.com
```

See the [Installation Guide](../getting-started/installation.md) for all installation scenarios.

### 4. Create Admin User

```bash
./bedrud-cli -create -email="admin@example.com" -password="securepassword" -name="Admin"
./bedrud-cli -make-admin -email="admin@example.com"
```

---

## Docker Deployment

### Build the Image

```bash
docker build -t bedrud .
```

The multi-stage Dockerfile:

1. **Stage 1** (Node 22 Alpine): Builds the React 19 + TanStack Start frontend with Bun
2. **Stage 2** (Go 1.24 Alpine): Builds the Go server with embedded frontend
3. **Stage 3** (Alpine 3.21): Minimal runtime (~8MB base)

### Run

```bash
docker run -d \
  --name bedrud \
  -p 8090:8090 \
  -p 7880:7880 \
  -v bedrud-data:/var/lib/bedrud \
  bedrud
```

### Ports

| Port | Service |
|------|---------|
| 8090 | API + web frontend |
| 7880 | LiveKit WebRTC |

### Pre-built Image

A Docker image is also published to GitHub Container Registry on every release:

```bash
docker pull ghcr.io/bedrud-ir/bedrud:latest
```

---

## Production Architecture

```
Internet
    │
    ▼
┌──────────┐
│  Traefik │  TLS termination, reverse proxy
│  (443)   │
└────┬─────┘
     │
     ├──────────────────────────┐
     ▼                          ▼
┌──────────┐            ┌──────────────┐
│  Bedrud  │            │   LiveKit    │
│  (8090)  │            │   (7880)     │
│  API +   │            │   WebRTC     │
│  Web UI  │            │   media      │
└──────────┘            └──────────────┘
     │
     ▼
┌──────────┐
│  SQLite  │  (or PostgreSQL)
└──────────┘
```

### Systemd Services

The installer creates two systemd services:

| Service | Command | Purpose |
|---------|---------|---------|
| `bedrud.service` | `bedrud --run --config /etc/bedrud/config.yaml` | API + web |
| `livekit.service` | `bedrud --livekit --config /etc/bedrud/livekit.yaml` | Media server |

### Managing Services

```bash
# Check status
systemctl status bedrud livekit

# Restart
systemctl restart bedrud

# View logs
journalctl -u bedrud -f
tail -f /var/log/bedrud/bedrud.log
```

---

## File Locations (Production)

| Path | Content |
|------|---------|
| `/usr/local/bin/bedrud` | Binary |
| `/etc/bedrud/config.yaml` | Server configuration |
| `/etc/bedrud/livekit.yaml` | LiveKit configuration |
| `/var/lib/bedrud/bedrud.db` | SQLite database |
| `/var/log/bedrud/bedrud.log` | Application logs |

---

## CI/CD

### Release Pipeline

The `release.yml` workflow triggers on version tags (`v*`) and produces:

| Artifact | Description |
|---|---|
| `bedrud_linux_amd64.tar.xz` / `bedrud_linux_arm64.tar.xz` | Server binaries (Linux x86_64 / ARM64) |
| `bedrud_amd64.deb` / `bedrud_arm64.deb` | Debian/Ubuntu packages (server) |
| Docker image (`ghcr.io/bedrud-ir/bedrud`) | Multi-arch container image pushed to GHCR |
| `bedrud-desktop-linux-x86_64.AppImage` | Desktop — universal Linux AppImage |
| `bedrud-desktop-linux-x86_64.deb` | Desktop — Debian/Ubuntu package |
| `bedrud-desktop-linux-x86_64.tar.xz` | Desktop — Linux portable tarball |
| `bedrud-desktop-windows-x86_64-setup.exe` / `-arm64-setup.exe` | Desktop — Windows NSIS installer |
| `bedrud-desktop-windows-x86_64.zip` / `-arm64.zip` | Desktop — Windows portable |
| `bedrud-desktop-macos-x86_64.tar.gz` / `-arm64.tar.gz` | Desktop — macOS portable (unsigned) |
| Android APK (debug + release, per-arch) | Android client builds |
| iOS IPA (optional, requires signing) | iOS client archive |

All artifacts are attached to the GitHub release.

### Nightly Builds

The `dev-nightly.yml` workflow produces development builds on a schedule.

### CI Checks

Every push to `main` and every pull request runs:

| Check | Platform |
|-------|----------|
| `go vet` + build + tests | ubuntu-latest (Go 1.24) |
| Type check + build | ubuntu-latest (Bun) |
| Lint + unit tests | ubuntu-latest (JDK 17) |
| Build + test | macos-15 (Xcode) |
