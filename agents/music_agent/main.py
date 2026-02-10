import asyncio
import argparse
import sys
import os
from urllib.parse import urlparse
import httpx
from livekit import rtc
from pydub import AudioSegment

async def main():
    parser = argparse.ArgumentParser(description="Bedrud Music Agent")
    parser.add_argument("url", help="Meeting URL (e.g. https://x.x/m/xx)")
    parser.add_argument("file", help="Path to audio file")
    parser.add_argument("--name", default="Music Bot", help="Bot display name")
    
    args = parser.parse_args()
    
    # 1. Parse URL
    parsed_url = urlparse(args.url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    room_name = parsed_url.path.split('/')[-1]
    
    print(f"[*] Base URL: {base_url}")
    print(f"[*] Room Name: {room_name}")
    print(f"[*] Bot Name: {args.name}")
    
    async with httpx.AsyncClient(verify=False) as client:
        # 2. Guest Login
        print(f"[*] Logging in as guest...")
        try:
            resp = await client.post(f"{base_url}/api/auth/guest-login", json={"name": args.name})
            resp.raise_for_status()
            auth_data = resp.json()
            # The API returns { "tokens": { "accessToken": "..." }, "user": { ... } }
            api_token = auth_data["tokens"]["accessToken"]
            print("[+] Guest login successful")
        except Exception as e:
            print(f"[-] Guest login failed: {e}")
            if hasattr(e, 'response') and e.response:
                print(f"    Response: {e.response.text}")
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
            
            # Adjust lk_host for connection
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
            if hasattr(e, 'response') and e.response:
                print(f"    Response: {e.response.text}")
            return

    # 4. Connect to LiveKit and Play Music
    print(f"[*] Connecting to LiveKit...")
    room = rtc.Room()
    
    try:
        await room.connect(lk_host, lk_token)
        print(f"[+] Connected to room: {room.name}")

        # Audio settings
        sample_rate = 48000
        num_channels = 2
        bytes_per_sample = 2 # 16-bit PCM
        
        source = rtc.AudioSource(sample_rate, num_channels)
        track = rtc.LocalAudioTrack.create_audio_track("music-track", source)
        
        options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
        publication = await room.local_participant.publish_track(track, options)
        print("[+] Music track published!")

        # Load audio file
        print(f"[*] Loading audio file: {args.file}")
        try:
            audio = AudioSegment.from_file(args.file)
            audio = audio.set_frame_rate(sample_rate).set_channels(num_channels)
            pcm_data = audio.raw_data
        except Exception as e:
            print(f"[-] Failed to load audio file: {e}")
            print("    Make sure ffmpeg is installed if using MP3/AAC.")
            await room.disconnect()
            return

        print(f"[*] Playing music (Duration: {len(pcm_data) / (sample_rate * num_channels * bytes_per_sample):.1f}s)...")
        
        # 20ms frames
        frame_duration_ms = 20
        samples_per_frame = int(sample_rate * frame_duration_ms / 1000)
        frame_size = samples_per_frame * num_channels * bytes_per_sample

        total_frames = len(pcm_data) // frame_size
        for i in range(0, len(pcm_data), frame_size):
            current_frame = i // frame_size
            if current_frame % 100 == 0: # Print every 2 seconds
                progress = (current_frame / total_frames) * 100
                print(f"\r[*] Progress: {progress:.1f}% ({current_frame*20/1000:.1f}s)", end="", flush=True)

            chunk = pcm_data[i:i + frame_size]
            if len(chunk) < frame_size:
                break
            
            audio_frame = rtc.AudioFrame(chunk, sample_rate, num_channels, samples_per_frame)
            await source.capture_frame(audio_frame)
            
            await asyncio.sleep(frame_duration_ms / 1000)

        print("\n[+] Finished playing. Leaving room...")
    except Exception as e:
        print(f"\n[-] LiveKit error: {e}")
    finally:
        await room.disconnect()
        print("[*] Disconnected.")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())
