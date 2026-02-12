# Configuration

Bedrud uses YAML configuration files for both the main server and the embedded LiveKit media server.

## Server Configuration

**Location:** `server/config.yaml` (development) or `/etc/bedrud/config.yaml` (production)

### Full Reference

```yaml
server:
  port: 8090                    # HTTP port
  host: "localhost"             # Bind address

database:
  path: "data.db"              # SQLite database file path

logger:
  level: "debug"               # Log level: debug, info, warn, error

livekit:
  url: "http://localhost:7880"  # LiveKit server URL
  api_key: "devkey"             # LiveKit API key
  api_secret: "devsecret"       # LiveKit API secret

auth:
  jwt_secret: "your-jwt-secret"         # Secret for signing JWT tokens
  jwt_expiration: 24                     # Token expiration in hours
  session_secret: "your-session-secret"  # Secret for session cookies
  frontend_url: "http://localhost:5173"  # Frontend URL (for OAuth redirects)

  # OAuth providers (optional)
  google:
    client_id: ""
    client_secret: ""
  github:
    client_id: ""
    client_secret: ""
  twitter:
    client_key: ""
    client_secret: ""

cors:
  allowed_origins:
    - "http://localhost:5173"   # Frontend dev server
  allow_credentials: true
```

### Key Settings

#### Database

By default, Bedrud uses **SQLite** with a file at the configured `path`. For production with higher concurrency, switch to PostgreSQL by providing a connection string instead.

#### Authentication

The `jwt_secret` is used to sign access and refresh tokens. Change this from the default in production.

**OAuth providers** are optional. If you don't configure them, social login buttons won't appear in the UI. Each provider requires registering an OAuth app with the respective service and providing the client ID and secret.

#### CORS

The `allowed_origins` list must include the URL where your frontend is served. In development this is `http://localhost:5173`. In production, set it to your domain (e.g., `https://meet.example.com`).

---

## LiveKit Configuration

**Location:** `server/livekit.yaml` (development) or `/etc/bedrud/livekit.yaml` (production)

```yaml
port: 7880                      # LiveKit HTTP/WebSocket port

rtc:
  port_range_start: 50000       # UDP port range start
  port_range_end: 60000         # UDP port range end
  use_external_ip: true         # Use external IP for RTC

turn:
  enabled: true
  domain: "localhost"
  tls_port: 5349
  udp_port: 3478

keys:
  devkey: "devsecret"           # Must match server config

logging:
  level: info
```

!!! warning
    The `keys` in `livekit.yaml` must match the `livekit.api_key` and `livekit.api_secret` in the server's `config.yaml`.

### RTC Port Range

LiveKit uses UDP ports for media streams. The default range `50000-60000` works for most setups. If running behind a firewall, ensure these ports are open.

### TURN Server

The embedded TURN server helps clients behind restrictive NATs connect to meetings. It's enabled by default on ports 3478 (UDP) and 5349 (TLS).

---

## Environment Variables

Configuration values can be overridden with environment variables. The naming convention follows the YAML structure with underscores:

```bash
export SERVER_PORT=8090
export DATABASE_PATH=/var/lib/bedrud/bedrud.db
export AUTH_JWT_SECRET=production-secret
export LIVEKIT_URL=http://localhost:7880
export LIVEKIT_API_KEY=prodkey
export LIVEKIT_API_SECRET=prodsecret
```

---

## Production Checklist

- [ ] Change `jwt_secret` and `session_secret` to strong random values
- [ ] Set `logger.level` to `info` or `warn`
- [ ] Configure TLS (via installer or reverse proxy)
- [ ] Set `cors.allowed_origins` to your production domain
- [ ] Configure OAuth providers if needed
- [ ] Open LiveKit RTC port range in your firewall
- [ ] Set up log rotation for `/var/log/bedrud/`
