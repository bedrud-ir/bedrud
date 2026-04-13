# WebRTC Connectivity

How clients establish real-time media connections in Bedrud. Covers the full connectivity stack: signaling, ICE, STUN, TURN, and the SFU media path.

---

## Overview

WebRTC requires a series of steps before audio and video flow between client and server. Bedrud uses LiveKit's SFU (Selective Forwarding Unit) architecture — clients connect to the server, not to each other. **This means only the client-to-server network path matters**, not the connection between individual participants.

```mermaid
%%{init: {'themeVariables': {
  'primaryColor': '#4F46E1',
  'primaryTextColor': '#FFFFFF',
  'primaryBorderColor': '#3B37B3',
  'lineColor': '#6B7280',
  'secondaryColor': '#F3F4F6',
  'tertiaryColor': '#E5E7EB',
  'background': '#FFFFFF',
  'mainBkg': '#EEF2FF',
  'nodeBorder': '#3B37B3'
}}}%%
sequenceDiagram
    participant C as Client
    participant S as Bedrud Server
    participant LK as LiveKit SFU

    C->>S: POST /api/room/join
    S->>S: Validate permissions
    S->>C: LiveKit JWT token

    C->>LK: WebSocket connect (with token)
    LK->>C: Join response + SDP offer

    Note over C,LK: ICE Candidate Gathering
    C->>LK: Host candidates (local IPs)
    C->>LK: STUN candidates (public IPs)
    C->>LK: TURN candidates (relay addresses)

    alt Direct path available
        Note over C,LK: ICE/UDP — direct media
        C-->>LK: Media via UDP 50000-60000
    else UDP blocked, TURN available
        Note over C,LK: TURN — relayed media
        C-->>LK: Media via TURN relay (3478/5349)
    else Corporate firewall
        Note over C,LK: TURN/TLS — relayed via 443
        C-->>LK: Media via TLS tunnel
    end

    Note over C,LK: Audio/video tracks flow through SFU
```

---

## Connectivity Stack

Five layers work together to establish the media path:

```mermaid
%%{init: {'themeVariables': {
  'primaryColor': '#4F46E1',
  'primaryTextColor': '#FFFFFF',
  'primaryBorderColor': '#3B37B3',
  'lineColor': '#6B7280',
  'secondaryColor': '#F3F4F6',
  'tertiaryColor': '#E5E7EB',
  'background': '#FFFFFF',
  'mainBkg': '#EEF2FF',
  'nodeBorder': '#3B37B3'
}}}%%
flowchart TB
    subgraph Layers["Connectivity Stack"]
        direction TB
        SIG["1. Signaling<br/>WebSocket — exchange SDP offers/answers"]
        ICE["2. ICE<br/>Orchestrate all candidate paths"]
        STUN["3. STUN<br/>Discover public IP/port"]
        TURN["4. TURN<br/>Relay when direct fails"]
        SFU["5. SFU<br/>Route media between participants"]
    end

    SIG --> ICE
    ICE --> STUN
    ICE --> TURN
    STUN --> SFU
    TURN --> SFU

    style SIG fill:#4F46E1,stroke:#3B37B3,color:#FFFFFF
    style ICE fill:#4F46E1,stroke:#3B37B3,color:#FFFFFF
    style STUN fill:#F3F4F6,stroke:#6B7280,color:#1F2937
    style TURN fill:#F59E0B,stroke:#D97706,color:#1F2937
    style SFU fill:#4F46E1,stroke:#3B37B3,color:#FFFFFF
    style Layers fill:#FFFFFF,stroke:#E5E7EB
```

### Layer Details

**1. Signaling** — Client and server exchange connection metadata using SDP (Session Description Protocol) offers and answers via WebSocket. This is not media — it is the setup phase. Bedrud proxies signaling through the API server to the embedded LiveKit instance.

**2. ICE (Interactive Connectivity Establishment)** — Gathers all possible connection paths, called candidates, and tests them in order of priority. ICE is a framework — it coordinates the connection attempts but is not a protocol itself.

**3. STUN (Session Traversal Utilities for NAT)** — Lightweight protocol. Client sends a binding request to the STUN server, which responds with the client's public IP and port. This "server reflexive" candidate is then tested for direct connectivity. Works for ~80% of connections.

