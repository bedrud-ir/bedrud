# Bedrud Video Stream Agent

This agent streams a video URL (HLS/m3u8/mp4) to a Bedrud meeting as a screen share.

## Requirements

- Python 3.12+
- `uv` package manager
- `ffmpeg` installed on the system

## How to use

1. Go to the agent directory:
   ```bash
   cd agents/video_stream_agent
   ```

2. Run the agent using `uv`:
   ```bash
   uv run main.py <MEETING_URL> <STREAM_URL>
   ```

Example:
```bash
uv run main.py https://b.a16.at/m/soshmak22 https://live.livetvstream.co.uk/LS-63503-4/index.m3u8
```

The agent will:
1. Login as a guest.
2. Join the meeting.
3. Start a screen share track and a microphone track.
4. Use FFmpeg to decode the stream and feed the video/audio frames to LiveKit.
