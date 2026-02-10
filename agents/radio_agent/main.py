import asyncio
import argparse
import sys
import os
from urllib.parse import urlparse
import httpx
from livekit import rtc

# Settings
SAMPLE_RATE = 48000
CHANNELS = 2

async def main():
    parser = argparse.ArgumentParser(description="Bedrud Radio Agent")
    parser.add_argument("url", help="Meeting URL (e.g. https://x.xx/m/xx)")
    parser.add_argument("radio_url", help="URL of the radio stream")
    parser.add_argument("--name", default="Radio Bot", help="Bot display name")
    
    args = parser.parse_args()
    
    # 1. Parse Meeting URL
    parsed_url = urlparse(args.url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    room_name = parsed_url.path.split('/')[-1]
    
    print(f"[*] Base URL: {base_url}")
    print(f"[*] Room Name: {room_name}")
    print(f"[*] Bot Name: {args.name}")
    print(f"[*] Radio URL: {args.radio_url}")
    
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

        # Setup Audio Source
        audio_source = rtc.AudioSource(SAMPLE_RATE, CHANNELS)
        audio_track = rtc.LocalAudioTrack.create_audio_track("radio-track", audio_source)
        
        # Publish Track
        options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
        await room.local_participant.publish_track(audio_track, options)
        
        print("[+] Radio track published. Starting FFmpeg...")

        # 5. Start FFmpeg to decode audio stream
        ffmpeg_cmd = [
            "ffmpeg",
            "-i", args.radio_url,
            "-f", "s16le",
            "-ar", str(SAMPLE_RATE),
            "-ac", str(CHANNELS),
            "-"
        ]

        proc = await asyncio.create_subprocess_exec(
            *ffmpeg_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL
        )

        # 20ms audio frames
        frame_duration_ms = 20
        samples_per_frame = int(SAMPLE_RATE * frame_duration_ms / 1000)
        bytes_per_sample = 2
        audio_frame_size = samples_per_frame * CHANNELS * bytes_per_sample
        
        print("[*] Streaming radio...")
        while True:
            try:
                data = await proc.stdout.readexactly(audio_frame_size)
                if not data:
                    break
                
                audio_frame = rtc.AudioFrame(data, SAMPLE_RATE, CHANNELS, samples_per_frame)
                await audio_source.capture_frame(audio_frame)
                
                # Tiny sleep to allow event loop to breathe
                await asyncio.sleep(0)
            except asyncio.IncompleteReadError:
                break
            except Exception as e:
                print(f"[-] Stream error: {e}")
                break

        print("[+] Radio stream ended.")
    except Exception as e:
        print(f"[-] Error: {e}")
    finally:
        await room.disconnect()
        print("[*] Disconnected.")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())
