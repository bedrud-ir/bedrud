<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import { userStore } from "$lib/stores/user.store";
    import {
        createRoom,
        connectToRoom,
        attachTrack,
        detachTrack,
    } from "$lib/livekit";
    import type {
        Room,
        RemoteTrack,
        RemoteTrackPublication,
        RemoteParticipant,
        Participant,
    } from "livekit-client";
    import { Track, RoomEvent } from "livekit-client";
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
    import { joinRoomAPI } from "$lib/api";

    let meetingState = $state("INIT"); // INIT, CONNECTING, CONNECTED, DISCONNECTED, ERROR
    let error = $state(null);
    let unsubscribe: (() => void)[];

    let room: Room | undefined;

    let audioEnabled = $state(true);
    let videoEnabled = $state(true);
    let meetingData = $state(null);
    let participants = $state<Participant[]>([]);
    let myVideoEl: HTMLVideoElement;
    let myAudioEl: HTMLAudioElement;

    // Remove track variables as we'll handle directly with elements
    let videoStream: MediaStream | null = null;
    let audioStream: MediaStream | null = null;

    async function setupRoom() {
        try {
            if (!data.meetingData) {
                throw new Error("No meeting data available");
            }

            console.log("Setting up room with token:", data.meetingData.token);
            room = createRoom();

            // Setup event listeners
            room.on(RoomEvent.ParticipantConnected, (participant) => {
                console.log("Participant connected:", participant);
                if (room?.state === "connected") {
                    participants = Array.from(room.remoteParticipants.values());
                }
            })
                .on(RoomEvent.ParticipantDisconnected, (participant) => {
                    console.log("Participant disconnected:", participant);
                    if (room?.state === "connected") {
                        participants = Array.from(
                            room.remoteParticipants.values(),
                        );
                    }
                })
                .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
                .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
                .on(RoomEvent.Disconnected, handleDisconnect);

            // Connect using the meeting data that contains the LiveKit token
            await connectToRoom(room, data.meetingData);
            console.log("Room connected:", room.state);
            meetingData = data.meetingData;

            isLoading = false;

            setTimeout(async () => {
                // Initialize after confirmed connection
                if (room.state === "connected") {
                    participants = Array.from(room.remoteParticipants.values());

                    // Enable camera and mic with explicit options
                    await room.localParticipant.enableCameraAndMicrophone();

                    // Handle video track
                    const cameraPublication =
                        room.localParticipant.getTrackPublication(
                            Track.Source.Camera,
                        );
                    if (cameraPublication?.track) {
                        let myVideoTrack = cameraPublication.track;
                        if (myVideoEl) {
                            const videoElement = myVideoTrack.attach();
                            if (videoElement instanceof HTMLVideoElement) {
                                videoElement.autoplay = true;
                                videoElement.playsInline = true;
                                videoElement.muted = true;
                                videoElement.style.width = "100%";
                                videoElement.style.height = "100%";
                                videoElement.style.objectFit = "cover";
                                myVideoEl.replaceWith(videoElement);
                                myVideoEl = videoElement;
                            }
                        } else {
                            console.log("No video element");
                        }
                    }

                    // Handle audio track
                    const micPublication =
                        room.localParticipant.getTrackPublication(
                            Track.Source.Microphone,
                        );
                    if (micPublication?.track) {
                        let myAudioTrack = micPublication.track;
                        if (myAudioEl) {
                            const audioElement = myAudioTrack.attach();
                            if (audioElement instanceof HTMLAudioElement) {
                                audioElement.autoplay = true;
                                audioElement.muted = true;
                                myAudioEl.replaceWith(audioElement);
                                myAudioEl = audioElement;
                            }
                        }
                    }
                }
            }, 200);
        } catch (e) {
            console.error("Failed to setup room:", e);
            error = e.message || "Failed to setup video call";
            isLoading = false;
        }
    }

    // Start room setup when we have the token
    $effect(() => {
        if (data.meetingData?.token) {
            setTimeout(() => {
                setupRoom();
            }, 1000);
        }
    });

    $effect(() => {
        if (room?.state === "connected" && myVideoEl && myAudioEl) {
            const cameraPublication = room.localParticipant.getTrackPublication(
                Track.Source.Camera,
            );
            const micPublication = room.localParticipant.getTrackPublication(
                Track.Source.Microphone,
            );

            if (cameraPublication?.track) {
                // Instead of replacing the element, set its srcObject
                const videoElement = cameraPublication.track.attach();
                if (videoElement instanceof HTMLVideoElement) {
                    videoStream = videoElement.srcObject as MediaStream;
                    if (videoStream && myVideoEl) {
                        myVideoEl.srcObject = videoStream;
                        myVideoEl.play().catch(console.error);
                    }
                }
            }

            if (micPublication?.track) {
                const audioElement = micPublication.track.attach();
                if (audioElement instanceof HTMLAudioElement) {
                    audioStream = audioElement.srcObject as MediaStream;
                    if (audioStream && myAudioEl) {
                        myAudioEl.srcObject = audioStream;
                        myAudioEl.play().catch(console.error);
                    }
                }
            }
        }
    });

    function handleParticipantConnected(participant: Participant) {
        participants = [...participants, participant];
    }

    function handleParticipantDisconnected(participant: Participant) {
        participants = participants.filter(
            (p) => p.identity !== participant.identity,
        );
    }

    function handleTrackSubscribed(
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ) {
        if (
            track.kind === Track.Kind.Video ||
            track.kind === Track.Kind.Audio
        ) {
            const containerId = `participant-${participant.identity}`;
            attachTrack(track, containerId);
        }
    }

    function handleTrackUnsubscribed(
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ) {
        detachTrack(track);
    }

    function handleDisconnect() {
        console.log("disconnected from room");
    }

    async function toggleAudio() {
        if (room?.localParticipant) {
            audioEnabled = !audioEnabled;
            await room.localParticipant.setMicrophoneEnabled(audioEnabled);
        }
    }

    async function toggleVideo() {
        if (room?.localParticipant) {
            videoEnabled = !videoEnabled;
            await room.localParticipant.setCameraEnabled(videoEnabled);
        }
    }

    async function leaveMeeting() {
        if (room) {
            await room.disconnect();
        }
        goto("/");
    }

    onMount(() => {
        // first we need to get the user's token. if no token => login
        
        // then get the join token => join room
        // then setup the room
        // then connect to the room

        unsubscribe.push(
            userStore.subscribe((value) => {
                if (room?.localParticipant) {
                    room.localParticipant.identity = value.name;
                }
            }),
        );
        // Debug log to check the token
        console.log("Meeting data:", data.meetingData);
        console.log("Token available:", data.meetingData?.token);
    });

    onDestroy(() => {
        if (room) room.disconnect();
    });