**4. TURN (Traversal Using Relays around NAT)** — When direct connectivity fails, TURN allocates a relay address on the server. All media packets are forwarded through this relay. Highest cost — server bandwidth scales with relayed users. See the [TURN Server Guide](turn-server.md) for deep coverage.

**5. SFU (Selective Forwarding Unit)** — Once the transport path is established, LiveKit's SFU routes media between participants. Each participant sends one stream up; the SFU forwards copies to other participants. This is not peer-to-peer — the server is always in the path.

---

## ICE Candidate Gathering

```mermaid
%%{init: {'themeVariables': {
  'primaryColor': '#4F46E1',
  'primaryTextColor': '#FFFFFF',
  'primaryBorderColor': '#3B37B3',
  'lineColor': '#6B7280',
  'secondaryColor': '#F3F4F6',
  'tertiaryColor': '#E5E7EB',
  'background': '#FFFFFF',
  'mainBkg': '#EEF2FF',
  'nodeBorder': '#3B37B3'
}}}%%
flowchart TD
    START[Start ICE Gathering] --> HOST
    HOST["Host candidates<br/>Local interface IPs<br/>e.g. 192.168.1.5:50001"] --> SRFLX
    SRFLX["STUN candidates (srflx)<br/>Public IP discovered via STUN<br/>e.g. 203.0.113.5:50001"] --> TEST
    TURN_C["TURN candidates (relay)<br/>Relay address on server<br/>e.g. 203.0.113.10:30001"] --> TEST

    TEST{Test candidate<br/>connectivity}
    TEST -->|"Host works"| CONNECTED[Connected via host]
    TEST -->|"srflx works"| CONNECTED2[Connected via STUN<br/>direct P2P]
    TEST -->|"Only relay works"| CONNECTED3[Connected via TURN relay]
    TEST -->|"None work"| FAIL[Connection failed]

    style HOST fill:#16A34A,stroke:#15803D,color:#FFFFFF
    style SRFLX fill:#F59E0B,stroke:#D97706,color:#1F2937
    style TURN_C fill:#DC2626,stroke:#B91C1C,color:#FFFFFF
    style CONNECTED fill:#4F46E1,stroke:#3B37B3,color:#FFFFFF
    style CONNECTED2 fill:#4F46E1,stroke:#3B37B3,color:#FFFFFF
    style CONNECTED3 fill:#4F46E1,stroke:#3B37B3,color:#FFFFFF
    style FAIL fill:#DC2626,stroke:#B91C1C,color:#FFFFFF
    style START fill:#F3F4F6,stroke:#6B7280
    style TEST fill:#FEF3C7,stroke:#D97706,color:#92400E
```

ICE gathers three candidate types simultaneously:

| Type | Source | Priority | How it works |
|------|--------|----------|-------------|
| **host** | Local network interfaces | Highest | Direct IP from machine. Works on LAN. |
| **srflx** (server reflexive) | STUN server response | Medium | Public IP discovered via STUN. Works for most NAT types. |
| **relay** | TURN server allocation | Lowest | Address on TURN server. Always works. Highest cost. |

ICE tests all candidates and selects the highest-priority pair that succeeds. If `srflx` works, it skips `relay`.

---

## NAT Types & Connectivity

Different NAT types affect whether direct connectivity works:

