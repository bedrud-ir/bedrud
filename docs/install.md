# Bedrud Installation Guide

This document covers all possible installation scenarios for the Bedrud Meeting Platform using the single-binary `bedrud` tool.

## Prerequisites
- A Debian-based Linux server (Debian 12+ recommended).
- Root or sudo access.
- Port 80 and 443 must be available for Let's Encrypt and HTTPS.
- For Let's Encrypt, a domain name pointing to your server's IP.

---

## 🚀 Scenario 1: Fully Automated Install (Recommended)
Use the Python CLI to automatically build, upload, and configure your server with a single command from your local machine.

```bash
uv run python bedrud.py --auto-config \
  --ip <your-server-ip> \
  --user root \
  --auth-key ~/.ssh/id_rsa \
  --domain meet.example.com \
  --acme-email admin@example.com
```

**What it does:**
1. Builds the backend binary (`dist/bedrud`).
2. Compresses it into `bedrud.tar.xz`.
3. Uploads it to the server with a progress indicator.
4. Clears conflicting services (Nginx, Apache, Caddy).
5. Configures Firewall (UFW).
6. Runs the internal `install` logic on the server.

---

## 🛠 Scenario 2: Standard Interactive Install
If you have the `bedrud` binary on the server and want to configure it step-by-step.

```bash
sudo ./bedrud install
```

**Scenarios handled during prompts:**
- **Custom IP**: Detects your IP and asks for confirmation.
- **Let's Encrypt**: if you provide a **Domain** and **Email**, it automatically enables valid SSL.
- **Self-Signed TLS**: if you don't use a domain, it asks if you want to generate a self-signed certificate for IP-based HTTPS.

---

## ⚡ Scenario 3: Non-Interactive Flag-Based Install
Ideal for scripts and custom automation.

### A. Let's Encrypt (Secure)
```bash
sudo ./bedrud install --tls --domain meet.example.com --email webmaster@example.com
```

### B. Self-Signed TLS (IP-based Secure)
```bash
sudo ./bedrud install --tls --ip 1.2.3.4
```

### C. Pure HTTP (Internal/Dev)
```bash
sudo ./bedrud install --ip 1.2.3.4
```

### D. Self-Signed Cert for a Domain
Useful for testing HTTPS before pointing DNS.
```bash
sudo ./bedrud install --tls --domain meet.example.com
```

### E. Custom Port (Instead of 443)
```bash
sudo ./bedrud install --tls --port 8443 --domain meet.example.com
```

### F. Predefined Certificates (External Certs)
If you already have certificates (e.g., from a separate Nginx or Cloudflare setup).
```bash
sudo ./bedrud install --tls --cert /path/to/fullchain.pem --key /path/to/privkey.pem
```

### G. Custom LiveKit Ports
If defaults (7880-7882) are in use by other software.
```bash
sudo ./bedrud install --lk-port 9000 --lk-tcp-port 9001 --lk-udp-port 9002
```

---

## 🗑 Scenario 4: Uninstallation
To completely remove Bedrud and all associated services and data from your system.

```bash
sudo ./bedrud uninstall
```

**What it does:**
1. Stops and disables `bedrud` and `livekit` services.
2. Removes systemd service files.
3. Deletes the binary from `/usr/local/bin/bedrud`.
4. Deletes all configuration in `/etc/bedrud`.
5. Deletes all application data and databases in `/var/lib/bedrud`.
6. Deletes logs in `/var/log/bedrud`.

---

## 📦 What the Install Command Does (Under the Hood)
When you run `bedrud install`, the following happens:
1. **Directories**: Creates `/etc/bedrud`, `/var/lib/bedrud`, and `/var/log/bedrud`.
2. **Binary**: Copies the binary to `/usr/local/bin/bedrud`.
3. **Config**: Generates `/etc/bedrud/config.yaml` with your server settings.
4. **LiveKit**: Generates `/etc/bedrud/livekit.yaml` for the embedded video server.
5. **Systemd**: Sets up two services:
   - `livekit.service`: The embedded video streaming engine.
   - `bedrud.service`: The main API and web interface.
6. **Persistence**: Initializes SQLite database and certificate cache.

### Service Entrypoints
The services use the following internal flags:
- `bedrud --run --config <path>`: Starts the API and Web server.
- `bedrud --livekit --config <path>`: Starts the embedded LiveKit server.

---

## 👥 Post-Installation: User Management
Once installed, use the CLI to create your first admin user.

```bash
# Create a new user
./bedrud-cli -create -email="admin@example.com" -password="securepassword" -name="Admin User"

# Grant Super-Admin privileges
./bedrud-cli -make-admin -email="admin@example.com"
```

*Note: `bedrud-cli` is a separate utility focused on backend management tasks.*

---

## 🔍 Troubleshooting Installation
- **Check Services**: `systemctl status bedrud livekit`
- **View Logs**: `tail -f /var/log/bedrud/bedrud.log`
- **Port Conflict**: Ensure no other service is using port 80 or 443 before installing.
