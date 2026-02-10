# Bedrud Appliance Mode (All-in-One Binary)

Bedrud is designed to be a self-contained "appliance" for video meetings. It packages everything—frontend, backend, and the LiveKit media server—into a single executable binary.

## Key Features
- **Zero External Dependencies:** No need to install Node.js, Redis, or a separate media server on your host.
- **Embedded Media Server:** The LiveKit server binary is embedded within the Bedrud binary and managed automatically.
- **Embedded Frontend:** The Svelte 5 frontend is compiled and embedded into the Go binary.
- **SQLite Storage:** Uses SQLite for persistent data, avoiding the need for a database server.

## Usage

### Running Locally
You can run Bedrud or LiveKit directly from the binary using flags:

#### Run Bedrud Server:
```bash
./bedrud --run --config config.yaml
```

#### Run LiveKit Media Server:
```bash
./bedrud --livekit --config livekit.yaml
```

### Installation on Debian/Ubuntu
Bedrud includes a built-in installer that sets up two systemd services for maximum reliability.

```bash
# Install with auto-generated self-signed TLS certificates
sudo ./bedrud install --tls

# Install with a specific IP override
sudo ./bedrud install --tls --ip 1.2.3.4
```

The installer will:
1. Copy the `bedrud` binary to `/usr/local/bin/bedrud`.
2. Create configuration files in `/etc/bedrud/`.
3. Set up two systemd services:
   - `livekit.service`: Runs the media server.
   - `bedrud.service`: Runs the meeting platform.
4. Enable and start both services.

## Configuration Structure
- **/etc/bedrud/config.yaml:** Main Bedrud configuration (ports, database, auth).
- **/etc/bedrud/livekit.yaml:** Media server configuration (keys, ports, RTC settings).
- **/var/lib/bedrud/bedrud.db:** SQLite database file.
- **/var/log/bedrud/bedrud.log:** Application logs.
