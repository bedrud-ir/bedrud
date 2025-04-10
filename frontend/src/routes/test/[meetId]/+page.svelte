<script lang="ts">
    import { userStore } from "$lib/stores/user.store";
    import { onMount, onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import { joinRoomAPI } from "$lib/api";
    import { page } from "$app/state";
    import type { JoinRoomResponse } from "$lib/api";
    import {
        Participant,
        RoomEvent,
        Track,
        Room,
        RemoteTrack,
        RemoteTrackPublication,
        RemoteParticipant,
    } from "livekit-client";
    import MainMeetingLayout from "$lib/components/layout/MainMeetingLayout.svelte";

    async function connectToRoom(room: Room, token: string, livekitHost: string): Promise<void> {
        log("Connecting to room");

        try {
            // Pre-warm connection
            await room.prepareConnection(livekitHost, token);

            log("Prepared connection");
            // Connect with auto-subscribe enabled
            await room.connect(livekitHost, token, {
                autoSubscribe: true,
            });

            log("Connected to room");

            return new Promise((resolve) => {
                if (room.state === "connected") {
                    log("Already connected");
                    resolve();
                } else {
                    room.once("connected", () => {
                        log("Connected to room");
                        resolve();
                    });
                }
            });
        } catch (error) {
            log(`Failed to connect: ${error}`);
            throw error;
        }
    }

    let room: any;
    let participants = $state<any[]>([]);
    let localParticipant = $state<Participant | null>(null);
    let cameraEnabled = $state(true);
    let micEnabled = $state(true);
    let connectionError = $state<string | null>(null);
    let connecting = $state(false);
    let logs = $state<string[]>([]);
    let darkMode = $state(false);

    let localVideoContainer: HTMLDivElement;

    const log = (m: string) => logs.push(`[room] ${m}`);

    async function toggleMic() {
        if (!room?.localParticipant) return;
        
        try {
            if (micEnabled) {
                await room.localParticipant.setMicrophoneEnabled(false);
            } else {
                await room.localParticipant.setMicrophoneEnabled(true);
            }
            micEnabled = !micEnabled;
        } catch (error) {
            console.error('Failed to toggle microphone:', error);
        }
    }

    async function toggleCamera() {
        if (!room?.localParticipant) return;
        
        try {
            if (cameraEnabled) {
                await room.localParticipant.setCameraEnabled(false);
            } else {
                await room.localParticipant.setCameraEnabled(true);
            }
            cameraEnabled = !cameraEnabled;
        } catch (error) {
            console.error('Failed to toggle camera:', error);
        }
    }

    onMount(async () => {
        // Check User
        if (!$userStore) {
            localStorage.setItem("redirect", window.location.pathname);
            goto("/auth/login");
            return;
        }

        // check the params
        if (!page.params.meetId) {
            goto("/404");
            return;
        }

        // Try to join the meeting
        let joinRoomResp: JoinRoomResponse | any;
        connecting = true;

        joinRoomResp = (await joinRoomAPI({
            roomName: page.params.meetId,
        })) as JoinRoomResponse;

        if (!joinRoomResp || !joinRoomResp.token || !joinRoomResp.livekitHost) {
            connectionError = "Failed to get room token or LiveKit host";
            connecting = false;
            return;
        }

        // setup meet
        try {
            room = new Room({
                adaptiveStream: true,
                dynacast: true,
            });
            setupEventListeners();
        } catch (error) {
            console.error("Room setup error:", error);
            connectionError = "Failed to setup room";
            connecting = false;
            return;
        }

        // Connect using the meeting data that contains the LiveKit token
        try {
            await connectToRoom(room, joinRoomResp.token, joinRoomResp.livekitHost);
        } catch (roomError) {
            console.error("Room connection error:", roomError);
            connectionError =
                "Failed to connect to room server. Check network and firewall settings.";
        }

        // Update local participant reference
        localParticipant = room.localParticipant;
        connectionError = null;

        // Setup local media after connection
        setTimeout(async () => {
            if (room.state === "connected") {
                try {
                    // Enable camera and mic
                    await room.localParticipant.enableCameraAndMicrophone();

                    // Update participants list including remotes
                    updateParticipantsList();

                    if (!room?.localParticipant) return;

                    const videoTrack =
                        room.localParticipant.getTrackPublication(
                            Track.Source.Camera,
                        )?.track;

                    if (videoTrack && localVideoContainer) {
                        localVideoContainer.innerHTML = "";
                        const videoEl = videoTrack.attach();
                        if (videoEl instanceof HTMLVideoElement) {
                            videoEl.autoplay = true;
                            videoEl.playsInline = true;
                            videoEl.muted = true;
                            videoEl.style.width = "100%";
                            videoEl.style.height = "100%";
                            videoEl.style.objectFit = "cover";
                            localVideoContainer.appendChild(videoEl);
                        }
                    }
                } catch (mediaError) {
                    console.error("Media error:", mediaError);
                    connectionError = "Failed to access camera/microphone";
                }
            }
        }, 100);
        connecting = false;
    });

    onDestroy(() => {
        if (room) {
            room.disconnect();
            log("Disconnected from room");
        }
    });

    function setupEventListeners() {
        if (!room) return;

        room.on(RoomEvent.ParticipantConnected, () => {
            console.log("Participant connected");
            updateParticipantsList();
        });

        room.on(RoomEvent.ParticipantDisconnected, () => {
            console.log("Participant disconnected");
            updateParticipantsList();
        });

        room.on(
            RoomEvent.TrackSubscribed,
            (
                track: RemoteTrack,
                publication: RemoteTrackPublication,
                participant: RemoteParticipant,
            ) => {
                console.log(
                    "Track subscribed:",
                    track.kind,
                    "from",
                    participant.identity,
                );
                // Find the participant in our list to use its container reference
                const existingParticipant = participants.find(
                    (p) => p.identity === participant.identity,
                );
                if (existingParticipant && existingParticipant.container) {
                    // Directly use the container reference
                    const element = track.attach();
                    if (element instanceof HTMLVideoElement) {
                        element.autoplay = true;
                        element.playsInline = true;
                        element.muted = true;
                        element.style.width = "100%";
                        element.style.height = "100%";
                        element.style.objectFit = "cover";
                    }

                    existingParticipant.container.innerHTML = "";
                    existingParticipant.container.appendChild(element);
                }
            },
        );

        room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
            track.detach();
        });
    }

    function updateParticipantsList() {
        if (!room || room.state !== "connected") return;

        const remoteParticipants = Array.from(room.remoteParticipants.values());

        // Create new array while preserving container references
        participants = remoteParticipants.map((remote: any) => {
            // Find existing participant with same identity to preserve container reference
            const existing = participants.find(
                (p) => p.identity === remote.identity,
            );
            if (existing && existing.container) {
                // Cast the remote participant to our extended type and add container
                return Object.assign(remote, { container: existing.container });
            }
            return remote;
        });

        console.log(
            "Updated participants list:",
            participants.length,
            "remote participants",
        );
    }

    function handleRetry() {
        // Refresh the page to retry connection
        window.location.reload();
    }
