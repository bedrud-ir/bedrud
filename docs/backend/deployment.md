# Internal Installer and Deployment

One of the most powerful features of Bedrud is the built-in installer. It allows you to transform a fresh Linux server into a fully functional meeting platform with one command.

## The `install` Command

When you run `bedrud install`, the following steps happen:

1.  **Environment Check:** The installer verifies that you are running on **Linux** (Debian/Ubuntu are preferred).
2.  **Configuration:** It asks you for your IP address, domain name, and email for Let's Encrypt certificates.
3.  **File System Setup:**
    - Creates `/etc/bedrud/` for configuration files.
    - Creates `/var/lib/bedrud/` for the database and certificates.
    - Creates `/var/log/bedrud/` for server logs.
4.  **Binary Installation:** Copies the current binary to `/usr/local/bin/bedrud`.
5.  **Service Orchestration:** It creates and starts two **systemd** services.

## Systemd Services

Bedrud splits its functions into two services to ensure the media server is always ready.

### 1. `livekit.service`

- **Command:** `bedrud --livekit --config /etc/bedrud/livekit.yaml`
- **Purpose:** Starts the embedded LiveKit WebRTC server module.
- **Config:** Uses a specialized YAML file for media-specific settings like ports and IP bindings.

### 2. `bedrud.service`

- **Command:** `bedrud --run --config /etc/bedrud/config.yaml`
- **Purpose:** Starts the API server and serves the web frontend.
- **Dependencies:** This service waits for `livekit.service` to be ready.

## Security and TLS

The installer handles security automatically:

- **ACME (Let's Encrypt):** If you provide a domain and email, it sets up automatic certificate renewal.
- **Self-Signed Certs:** If no domain is provided, it generates a self-signed certificate so that the site still works over HTTPS.
- **Reverse Proxy:** The backend acts as a reverse proxy. It receives traffic on port 443 and sends `/livekit` requests to the internal media server.

## Uninstallation

If you need to remove Bedrud, you can run:
```bash
sudo bedrud uninstall
```
This stops the services, deletes the systemd files, and removes the configuration and data folders.
