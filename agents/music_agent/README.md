# Bedrud Music Agent

A Simple Music Agent for LiveKit meetings in Bedrud.

## Requirements

- Python 3.12+
- `uv` package manager
- `ffmpeg` (installed on your system, required by `pydub` for MP3/AAC/etc.)

## How to use

1. Go to the agent directory:
   ```bash
   cd agents/music_agent
   ```

2. Run the agent using `uv`:
   ```bash
   uv run main.py <MEETING_URL> <AUDIO_FILE_PATH>
   ```

Example:
```bash
uv run main.py https://x.x/m/xx space_oddity.mp3
```

The agent will:
1. Parse the meeting URL.
2. Login as a guest to get an API token.
3. Join the room via the Bedrud API to get a LiveKit connection token.
4. Connect to the LiveKit server and stream the audio file.