</script>

{#if isLoading}
    <div class="h-screen flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
            <Loader2 class="h-8 w-8 animate-spin" />
            <p class="text-muted-foreground">Joining meeting...</p>
        </div>
    </div>
{:else if error}
    <div class="h-screen flex items-center justify-center">
        <Card.Root class="w-[350px]">
            <Card.Header>
                <Card.Title>Error</Card.Title>
                <Card.Description>{error}</Card.Description>
            </Card.Header>
            <Card.Footer>
                <Button onclick={leaveMeeting} variant="default"
                    >Return Home</Button
                >
            </Card.Footer>
        </Card.Root>
    </div>
{:else if !isLoading && meetingData && room}
    <div class="h-screen flex flex-col">
        <!-- Header -->
        <div
            class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
            <div class="flex h-14 items-center px-4 justify-between">
                <div class="flex items-center gap-4">
                    <h1 class="font-semibold">{meetingData.name}</h1>
                    <Separator orientation="vertical" class="h-4" />
                    <div
                        class="flex items-center gap-1 text-muted-foreground text-sm"
                    >
                        <Users class="h-4 w-4" />
                        <span>{meetingData.maxParticipants}</span>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onclick={leaveMeeting}>
                    <LogOut class="h-4 w-4 mr-2" />
                    Leave
                </Button>
            </div>
        </div>

        <!-- Video Grid -->
        <div class="flex-1 bg-muted/20 p-4 overflow-hidden">
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full max-h-full auto-rows-fr"
            >
                <!-- Local participant -->
                <div class="relative w-full h-full">
                    <Card.Root class="absolute inset-0 overflow-hidden">
                        <div
                            class="absolute inset-0 bg-muted flex items-center justify-center"
                        >
                            <video
                                bind:this={myVideoEl}
                                autoplay
                                playsinline
                                muted
                                class="w-full h-full object-cover"
                            ></video>
                            <audio bind:this={myAudioEl} autoplay muted></audio>
                            <span
                                class="text-muted-foreground absolute bottom-2 left-2 z-10 bg-background/80 px-2 py-1 rounded"
                            >
                                {$userStore?.name || "You"}
                            </span>
                        </div>
                    </Card.Root>
                </div>

                <!-- Remote participants -->
                {#each participants as participant (participant.identity)}
                    <div class="relative w-full h-full">
                        <Card.Root class="absolute inset-0 overflow-hidden">
                            <div
                                class="absolute inset-0 bg-muted flex items-center justify-center"
                            >
                                <video
                                    id="video-{participant.identity}"
                                    autoplay
                                    playsinline
                                    class="w-full h-full object-cover"
                                />
                                <audio
                                    id="audio-{participant.identity}"
                                    autoplay
                                />
                                <span
                                    class="text-muted-foreground absolute bottom-2 left-2 z-10 bg-background/80 px-2 py-1 rounded"
                                >
                                    {participant.identity}
                                </span>
                            </div>
                        </Card.Root>
                    </div>
                {/each}
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
                    onclick={toggleAudio}
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