```mermaid
%%{init: {'themeVariables': {
  'primaryColor': '#4F46E1',
  'primaryTextColor': '#FFFFFF',
  'primaryBorderColor': '#3B37B3',
  'lineColor': '#6B7280',
  'secondaryColor': '#F3F4F6',
  'tertiaryColor': '#E5E7EB',
  'background': '#FFFFFF',
  'mainBkg': '#EEF2FF',
  'nodeBorder': '#3B37B3'
}}}%%
flowchart LR
    subgraph NAT1["Client A NAT"]
        direction TB
        F["Full Cone"]
        R["Restricted Cone"]
        PR["Port Restricted"]
        S["Symmetric"]
    end

    subgraph NAT2["Client B / Server NAT"]
        direction TB
        F2["Full Cone"]
        R2["Restricted Cone"]
        PR2["Port Restricted"]
        S2["Symmetric"]
    end

    F -->|"Direct"| F2
    R -->|"Direct"| R2
    PR -->|"Direct"| PR2
    S -->|"TURN required"| S2
    S -.->|"TURN required"| PR2
    PR -.->|"TURN required"| S2

    style F fill:#16A34A,stroke:#15803D,color:#FFFFFF
    style R fill:#16A34A,stroke:#15803D,color:#FFFFFF
    style PR fill:#F59E0B,stroke:#D97706,color:#1F2937
    style S fill:#DC2626,stroke:#B91C1C,color:#FFFFFF
    style F2 fill:#16A34A,stroke:#15803D,color:#FFFFFF
    style R2 fill:#16A34A,stroke:#15803D,color:#FFFFFF
    style PR2 fill:#F59E0B,stroke:#D97706,color:#1F2937
    style S2 fill:#DC2626,stroke:#B91C1C,color:#FFFFFF
    style NAT1 fill:#F3F4F6,stroke:#6B7280
    style NAT2 fill:#F3F4F6,stroke:#6B7280
```

| NAT Type | Description | Direct P2P | Needs TURN |
|----------|-------------|------------|-----------|
| **Full Cone** | All requests from same internal IP/port map to same public IP/port. Any external host can send to it. | Yes | No |
| **Restricted Cone** | Same mapping as Full Cone, but only external hosts that received a packet can send back. | Usually | No |
| **Port Restricted Cone** | Similar to Restricted Cone, but the NAT also restricts the external port number. Most common home router type. | Usually | Rarely |
| **Symmetric** | Different public IP/port mapping per destination. The STUN-discovered address cannot be reused. | No (when both symmetric) | **Yes** |

**Key insight:** Since the server has a public IP and predictable port range, most NAT types work directly. TURN is mainly needed when the client's firewall blocks outbound UDP entirely.

---

## Configuration Summary

Which Bedrud/LiveKit config keys affect WebRTC connectivity:

**`livekit.yaml` keys:**

```yaml
rtc:
  port_range_start: 50000       # UDP media port range start
  port_range_end: 60000         # UDP media port range end
  tcp_port: 7881                # ICE/TCP fallback port
  stun_servers:                 # External STUN servers (optional)
    - stun:stun.l.google.com:19302
  use_external_ip: true         # Advertise public IP in ICE candidates

turn:
  enabled: true                 # Enable embedded TURN
  domain: "turn.example.com"    # TURN domain (DNS must resolve)
  udp_port: 3478                # TURN/UDP + STUN port
  tls_port: 5349                # TURN/TLS port (or 443)
  cert_file: /path/to/turn.crt  # TLS cert for TURN/TLS
  key_file: /path/to/turn.key   # TLS key for TURN/TLS
  relay_range_start: 30000      # Relay port range start
  relay_range_end: 40000        # Relay port range end
  external_tls: false           # L4 LB terminates TLS
```

**`config.yaml` keys (Bedrud server):**

```yaml
server:
  port: 8090                    # API port (signaling proxied through this)
  enableTLS: true               # HTTPS for signaling
  domain: "meet.example.com"    # Public domain
```

### Debugging Connectivity Issues

| Symptom | Check |
|---------|-------|
| Can't connect at all | `rtc.use_external_ip: true`? Firewall open on 443 + UDP range? |
| Connects but no audio/video | UDP 50000-60000 blocked? Check ICE candidates in browser. |
| Slow connection | TURN relay active (check candidates). Expected if client behind strict NAT. |
| Fails behind corporate network | TURN/TLS not configured. Set `turn.tls_port: 443` with valid cert. |
| Works on LAN, fails remotely | Public IP not advertised. Set `rtc.use_external_ip: true`. |

For deep TURN troubleshooting, see the [TURN Server Guide](turn-server.md).

---

## Related

- [TURN Server Guide](turn-server.md) — TURN architecture, configuration, TLS, debugging
- [LiveKit Integration](../backend/livekit.md) — how Bedrud embeds LiveKit
- [Architecture Overview](overview.md) — full system architecture
- [Internal TLS](../guides/internal-tls.md) — TLS for isolated networks
