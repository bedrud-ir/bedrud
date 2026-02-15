# LiveKit Integration (Media Layer)

Bedrud uses **LiveKit** to handle the real-time video and audio communication.

## Embedded vs. External
Bedrud can work with LiveKit in two ways:

1.  **Embedded Mode (Default):** The backend starts its own LiveKit server internally. This is great for easy setup because you don't need to install anything else.
2.  **External Mode:** You can connect Bedrud to a separate LiveKit server (e.g., a cloud version or a cluster).

## How it Works

### 1. Room Creation
When a user creates a room in Bedrud, we don't necessarily create a room in LiveKit immediately. LiveKit rooms are created "on demand" when the first person joins.

### 2. Join Tokens
When a user wants to join a meeting:

1.  The frontend sends a request to `/api/room/join`.
2.  The backend verifies the user has permission to join that room.
3.  The backend uses its **API Key** and **Secret** to generate a "JWT Grant" (Join Token).
4.  The token contains:

    - The `Room Name`.
    - The user's `Identity` (Display Name).
    - Permissions (e.g., Can they speak? Can they share their screen?).
5.  The frontend receives this token and uses it to connect directly to the LiveKit media port (default `7880`).

### 3. Room Controls (Admin)
The backend uses the LiveKit Go SDK to perform administrative actions:

- **Kick:** Disconnects a participant.
- **Mute:** Force-mutes a participant's microphone.
- **Permissions:** Changes what a participant can do in real-time.

## Network Architecture

- **API Port (8090/443):** Handles regular HTTP and the signaling for starting the call.
- **Media Port (7880/7881/7882):** Handles the actual video/audio data using WebRTC protocols.

If you are behind a firewall, you must ensure that the UDP and TCP ports for LiveKit are open.
