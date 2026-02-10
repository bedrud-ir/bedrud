# Bedrud Radio Agent

This agent streams a radio URL to a Bedrud meeting.

## Requirements

- Python 3.12+
- `uv` package manager
- `ffmpeg` installed on the system

## How to use

1. Go to the agent directory:
   ```bash
   cd agents/radio_agent
   ```

2. Run the agent using `uv`:
   ```bash
   uv run main.py <MEETING_URL> <RADIO_URL>
   ```

Example:
```bash
uv run main.py https://x.x/m/xx https://x.x/xx.mp3
```

The agent will:
1. Login as a guest.
2. Join the meeting.
3. Use FFmpeg to decode the radio stream and feed the audio frames to LiveKit.
