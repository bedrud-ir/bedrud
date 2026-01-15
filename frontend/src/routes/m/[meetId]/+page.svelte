<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import { userStore } from "$lib/stores/user.store";
    import { page } from "$app/stores";
    import {
        Room,
        RoomEvent,
        Track,
        RemoteTrack,
        RemoteTrackPublication,
        RemoteParticipant,
        Participant,
    } from "livekit-client";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import {
        Mic,
        MicOff,
        Video,
        VideoOff,
        MessageCircle,
        Users,
        LogOut,
        Loader2,
    } from "lucide-svelte";
    import { joinRoomAPI } from "$lib/api/room";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";

    // State management
    let room = $state<Room | null>(null);
    let participants = $state<any[]>([]);
    let localParticipant = $state<Participant | null>(null);
    let audioEnabled = $state(true);
    let videoEnabled = $state(true);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let connectionError = $state<string | null>(null);

    // Guest join state
    let showNameModal = $state(false);
    let guestName = $state("");

    // Track local video container reference
    let localVideoContainer: HTMLDivElement;
    let logs = $state<string[]>([]);

    // Store for pending track attachments - solves race condition
    let pendingTrackAttachments = $state(new Map());

    const log = (m: string) => logs.push(`[room] ${m}`);

    // Function to connect to LiveKit room
    async function connectToRoom(
        room: Room,
        token: string,
        livekitHost: string,
    ): Promise<void> {
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

    // Toggle functions for audio/video
    async function toggleMic() {
        if (!room?.localParticipant) return;

        try {
            if (audioEnabled) {
                await room.localParticipant.setMicrophoneEnabled(false);
            } else {
                await room.localParticipant.setMicrophoneEnabled(true);
            }
            audioEnabled = !audioEnabled;
        } catch (error) {
            console.error("Failed to toggle microphone:", error);
        }
    }

    async function toggleVideo() {
        if (!room?.localParticipant) return;

        try {
            if (videoEnabled) {
                await room.localParticipant.setCameraEnabled(false);
            } else {
                await room.localParticipant.setCameraEnabled(true);
            }
            videoEnabled = !videoEnabled;
        } catch (error) {
            console.error("Failed to toggle camera:", error);
        }
    }

    async function leaveMeeting() {
        if (room) {
            await room.disconnect();
        }
        goto("/dashboard");
    }

    // Process any pending track attachments for a participant
    function processPendingTracks(participantIdentity, container) {
        if (pendingTrackAttachments.has(participantIdentity)) {
            const tracks = pendingTrackAttachments.get(participantIdentity);
            log(
                `Processing ${tracks.length} pending tracks for ${participantIdentity}`,
            );

            if (tracks && tracks.length > 0) {
                // Clear container before adding new elements
                container.innerHTML = "";

                // Attach all pending tracks
                tracks.forEach((track) => {
                    const element = track.attach();
                    if (element instanceof HTMLVideoElement) {
                        element.autoplay = true;
                        element.playsInline = true;
                        // Only mute video tracks, not audio
                        if (track.kind === Track.Kind.Video) {
                            element.muted = true;
                        }
                        element.style.width = "100%";
                        element.style.height = "100%";
                        element.style.objectFit = "cover";
                    } else if (element instanceof HTMLAudioElement) {
                        element.autoplay = true;
                        element.muted = false;
                    }
                    container.appendChild(element);
                });

                // Remove from pending map after processing
                pendingTrackAttachments.delete(participantIdentity);
            }
        }
    }

    function setupEventListeners() {
        if (!room) return;

        room.on(RoomEvent.ParticipantConnected, (participant) => {
            console.log("Participant connected:", participant.identity);
            updateParticipantsList();
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
            console.log("Participant disconnected:", participant.identity);
            // Clear any pending tracks for this participant
            if (pendingTrackAttachments.has(participant.identity)) {
                pendingTrackAttachments.delete(participant.identity);
            }
            updateParticipantsList();
        });

        room.on(
            RoomEvent.TrackSubscribed,
            (
                track: RemoteTrack,
                publication: RemoteTrackPublication,
                participant: RemoteParticipant,
            ) => {
                log(
                    `Track subscribed: ${track.kind} from ${participant.identity}`,
                );

                // Find if we already have a container for this participant
                const existingParticipant = participants.find(
                    (p) => p.identity === participant.identity,
                );

                if (existingParticipant && existingParticipant.container) {
                    // Container exists, attach track immediately
                    const element = track.attach();
                    if (element instanceof HTMLVideoElement) {
                        element.autoplay = true;
                        element.playsInline = true;
                        // Only mute video tracks, not audio
                        if (track.kind === Track.Kind.Video) {
                            element.muted = true;
                        }
                        element.style.width = "100%";
                        element.style.height = "100%";
                        element.style.objectFit = "cover";
                    } else if (element instanceof HTMLAudioElement) {
                        element.autoplay = true;
                        element.muted = false;
                    }

                    // For video tracks, replace existing content
                    if (track.kind === Track.Kind.Video) {
                        existingParticipant.container.innerHTML = "";
                    }
                    existingParticipant.container.appendChild(element);
                } else {
                    // No container yet, store track for later attachment
                    log(
                        `No container for ${participant.identity}, queuing track`,
                    );
                    const tracks =
                        pendingTrackAttachments.get(participant.identity) || [];
                    tracks.push(track);
                    pendingTrackAttachments.set(participant.identity, tracks);

                    // Force an update to the participants list to ensure container gets created
                    updateParticipantsList();
                }
            },
        );

        room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
            track.detach();
        });
    }

    // Effect to process pending tracks when containers are ready
    $effect(() => {
        // Process any pending tracks whenever participants list changes
        for (const participant of participants) {
            if (
                participant.container &&
                pendingTrackAttachments.has(participant.identity)
            ) {
                log(
                    `Container for ${participant.identity} is now ready, processing tracks`,
                );
                processPendingTracks(
                    participant.identity,
                    participant.container,
                );
            }
        }
    });

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
                return Object.assign(
                    { ...remote },
                    { container: existing.container },
                );
            }
            return remote;
        });

        console.log(
            "Updated participants list:",
            participants.length,
            "remote participants",
        );
    }

    onMount(async () => {
        // Check the params
        if (!$page.params.meetId) {
            goto("/404");
            return;
        }

        // Check if user is logged in
        if (!$userStore) {
            showNameModal = true;
            isLoading = false;
            return;
        }

        // Try to join the meeting automatically if logged in
        joinMeeting();
    });

    async function handleJoinAsGuest() {
        if (!guestName.trim()) return;
        showNameModal = false;
        await joinMeeting(guestName);
    }

    async function joinMeeting(userName?: string) {
        isLoading = true;

        try {
            const joinRoomResp = await joinRoomAPI({
                roomName: $page.params.meetId,
                userName: userName
            });

            if (
                !joinRoomResp ||
                !joinRoomResp.token ||
                !joinRoomResp.livekitHost
            ) {
                connectionError = "Failed to get room token or LiveKit host";
                isLoading = false;
                return;
            }

            // Setup room
            room = new Room({
                adaptiveStream: true,
                dynacast: true,
            });

            setupEventListeners();

            // Connect to the room
            await connectToRoom(
                room,
                joinRoomResp.token,
                joinRoomResp.livekitHost,
            );

            // Update local participant reference
            localParticipant = room.localParticipant;
            connectionError = null;

            // Setup local media after connection
            setTimeout(async () => {
                if (room?.state === "connected") {
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
                                videoEl.muted = true; // Only mute local video
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

            isLoading = false;
        } catch (err: any) {
            console.error("Failed to setup meeting:", err);
            error = err.message || "Failed to join meeting";
            isLoading = false;
        }
    }

    onDestroy(() => {
        if (room) {
            room.disconnect();
            log("Disconnected from room");
        }
    });

    function handleRetry() {
        // Refresh the page to retry connection
        window.location.reload();
    }
</script>

{#if showNameModal}
    <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card.Root class="w-[350px]">
             <Card.Header>
                <Card.Title>Join Meeting</Card.Title>
                <Card.Description>Enter your name to join as a guest</Card.Description>
            </Card.Header>
            <Card.Content>
                 <div class="grid w-full items-center gap-4">
                    <div class="flex flex-col space-y-1.5">
                        <Label for="name">Name</Label>
                        <Input id="name" bind:value={guestName} placeholder="Your Name" onkeydown={(e) => e.key === 'Enter' && handleJoinAsGuest()} />
                    </div>
                </div>
            </Card.Content>
            <Card.Footer class="flex justify-between">
                <Button variant="outline" href="/">Cancel</Button>
                <Button onclick={handleJoinAsGuest}>Join</Button>
            </Card.Footer>
        </Card.Root>
    </div>
{:else if isLoading}
    <div class="h-screen flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
            <Loader2 class="h-8 w-8 animate-spin" />
            <p class="text-muted-foreground">Joining meeting...</p>
        </div>
    </div>
{:else if error || connectionError}
    <div class="h-screen flex items-center justify-center">
        <Card.Root class="w-[350px]">
            <Card.Header>
                <Card.Title>Error</Card.Title>
                <Card.Description>{error || connectionError}</Card.Description>
            </Card.Header>
            <Card.Footer class="flex justify-between">
                <Button onclick={handleRetry} variant="outline">Retry</Button>
                <Button onclick={leaveMeeting} variant="default"
                    >Return Home</Button
                >
            </Card.Footer>
        </Card.Root>
    </div>
{:else if room}
    <div class="h-screen flex flex-col">
        <!-- Header -->
        <div
            class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
            <div class="flex h-14 items-center px-4 justify-between">
                <div class="flex items-center gap-4">
                    <h1 class="font-semibold">
                        Meeting: {$page.params.meetId}
                    </h1>
                    <Separator orientation="vertical" class="h-4" />
                    <div
                        class="flex items-center gap-1 text-muted-foreground text-sm"
                    >
                        <Users class="h-4 w-4" />
                        <span>{participants.length + 1}</span>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onclick={leaveMeeting}>
                    <LogOut class="h-4 w-4 mr-2" />
                    Leave
                </Button>
            </div>
        </div>

        <!-- Video Grid - Flex Based Tile View from Test Page -->
        <div class="flex-1 bg-muted/20 p-4 overflow-auto">
            <div class="flex flex-wrap gap-4 flex-grow">
                <!-- Local video -->
                <div
                    class="local-video-container bg-gray-800 rounded-lg overflow-hidden relative"
                    class:opacity-50={!videoEnabled}
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
                    <div class="absolute top-2 right-2 flex gap-2">
                        {#if !audioEnabled}
                            <div class="bg-red-500 p-1 rounded">
                                <MicOff class="h-4 w-4 text-white" />
                            </div>
                        {/if}
                        {#if !videoEnabled}
                            <div class="bg-red-500 p-1 rounded">
                                <VideoOff class="h-4 w-4 text-white" />
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Remote participants - using bind:this to store container references directly -->
                <div id="remote-participants" class="flex flex-wrap gap-4">
                    {#each participants as participant (participant.identity)}
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
        </div>

        <!-- Controls -->
        <div
            class="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
            <div class="flex h-16 items-center justify-center gap-2">
                <Button
                    variant={audioEnabled ? "outline" : "destructive"}
                    size="icon"
                    onclick={toggleMic}
                >
                    {#if audioEnabled}
                        <Mic class="h-4 w-4" />
                    {:else}
                        <MicOff class="h-4 w-4" />
                    {/if}
                </Button>
                <Button
                    variant={videoEnabled ? "outline" : "destructive"}
                    size="icon"
                    onclick={toggleVideo}
                >
                    {#if videoEnabled}
                        <Video class="h-4 w-4" />
                    {:else}
                        <VideoOff class="h-4 w-4" />
                    {/if}
                </Button>
                <Button variant="outline" size="icon">
                    <MessageCircle class="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" class="h-8" />
                <Button variant="destructive" size="sm" onclick={leaveMeeting}>
                    <LogOut class="h-4 w-4 mr-2" />
                    End Call
                </Button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Fixed size video containers from test page */
    .local-video-container,
    .participant-video {
        width: 320px;
        height: 240px;
        background-color: #1a1a1a;
    }

    #remote-participants {
        flex: 1;
    }

    /* Additional responsive adjustments */
    @media (max-width: 640px) {
        .local-video-container,
        .participant-video {
            width: 100%;
            max-width: 320px;
            height: 240px;
        }
    }
</style>