</script>

<MainMeetingLayout
    darkMode={darkMode}
    micEnabled={micEnabled}
    cameraEnabled={cameraEnabled}
    participantCount={participants.length + 1}
    meetingId={page.params.meetId}
    connecting={connecting}
    connectionError={connectionError}
    onToggleDarkMode={() => darkMode = !darkMode}
    onToggleMic={toggleMic}
    onToggleCamera={toggleCamera}
    onLeave={() => goto('/')}
    onRetry={handleRetry}
    onSettings={() => {}}
    onChat={() => {}}
    onParticipants={() => {}}
>
    <!-- Video grid -->
    <div class="flex flex-wrap gap-4 flex-grow">
        <!-- Local video -->
        <div
            class="local-video-container bg-gray-800 rounded-lg overflow-hidden relative"
            class:opacity-50={!cameraEnabled}
        >
            <div
                bind:this={localVideoContainer}
                class="w-full h-full"
            ></div>
            <div
                class="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded"
            >
                You ({$userStore?.name || "Local"})
            </div>
            <div
                class="absolute top-2 right-2 flex gap-2"
            >
                {#if !micEnabled}
                    <div class="bg-red-500 p-1 rounded">
                        <i class="fas fa-microphone-slash text-white"></i>
                    </div>
                {/if}
                {#if !cameraEnabled}
                    <div class="bg-red-500 p-1 rounded">
                        <i class="fas fa-video-slash text-white"></i>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Remote participants - using bind:this to store container references directly -->
        <div
            id="remote-participants"
            class="flex flex-wrap gap-4"
        >
            {#each participants as participant}
                <div
                    class="participant-video bg-gray-800 rounded-lg overflow-hidden relative"
                >
                    <div
                        bind:this={participant.container}
                        class="w-full h-full"
                    ></div>
                    <div
                        class="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded"
                    >
                        {participant.identity}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</MainMeetingLayout>

<style>
    .local-video-container,
    .participant-video {
        width: 320px;
        height: 240px;
        background-color: #1a1a1a;
    }

    #remote-participants {
        flex: 1;
    }
</style>
