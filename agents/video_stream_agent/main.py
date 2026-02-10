import asyncio
import argparse
import sys
import os
import subprocess
from urllib.parse import urlparse
import httpx
from livekit import rtc

# Settings for the stream
WIDTH = 1280
HEIGHT = 720
FPS = 30
SAMPLE_RATE = 48000
CHANNELS = 2

async def main():
    parser = argparse.ArgumentParser(description="Bedrud Video Stream Agent")
    parser.add_argument("url", help="Meeting URL (e.g. https://x.x/m/xx)")
    parser.add_argument("stream_url", help="URL of the video stream (HLS/m3u8/mp4/etc.)")
    parser.add_argument("--name", default="Video Bot", help="Bot display name")
    
    args = parser.parse_args()
    
    # 1. Parse Meeting URL
    parsed_url = urlparse(args.url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    room_name = parsed_url.path.split('/')[-1]
    
    print(f"[*] Base URL: {base_url}")
    print(f"[*] Room Name: {room_name}")
    print(f"[*] Bot Name: {args.name}")
    print(f"[*] Stream URL: {args.stream_url}")
    
    async with httpx.AsyncClient() as client:
        # 2. Guest Login
        print(f"[*] Logging in as guest...")
        try:
            resp = await client.post(f"{base_url}/api/auth/guest-login", json={"name": args.name})
            resp.raise_for_status()
            auth_data = resp.json()
            api_token = auth_data["tokens"]["accessToken"]
            print("[+] Guest login successful")
        except Exception as e:
            print(f"[-] Guest login failed: {e}")
            return

        # 3. Join Room to get LiveKit Token
        print(f"[*] Joining room {room_name}...")
        try:
            headers = {"Authorization": f"Bearer {api_token}"}
            resp = await client.post(f"{base_url}/api/room/join", 
                                    json={"roomName": room_name}, 
                                    headers=headers)
            resp.raise_for_status()
            room_data = resp.json()
            lk_token = room_data["token"]
            lk_host = room_data.get("livekitHost")
            
            if not lk_host:
                print("[-] LiveKit host not provided by API")
                return
            
            # Handle protocol conversion
            if lk_host.startswith("http://"):
                lk_host = lk_host.replace("http://", "ws://", 1)
            elif lk_host.startswith("https://"):
                lk_host = lk_host.replace("https://", "wss://", 1)
            elif not lk_host.startswith(("ws://", "wss://")):
                if parsed_url.scheme == "https":
                    lk_host = f"wss://{lk_host}"
                else:
                    lk_host = f"ws://{lk_host}"
            
            print(f"[+] Joined room. LiveKit Host: {lk_host}")
        except Exception as e:
            print(f"[-] Join room failed: {e}")
            return

    # 4. Connect to LiveKit
    print(f"[*] Connecting to LiveKit...")
    room = rtc.Room()
    
    try:
        await room.connect(lk_host, lk_token)
        print(f"[+] Connected to room: {room.name}")

        # Setup Video Source (Screen Share)
        video_source = rtc.VideoSource(WIDTH, HEIGHT)
        video_track = rtc.LocalVideoTrack.create_video_track("video-track", video_source)
        
        # Setup Audio Source
        audio_source = rtc.AudioSource(SAMPLE_RATE, CHANNELS)
        audio_track = rtc.LocalAudioTrack.create_audio_track("audio-track", audio_source)
        
        # Publish Tracks
        # Video as Screen Share (Enum name is SOURCE_SCREENSHARE in Python SDK)
        video_options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_SCREENSHARE)
        await room.local_participant.publish_track(video_track, video_options)
        
        # Audio as Microphone (to be heard by everyone)
        audio_options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
        await room.local_participant.publish_track(audio_track, audio_options)
        
        print("[+] Tracks published. Starting FFmpeg...")

        # 5. Start FFmpeg to decode stream
        ffmpeg_v_cmd = [
            "ffmpeg",
            "-i", args.stream_url,
            "-f", "rawvideo",
            "-pix_fmt", "yuv420p",
            "-s", f"{WIDTH}x{HEIGHT}",
            "-r", str(FPS),
            "-"
        ]
        
        ffmpeg_a_cmd = [
            "ffmpeg",
            "-i", args.stream_url,
            "-f", "s16le",
            "-ar", str(SAMPLE_RATE),
            "-ac", str(CHANNELS),
            "-"
        ]

        proc_v = await asyncio.create_subprocess_exec(
            *ffmpeg_v_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL
        )
        
        proc_a = await asyncio.create_subprocess_exec(
            *ffmpeg_a_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL
        )

        async def stream_video():
            y_size = WIDTH * HEIGHT
            uv_size = (WIDTH // 2) * (HEIGHT // 2)
            frame_size = y_size + 2 * uv_size
            
            try:
                while True:
                    data = await proc_v.stdout.readexactly(frame_size)
                    if not data:
                        break
                    
                    frame = rtc.VideoFrame(WIDTH, HEIGHT, rtc.VideoBufferType.I420, data)
                    video_source.capture_frame(frame)
                    await asyncio.sleep(0)
            except Exception as e:
                print(f"[*] Video stream loop ended: {e}")
            finally:
                if proc_v.returncode is None:
                    proc_v.terminate()

        async def stream_audio():
            # 20ms audio frames
            frame_duration_ms = 20
            samples_per_frame = int(SAMPLE_RATE * frame_duration_ms / 1000)
            bytes_per_sample = 2
            audio_frame_size = samples_per_frame * CHANNELS * bytes_per_sample
            
            try:
                while True:
                    data = await proc_a.stdout.readexactly(audio_frame_size)
                    if not data:
                        break
                    
                    audio_frame = rtc.AudioFrame(data, SAMPLE_RATE, CHANNELS, samples_per_frame)
                    await audio_source.capture_frame(audio_frame)
                    await asyncio.sleep(0)
            except Exception as e:
                print(f"[*] Audio stream loop ended: {e}")
            finally:
                if proc_a.returncode is None:
                    proc_a.terminate()

        # Run both tasks
        await asyncio.gather(stream_video(), stream_audio())

    except Exception as e:
        print(f"[-] Error: {e}")
    finally:
        await room.disconnect()
        print("[*] Disconnected.")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())
