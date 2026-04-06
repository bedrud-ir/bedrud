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
    parser.add_argument("--token", default=None, help="Bearer token for authenticated join (required for private rooms)")

    args = parser.parse_args()

    # 1. Parse URL
    parsed_url = urlparse(args.url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    room_name = parsed_url.path.split('/')[-1]

    print(f"[*] Base URL: {base_url}")
    print(f"[*] Room Name: {room_name}")
    print(f"[*] Bot Name: {args.name}")

    async with httpx.AsyncClient(verify=False) as client:
        # 2. Join room — authenticated if --token given, guest otherwise
        try:
            if args.token:
                print(f"[*] Joining room {room_name} (authenticated)...")
                resp = await client.post(
                    f"{base_url}/api/room/join",
                    json={"roomName": room_name},
                    headers={"Authorization": f"Bearer {args.token}"},
                )
            else:
                print(f"[*] Joining room {room_name} as guest (room must be public)...")
                resp = await client.post(
                    f"{base_url}/api/room/guest-join",
                    json={"roomName": room_name, "guestName": args.name},
                )

            if not resp.is_success:
                print(f"[-] Join failed: HTTP {resp.status_code}")
                print(f"    Response: {resp.text}")
                return
            room_data = resp.json()
            lk_token = room_data["token"]
            lk_host = room_data.get("livekitHost", "")
            print(f"[+] Joined room. LiveKit Host: {lk_host}")
        except Exception as e:
            print(f"[-] Join failed: {e}")
            return

    if not lk_host:
        print("[-] LiveKit host not provided by API")
        return

    # Normalise host to ws:// / wss://
    if lk_host.startswith("http://"):
        lk_host = "ws://" + lk_host[len("http://"):]
    elif lk_host.startswith("https://"):
        lk_host = "wss://" + lk_host[len("https://"):]
    elif not lk_host.startswith(("ws://", "wss://")):
        lk_host = ("wss://" if parsed_url.scheme == "https" else "ws://") + lk_host

    # 3. Connect to LiveKit and stream the audio file
    print(f"[*] Connecting to LiveKit at {lk_host} ...")
    room = rtc.Room()

    try:
        await room.connect(lk_host, lk_token)
        print(f"[+] Connected to room: {room.name}")

        sample_rate   = 48000
        num_channels  = 2
        bytes_per_sample = 2  # 16-bit PCM

        source = rtc.AudioSource(sample_rate, num_channels)
        track  = rtc.LocalAudioTrack.create_audio_track("music-track", source)
        options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
        await room.local_participant.publish_track(track, options)
        print("[+] Music track published!")

        # Load and transcode audio file
        print(f"[*] Loading audio: {args.file}")
        try:
            audio = AudioSegment.from_file(args.file)
            audio = audio.set_frame_rate(sample_rate).set_channels(num_channels)
            pcm_data = audio.raw_data
        except Exception as e:
            print(f"[-] Failed to load audio: {e}")
            print("    Make sure ffmpeg is installed for MP3/AAC/FLAC support.")
            await room.disconnect()
            return

        duration = len(pcm_data) / (sample_rate * num_channels * bytes_per_sample)
        print(f"[*] Playing ({duration:.1f}s)...")

        # Stream in 20 ms frames
        frame_duration_ms  = 20
        samples_per_frame  = int(sample_rate * frame_duration_ms / 1000)
        frame_size         = samples_per_frame * num_channels * bytes_per_sample
        total_frames       = len(pcm_data) // frame_size

        for i in range(0, len(pcm_data), frame_size):
            frame_index = i // frame_size
            if frame_index % 100 == 0:
                pct = frame_index / total_frames * 100 if total_frames else 0
                print(f"\r[*] Progress: {pct:.1f}% ({frame_index * 20 / 1000:.1f}s)", end="", flush=True)

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
