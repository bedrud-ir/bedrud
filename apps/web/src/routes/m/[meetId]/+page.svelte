<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import { userStore } from "$lib/stores/user.store";
    import { debugStore } from "$lib/stores/debug.store";
    import { page } from "$app/stores";
    import {
        Room,
        RoomEvent,
        Track,
        RemoteTrack,
        RemoteTrackPublication,
        RemoteParticipant,
        Participant,
        LocalParticipant,
        ExternalE2EEKeyProvider,
        type RoomOptions,
    } from "livekit-client";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import {
        Mic,
        MicOff,
        Video,
        VideoOff,
        ScreenShare,
        ScreenShareOff,
        MessageCircle,
        Users,
        LogOut,
        Loader2,
        ChevronUp,
        Crown,
        ShieldAlert,
        Settings,
        Camera,
        Image as ImageIcon,
        UserMinus,
        Volume2,
        MonitorUp,
        LayoutGrid,
        LayoutTemplate,
        Presentation,
        ShieldCheck,
        Plus,
        AudioLines,
        Sparkles,
    } from "lucide-svelte";
    import {
        joinRoomAPI,
        kickParticipantAPI,
        muteParticipantAPI,
        disableParticipantVideoAPI,
        updateRoomSettingsAPI,
        type Room as RoomModel,
    } from "$lib/api/room";
    import { guestLoginAPI } from "$lib/api/auth";
    import { authStore } from "$lib/stores/auth.store";
    import Chat from "$lib/components/meeting/Chat.svelte";
    import ParticipantsList from "$lib/components/meeting/ParticipantsList.svelte";
    import ParticipantAvatar from "$lib/components/meeting/ParticipantAvatar.svelte";
    import MicButton from "$lib/components/meeting/MicButton.svelte";
    import CameraButton from "$lib/components/meeting/CameraButton.svelte";
    import { themeStore, type Theme } from "$lib/stores/theme.store";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Input } from "$lib/components/ui/input";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Label } from "$lib/components/ui/label";
    import { type Message } from "$lib/models/chat";
    import { X as CloseIcon } from "lucide-svelte";
    import { getGuestProfile, saveGuestProfile } from "$lib/storage";
    import { initLiveKitLogging } from "$lib/utils/livekit-logger";

    import { type GridTile, type ParticipantStatus } from "$lib/types/meeting";
    import GridLayout from "$lib/components/meeting/layouts/GridLayout.svelte";
    import PresentationLayout from "$lib/components/meeting/layouts/PresentationLayout.svelte";
    import StageLayout from "$lib/components/meeting/layouts/StageLayout.svelte";
    import EncryptionModal from "$lib/components/meeting/EncryptionModal.svelte";

    // --- Audio Magic Numbers & Sensitivity Config ---
    const AUDIO_THRESHOLD_UI = 0.001; // High sensitivity for speaking indicators (rings, borders)
    const AUDIO_THRESHOLD_MIN = 0.002; // Minimum threshold for any activity
    const AUDIO_BOOST_UI = 500; // Sensitivity boost for visual fills
    const AUDIO_NORM_FACTOR = 0.5; // Normalization power (0.5 = square root)
    const AUDIO_VIZ_HEIGHT_FACTOR = 60; // Height factor for remote visualizer bars

    // State management
    let room = $state<Room | null>(null);
    let participants = $state<any[]>([]);
    let localParticipant = $state<LocalParticipant | null>(null);
    let audioEnabled = $state(true);
    let noiseSuppressionLevel = $state<
        "low" | "moderate" | "high" | "very-high"
    >("moderate");
    let videoEnabled = $state(true);
    let screenShareEnabled = $state(false);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let connectionError = $state<string | null>(null);
    let isChatOpen = $state(false);
    let isParticipantsOpen = $state(false);
    let roomDetails = $state<RoomModel | null>(null);

    // Chat management
    let chatMessages = $state<Message[]>([]);
    let lastNotificationMessage = $state<Message | null>(null);
    let showMessageNotification = $state(false);
    let notificationTimeout: any;
    let messageSound = $state<HTMLAudioElement | null>(null);
    let joinSound = $state<HTMLAudioElement | null>(null);
    let leaveSound = $state<HTMLAudioElement | null>(null);

    // Profile state
    let isSettingsOpen = $state(false);
    let settingsTab = $state("general");

    // Responsive state
    let screenWidth = $state(
        typeof window !== "undefined" ? window.innerWidth : 1024,
    );
    let isMobile = $derived(screenWidth < 768);

    onMount(() => {
        screenWidth = window.innerWidth;
        const handleResize = () => {
            screenWidth = window.innerWidth;
        };
        window.addEventListener("resize", handleResize);

        // Initialize LiveKit log suppression
        initLiveKitLogging();

        const tracks = [Track.Source.Camera, Track.Source.Microphone];
    });

    let currentUser = $derived($userStore);
    let tempDisplayName = $state("");

    // Kick management
    let isKickModalOpen = $state(false);
    let participantToKick = $state<{ identity: string; name: string } | null>(
        null,
    );

    // Layout management
    let activeLayout = $state<"grid" | "stage">("grid");
    let stageParticipantIdentity = $state<string | null>(null);

    // E2EE Management
    let isE2EEEnabled = $state(false);
    let isEncryptionModalOpen = $state(false);
    let keyProvider: ExternalE2EEKeyProvider | null = null;
    let isTogglingE2EE = false;

    // Guest state
    let showGuestForm = $state(false);
    let guestName = $state("");
    let guestAvatar = $state<string | null>(null);
    let isGuestJoining = $state(false);
    let showPermissionRequest = $state(false);
    let joinWithCamera = $state(false); // Default: join with camera OFF
    let joinWithMic = $state(true); // Default: join with microphone ON
    let avatarInput = $state<HTMLInputElement>();

    // Device and Level management
    let audioDevices = $state<MediaDeviceInfo[]>([]);
    let videoDevices = $state<MediaDeviceInfo[]>([]);
    let audioOutputDevices = $state<MediaDeviceInfo[]>([]);
    let activeAudioOutputId = $state<string>("");
    let audioLevels = $state(new Map<string, number>()); // identity -> level (0-1)
    let recentlyTalking = $state(new Map<string, boolean>()); // identity -> boolean
    let talkingTimeouts = new Map<string, any>(); // identity -> timeout id
    let localAudioLevel = $state(0);
    let sidebarMode = $state<"overlay" | "push">("push");
    let dontAskAgain = $state(false);
    let isSwitchingAudio = $state(false);
    let isSwitchingVideo = $state(false);

    // Track logs for debugging
    // State for local screen share status (synchronized with room)
    let isLocalScreenSharing = $state(false);

    // Store for pending track attachments - solves race condition
    let pendingTrackAttachments = $state(new Map());

    // Track logs for debugging
    let logs = $state<string[]>([]);
    const log = (msg: string, type: "info" | "error" | "warn" = "info") => {
        debugStore.log(msg, type, "RTC");
        logs = [...logs, `[${type.toUpperCase()}] ${msg}`];
    };

    const decoder = new TextDecoder();

    function getParticipantName(identity: string) {
        if (room?.localParticipant?.identity === identity) {
            return room.localParticipant.name || "You";
        }
        const p = room?.remoteParticipants.get(identity);
        return p?.name || identity;
    }

    function getParticipantAvatar(identity: string) {
        if (room?.localParticipant?.identity === identity) {
            return guestAvatar || null;
        }
        const p = room?.remoteParticipants.get(identity);
        if (p?.metadata) {
            try {
                const meta = JSON.parse(p.metadata);
                return meta.avatar || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    function getParticipantColor(identity: string) {
        let hash = 0;
        for (let i = 0; i < identity.length; i++) {
            hash = identity.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Use HSL for nice, consistent colors. S: 45-65%, L: 20-30% for dark bg
        const h = Math.abs(hash) % 360;
        return `hsl(${h}, 55%, 25%)`;
    }
    function handleDataReceived(payload: Uint8Array, participant?: any) {
        try {
            const decoded = decoder.decode(payload);
            const data = JSON.parse(decoded);
            if (data.text || data.imageUrl) {
                const newMsg: Message = {
                    sender: participant?.identity || "Unknown",
                    text: data.text,
                    imageUrl: data.imageUrl,
                    timestamp: data.timestamp || Date.now(),
                    isLocal: false,
                };
                chatMessages.push(newMsg);

                if (!isChatOpen || document.hidden) {
                    // Play sound
                    if (messageSound) {
                        messageSound
                            .play()
                            .catch((e) =>
                                console.warn(
                                    "Failed to play notification sound:",
                                    e,
                                ),
                            );
                    }

                    lastNotificationMessage = newMsg;
                    showMessageNotification = true;
                    if (notificationTimeout) clearTimeout(notificationTimeout);
                    notificationTimeout = setTimeout(() => {
                        showMessageNotification = false;
                    }, 5000);
                }
            } else if (data.type === "layout-update") {
                activeLayout = data.layout;
                stageParticipantIdentity = data.participantIdentity;
                log(
                    `Layout updated to ${activeLayout} focusing on ${stageParticipantIdentity}`,
                );
            } else if (data.type === "e2ee-sync") {
                log(`Received E2EE sync message: ${data.enabled}`);
                // Use a internal flag or different function to avoid infinite loops
                // Here we just call toggleE2EE with a check
                if (isE2EEEnabled !== data.enabled) {
                    toggleE2EE(data.enabled, true); // true = isSync
                }
            }
        } catch (e) {
            console.error("Failed to decode message:", e);
        }
    }

    // Function to connect to LiveKit room
    async function connectToRoom(
        room: Room,
        token: string,
        livekitHost: string,
    ): Promise<void> {
        log(`Connecting to room at ${livekitHost}`);
        debugStore.debug(`Token: ${token.substring(0, 20)}...`);

        try {
            // Pre-warm connection
            log("Preparing connection...");
            await room.prepareConnection(livekitHost, token);

            log("Connection prepared. Connecting now...");
            // Connect with auto-subscribe enabled
            await room.connect(livekitHost, token, {
                autoSubscribe: true,
            });

            log("Successfully connected to room");

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
        } catch (error: any) {
            log(`Failed to connect: ${error.message}`);
            debugStore.error(`Connect error: ${error.message}`, "RTC");
            throw error;
        }
    }

    // Use a reactive map for participant statuses to ensure Svelte 5 picks up changes
    let participantStatuses = $state<Map<string, ParticipantStatus>>(new Map());

    // Toggle functions for audio/video - more robust
    async function toggleMic() {
        if (!room?.localParticipant) return;
        const isEnabled = room.localParticipant.isMicrophoneEnabled;
        log(`Toggling microphone. Current state: ${isEnabled}`);

        try {
            await room.localParticipant.setMicrophoneEnabled(!isEnabled);
            log(`Microphone set to: ${!isEnabled}`);
            // State will be updated via events
            updateParticipantsList();
        } catch (error: any) {
            const isNotFound =
                error.name === "NotFoundError" ||
                error.name === "DevicesNotFoundError" ||
                error.message?.toLowerCase().includes("not found") ||
                error.message?.toLowerCase().includes("device not found");

            if (isNotFound) {
                log("No microphone detected on this system", "warn");
            } else {
                log(`Failed to toggle microphone: ${error.message}`, "error");
                console.error("Failed to toggle microphone:", error);
            }
        }
    }

    async function toggleVideo() {
        if (!room?.localParticipant) return;
        const isEnabled = room.localParticipant.isCameraEnabled;
        log(`Toggling video. Current state: ${isEnabled}`);

        try {
            await room.localParticipant.setCameraEnabled(!isEnabled);
            log(`Camera set to: ${!isEnabled}`);
            // State will be updated via events
            updateParticipantsList();
        } catch (error: any) {
            const isNotFound =
                error.name === "NotFoundError" ||
                error.name === "DevicesNotFoundError" ||
                error.message?.toLowerCase().includes("not found") ||
                error.message?.toLowerCase().includes("device not found");

            if (isNotFound) {
                log("No camera detected on this system", "warn");
            } else {
                log(`Failed to toggle camera: ${error.message}`, "error");
                console.error("Failed to toggle camera:", error);
            }
        }
    }

    async function toggleScreenShare() {
        if (!room?.localParticipant) return;
        const isEnabled = room.localParticipant.isScreenShareEnabled;
        log(`Toggling screen share. Current state: ${isEnabled}`);

        try {
            await room.localParticipant.setScreenShareEnabled(!isEnabled);
            // Internal state is updated by room events, but we can set it here for immediate feedback if needed
            // however it's safer to wait for the event.
            log(`setScreenShareEnabled(${!isEnabled}) called successfully`);
            updateParticipantsList();
        } catch (error: any) {
            log(`Failed to toggle screen share: ${error.message}`);
            console.error("Failed to toggle screen share:", error);
        }
    }

    async function leaveMeeting() {
        if (room) {
            await room.disconnect();
        }
        goto("/");
    }

    async function updateDisplayName() {
        if (!room?.localParticipant || !tempDisplayName.trim()) return;
        const name = tempDisplayName.trim();
        try {
            await room.localParticipant.setName(name);
            log(`Display name updated to: ${name}`);

            // If it's a registered user, update the store so Header reflects it
            if ($userStore) {
                userStore.update((u) => (u ? { ...u, name } : null));
            }

            // Persistence in IndexedDB (local override)
            await saveGuestProfile({
                name,
                avatar: guestAvatar || (await getGuestProfile())?.avatar,
            });

            isSettingsOpen = false;
            updateParticipantsList();
        } catch (err: any) {
            log(`Failed to update display name: ${err.message}`, "error");
        }
    }

    async function handleAvatarChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const originalBase64 = e.target?.result as string;

            // Resize image to ensure it fits in LiveKit metadata (limit is usually ~2KB-20KB)
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement("canvas");
                const MAX_SIZE = 64; // 64x64 thumbnail to stay under metadata limits
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                const base64 = canvas.toDataURL("image/jpeg", 0.5); // Use lower quality for smaller size
                guestAvatar = base64;
                log(`Avatar resized: ${base64.length} bytes`);

                // If already in a room, update live
                if (room?.localParticipant) {
                    try {
                        await room.localParticipant.setMetadata(
                            JSON.stringify({ avatar: base64 }),
                        );
                        log("Avatar updated and broadcasted");

                        // Update local store if registered
                        if ($userStore) {
                            userStore.update((u) =>
                                u ? { ...u, avatarUrl: base64 } : null,
                            );
                        }

                        // Save to IndexedDB (local override)
                        const currentName =
                            room.localParticipant.name ||
                            tempDisplayName ||
                            guestName;
                        await saveGuestProfile({
                            name: currentName,
                            avatar: base64,
                        });
                    } catch (err: any) {
                        log(
                            `Failed to broadcast avatar: ${err.message}`,
                            "error",
                        );
                    }
                }
            };
            img.src = originalBase64;
        };
        reader.readAsDataURL(file);
    }

    async function updateDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            audioDevices = devices.filter((d) => d.kind === "audioinput");
            videoDevices = devices.filter((d) => d.kind === "videoinput");
            audioOutputDevices = devices.filter(
                (d) => d.kind === "audiooutput",
            );

            // Initialize active output device ID
            if (activeAudioOutputId === "" && audioOutputDevices.length > 0) {
                activeAudioOutputId =
                    room?.getActiveDevice("audiooutput") ||
                    audioOutputDevices[0].deviceId;
            }

            log(
                `Found ${audioDevices.length} audio, ${videoDevices.length} video, ${audioOutputDevices.length} output devices`,
            );
        } catch (err: any) {
            log(`Failed to list devices: ${err.message}`, "error");
        }
    }

    async function setAudioOutputDevice(deviceId: string) {
        if (!room) return;
        try {
            log(`Switching audio output device to: ${deviceId}`);
            await room.switchActiveDevice("audiooutput", deviceId);
            activeAudioOutputId = deviceId;
            log("Audio output device switched successfully");
        } catch (err: any) {
            log(
                `Failed to switch audio output device: ${err.message}`,
                "error",
            );
        }
    }

    async function setAudioDevice(deviceId: string) {
        if (!room?.localParticipant || isSwitchingAudio) return;
        isSwitchingAudio = true;
        try {
            log(`Switching audio device to: ${deviceId}`);
            const micPub = room.localParticipant.getTrackPublication(
                Track.Source.Microphone,
            );
            if (micPub?.track) {
                // Restart the track with the new device
                await micPub.track.restartTrack({ deviceId });
                log("Audio device switched successfully via restartTrack");
            } else {
                // No track yet, enable with the new device
                await room.localParticipant.setMicrophoneEnabled(true, {
                    deviceId,
                });
            }
        } catch (err: any) {
            log(`Failed to switch audio device: ${err.message}`, "error");
        } finally {
            isSwitchingAudio = false;
        }
    }

    async function setNoiseSuppressionLevel(
        level: "low" | "moderate" | "high" | "very-high",
    ) {
        noiseSuppressionLevel = level;
        if (!room?.localParticipant) return;

        const micPub = room.localParticipant.getTrackPublication(
            Track.Source.Microphone,
        );
        if (micPub?.track) {
            try {
                log(`Applying noise suppression level: ${level}`);
                // We maintain the boolean constraint 'noiseSuppression' as true (except for low)
                // and rely on the state for future processing or specialized environments.
                await micPub.track.restartTrack({
                    noiseSuppression: level !== "low",
                    echoCancellation: true,
                    autoGainControl: true,
                });
                log(`Audio constraints updated for level: ${level}`);
            } catch (err: any) {
                log(
                    `Failed to update noise suppression level: ${err.message}`,
                    "error",
                );
            }
        }
    }

    async function setVideoDevice(deviceId: string) {
        if (!room?.localParticipant || isSwitchingVideo) return;

        const camPub = room.localParticipant.getTrackPublication(
            Track.Source.Camera,
        );
        const currentTrack = camPub?.track?.mediaStreamTrack;
        const currentDeviceId = currentTrack?.getSettings?.()?.deviceId;

        // Skip if already using this device
        if (currentDeviceId === deviceId) {
            log(`Already using camera device: ${deviceId.substring(0, 8)}...`);
            return;
        }

        isSwitchingVideo = true;
        try {
            log(
                `Switching video device from ${currentDeviceId?.substring(0, 8) || "none"}... to ${deviceId.substring(0, 8)}...`,
            );
            if (camPub?.track) {
                // Restart the track with the new device
                await camPub.track.restartTrack({ deviceId });
                log("Video device switched successfully via restartTrack");
            } else {
                // No track yet, enable with the new device
                await room.localParticipant.setCameraEnabled(true, {
                    deviceId,
                });
                videoEnabled = true;
                log("Video device enabled with new device");
            }
        } catch (err: any) {
            log(`Failed to switch video device: ${err.message}`, "error");
        } finally {
            isSwitchingVideo = false;
        }
    }

    // Generic track attachment action
    function attachTrack(
        node: HTMLElement,
        {
            participant,
            source,
            isLocal,
        }: { participant: Participant; source: Track.Source; isLocal: boolean },
    ) {
        let attachedTrack: any = null;

        function updateInternal() {
            const pub = participant.getTrackPublication(source);
            const track = pub?.track;

            if (track) {
                if (attachedTrack === track) return;

                node.innerHTML = "";
                const el = track.attach();
                el.style.width = "100%";
                el.style.height = "100%";

                if (el instanceof HTMLMediaElement) {
                    el.autoplay = true;
                    el.volume = 1.0;
                    if (el instanceof HTMLVideoElement) {
                        el.playsInline = true;
                        el.style.objectFit =
                            source === Track.Source.ScreenShare
                                ? "contain"
                                : "cover";
                    }
                    el.muted = isLocal;

                    // Force play in case autoplay was blocked
                    el.play().catch((e) => {
                        log(
                            `Autoplay prevented for ${source}: ${e.message}`,
                            "warn",
                        );
                    });
                }

                node.appendChild(el);
                attachedTrack = track;
                log(`Attached ${source} track for ${participant.identity}`);
            } else {
                // If no track but we had one, clear it
                if (attachedTrack) {
                    node.innerHTML = "";
                    attachedTrack = null;
                }
            }
        }

        // Listen for track events on this specific participant
        participant.on(RoomEvent.TrackSubscribed, updateInternal);
        participant.on(RoomEvent.TrackUnsubscribed, updateInternal);
        participant.on(RoomEvent.TrackMuted, updateInternal);
        participant.on(RoomEvent.TrackUnmuted, updateInternal);
        participant.on(RoomEvent.LocalTrackPublished, updateInternal);
        participant.on(RoomEvent.LocalTrackUnpublished, updateInternal);

        updateInternal();

        return {
            update(newParams: any) {
                // Clean up old listeners if participant changed
                if (participant !== newParams.participant) {
                    participant.off(RoomEvent.TrackSubscribed, updateInternal);
                    participant.off(
                        RoomEvent.TrackUnsubscribed,
                        updateInternal,
                    );
                    participant.off(RoomEvent.TrackMuted, updateInternal);
                    participant.off(RoomEvent.TrackUnmuted, updateInternal);
                    participant.off(
                        RoomEvent.LocalTrackPublished,
                        updateInternal,
                    );

                    participant = newParams.participant;

                    participant.on(RoomEvent.TrackSubscribed, updateInternal);
                    participant.on(RoomEvent.TrackUnsubscribed, updateInternal);
                    participant.on(RoomEvent.TrackMuted, updateInternal);
                    participant.on(RoomEvent.TrackUnmuted, updateInternal);
                    participant.on(
                        RoomEvent.LocalTrackPublished,
                        updateInternal,
                    );
                }

                source = newParams.source;
                isLocal = newParams.isLocal;
                updateInternal();
            },
            destroy() {
                participant.off(RoomEvent.TrackSubscribed, updateInternal);
                participant.off(RoomEvent.TrackUnsubscribed, updateInternal);
                participant.off(RoomEvent.TrackMuted, updateInternal);
                participant.off(RoomEvent.TrackUnmuted, updateInternal);
                participant.off(RoomEvent.LocalTrackPublished, updateInternal);

                if (attachedTrack) {
                    attachedTrack.detach();
                }
            },
        };
    }

    function setupEventListeners() {
        if (!room) return;

        log("Setting up room event listeners");

        room.on(RoomEvent.ParticipantConnected, (p) => {
            log(`Participant connected: ${p.identity} (${p.name || "Guest"})`);
            updateParticipantsList();

            // Play join sound
            if (joinSound) {
                joinSound
                    .play()
                    .catch((e) =>
                        log(`Failed to play join sound: ${e.message}`, "warn"),
                    );
            }

            // If we are admin and E2EE is on, send a sync message to the new joiner
            if (
                roomDetails &&
                room?.localParticipant?.identity === roomDetails.adminId &&
                isE2EEEnabled
            ) {
                const data = JSON.stringify({
                    type: "e2ee-sync",
                    enabled: isE2EEEnabled,
                });
                room.localParticipant
                    .publishData(new TextEncoder().encode(data), {
                        reliable: true,
                        destinationIdentities: [p.identity],
                    })
                    .catch((e) =>
                        log(
                            `Failed to sync E2EE with joiner: ${e.message}`,
                            "warn",
                        ),
                    );
            }
        });

        room.on(RoomEvent.ParticipantDisconnected, (p) => {
            log(`Participant disconnected: ${p.identity}`);

            // Clean up audio element for disconnected participant
            const audioElement = document.getElementById(`audio-${p.identity}`);
            if (audioElement) {
                audioElement.remove();
                log(
                    `Cleaned up audio element for disconnected participant ${p.identity}`,
                );
            }

            updateParticipantsList();

            // Play leave sound
            if (leaveSound) {
                leaveSound
                    .play()
                    .catch((e) =>
                        log(`Failed to play leave sound: ${e.message}`, "warn"),
                    );
            }
        });

        room.on(RoomEvent.TrackPublished, (pub, p) => {
            log(`Track published: ${pub.source} by ${p.identity}`);
            updateParticipantsList();
        });

        room.on(RoomEvent.TrackUnpublished, (pub, p) => {
            log(`Track unpublished: ${pub.source} by ${p.identity}`);
            updateParticipantsList();
        });

        room.on(RoomEvent.TrackSubscribed, (track, pub, p) => {
            log(`Track subscribed: ${pub.source} from ${p.identity}`);

            // Attach remote audio tracks to the DOM so they can be heard
            if (
                track.kind === Track.Kind.Audio &&
                p.identity !== room?.localParticipant?.identity
            ) {
                const audioElement = track.attach();
                audioElement.id = `audio-${p.identity}`;
                audioElement.autoplay = true;
                audioElement.volume = 1.0;
                // Remove any existing audio element for this participant
                const existing = document.getElementById(`audio-${p.identity}`);
                if (existing) {
                    existing.remove();
                }
                document.body.appendChild(audioElement);
                log(`Attached audio element for ${p.identity}`);

                // Force play in case autoplay was blocked
                audioElement.play().catch((e) => {
                    log(
                        `Audio autoplay prevented for ${p.identity}: ${e.message}`,
                        "warn",
                    );
                });
            }

            updateParticipantsList();
        });

        room.on(RoomEvent.TrackUnsubscribed, (track, pub, p) => {
            log(`Track unsubscribed: ${pub.source} from ${p.identity}`);

            // Clean up remote audio elements when track is unsubscribed
            if (track.kind === Track.Kind.Audio) {
                track.detach();
                const audioElement = document.getElementById(
                    `audio-${p.identity}`,
                );
                if (audioElement) {
                    audioElement.remove();
                    log(`Removed audio element for ${p.identity}`);
                }
            }

            updateParticipantsList();
        });

        room.on(RoomEvent.TrackMuted, (pub, p) => {
            updateParticipantsList();
        });

        room.on(RoomEvent.TrackUnmuted, (pub, p) => {
            updateParticipantsList();
        });

        room.on(
            RoomEvent.ParticipantEncryptionStatusChanged,
            (enabled: boolean, p?: Participant) => {
                if (p === room?.localParticipant) {
                    isE2EEEnabled = enabled;
                }
                log(
                    `E2EE status for ${p?.identity || "unknown"}: ${enabled ? "Encrypted" : "Unencrypted"}`,
                );
            },
        );

        room.on(RoomEvent.EncryptionError, (error: Error) => {
            log(`CRITICAL E2EE ERROR: ${error.message}`, "error");
        });

        room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
            if (!room) return;
            log(
                `Audio playback status: ${room.canPlaybackAudio ? "Allowed" : "BLOCKED"}`,
            );
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
            // Update levels for reactive UI
            participants.forEach((p) => {
                const level = p.audioLevel;
                audioLevels.set(p.identity, level);

                if (level > AUDIO_THRESHOLD_UI) {
                    recentlyTalking.set(p.identity, true);
                    if (talkingTimeouts.has(p.identity)) {
                        clearTimeout(talkingTimeouts.get(p.identity));
                    }
                    const timeout = setTimeout(() => {
                        recentlyTalking.set(p.identity, false);
                        recentlyTalking = new Map(recentlyTalking);
                    }, 2000);
                    talkingTimeouts.set(p.identity, timeout);
                }
            });

            if (room?.localParticipant) {
                const level = room.localParticipant.audioLevel;
                localAudioLevel = level;
                audioLevels.set(room.localParticipant.identity, level);

                if (level > AUDIO_THRESHOLD_UI) {
                    const id = room.localParticipant.identity;
                    recentlyTalking.set(id, true);
                    if (talkingTimeouts.has(id)) {
                        clearTimeout(talkingTimeouts.get(id));
                    }
                    const timeout = setTimeout(() => {
                        recentlyTalking.set(id, false);
                        recentlyTalking = new Map(recentlyTalking);
                    }, 2000);
                    talkingTimeouts.set(id, timeout);
                }
            }

            audioLevels = new Map(audioLevels);
            recentlyTalking = new Map(recentlyTalking);
        });

        room.on(RoomEvent.LocalTrackPublished, (pub) => {
            if (pub.source === Track.Source.Microphone) {
                updateDevices();
            }
        });

        room.on(RoomEvent.MediaDevicesChanged, updateDevices);

        room.on(RoomEvent.Reconnecting, () => {
            log("Room reconnecting...");
            isLoading = true;
        });

        room.on(RoomEvent.Reconnected, () => {
            log("Room reconnected");
            isLoading = false;
            updateParticipantsList();
        });

        room.on(RoomEvent.MediaDevicesError, (error: Error) => {
            const isNotFound =
                error.name === "NotFoundError" ||
                error.message?.toLowerCase().includes("not found") ||
                error.message?.toLowerCase().includes("device not found");

            if (isNotFound) {
                log("Selected media device not found", "warn");
            } else {
                log(`Media device error: ${error.message}`, "error");
            }
        });

        room.on(RoomEvent.DataReceived, (payload, participant) => {
            handleDataReceived(payload, participant);
        });
    }

    async function updateLayout(
        layout: "grid" | "stage",
        participantIdentity: string | null = null,
    ) {
        if (!room?.localParticipant) return;
        if (roomDetails?.adminId !== room.localParticipant.identity) {
            log("Only admins can update layout");
            return;
        }

        const data = {
            type: "layout-update",
            layout,
            participantIdentity,
        };

        try {
            const encoder = new TextEncoder();
            const payload = encoder.encode(JSON.stringify(data));
            await room.localParticipant.publishData(payload, {
                reliable: true,
            });

            // Update local state too
            activeLayout = layout;
            stageParticipantIdentity = participantIdentity;
            log(
                `Layout update sent: ${layout} focused on ${participantIdentity}`,
            );
        } catch (error: any) {
            log(`Failed to publish layout update: ${error.message}`);
        }
    }

    function updateParticipantsList() {
        if (!room || room.state !== "connected") return;

        // Get remote participants
        const remotes = Array.from(room.remoteParticipants.values());
        participants = remotes;

        // Sync local share state
        isLocalScreenSharing = room.localParticipant.isScreenShareEnabled;

        // Update reactive statuses for UI icons
        const newStatuses = new Map();

        // Include local
        newStatuses.set(room.localParticipant.identity, {
            audio: room.localParticipant.isMicrophoneEnabled,
            video: room.localParticipant.isCameraEnabled,
            screen: room.localParticipant.isScreenShareEnabled,
        });

        remotes.forEach((p) => {
            newStatuses.set(p.identity, {
                audio: p.isMicrophoneEnabled,
                video: p.isCameraEnabled,
                screen: p.isScreenShareEnabled,
            });
        });

        participantStatuses = newStatuses;
    }

    let gridTiles = $derived.by(() => {
        const tiles: GridTile[] = [];

        if (room?.localParticipant) {
            const localName = room.localParticipant.name;
            // Local Camera
            tiles.push({
                id: "local-camera",
                participant: room.localParticipant,
                type: "camera",
                isLocal: true,
                displayName: localName ? `${localName} (You)` : "You",
            });

            // Local Screen
            if (isLocalScreenSharing) {
                tiles.push({
                    id: "local-screen",
                    participant: room.localParticipant,
                    type: "screen",
                    isLocal: true,
                    displayName: `Your Screen`,
                });
            }
        }

        participants.forEach((p) => {
            const pName = p.name || p.identity;
            // Remote Camera
            tiles.push({
                id: `${p.identity}-camera`,
                participant: p,
                type: "camera",
                isLocal: false,
                displayName: pName,
            });

            // Remote Screen
            if (p.isScreenShareEnabled) {
                tiles.push({
                    id: `${p.identity}-screen`,
                    participant: p,
                    type: "screen",
                    isLocal: false,
                    displayName: `${pName}'s Screen`,
                });
            }
        });

        return tiles;
    });

    let stageTile = $derived.by(() => {
        if (activeLayout !== "stage" || !stageParticipantIdentity) return null;
        return gridTiles.find(
            (t) =>
                t.participant.identity === stageParticipantIdentity &&
                t.type === "camera",
        );
    });

    let nonStageTiles = $derived.by(() => {
        if (activeLayout !== "stage" || !stageParticipantIdentity)
            return gridTiles;
        return gridTiles.filter((t) => t.id !== stageTile?.id);
    });

    let screenTiles = $derived(gridTiles.filter((t) => t.type === "screen"));
    let cameraTiles = $derived(gridTiles.filter((t) => t.type === "camera"));
    let isPresentationActive = $derived(screenTiles.length > 0);

    onMount(async () => {
        // LiveKit logging is now managed by initLiveKitLogging() utility

        // Initialize sound
        messageSound = new Audio("/new-message-sound.mp3");
        messageSound.volume = 0.5;

        joinSound = new Audio("/join-sound.mp3");
        joinSound.volume = 0.4;

        leaveSound = new Audio("/leave-sound.mp3");
        leaveSound.volume = 0.4;

        // Load guest profile if exists
        const profile = await getGuestProfile();
        if (profile) {
            guestName = profile.name;
            guestAvatar = profile.avatar || null;
        }

        // Check User
        if (!$userStore) {
            isLoading = false;
            showGuestForm = true;
            return;
        }

        await initMeeting();
    });

    async function handleGuestJoin() {
        if (!guestName.trim()) return;

        isGuestJoining = true;
        try {
            const response = await guestLoginAPI({ name: guestName });
            if (response.tokens && response.user) {
                authStore.setTokens(response.tokens, false);
                userStore.set(response.user, false);
                showGuestForm = false;

                // Save to IndexedDB
                await saveGuestProfile({
                    name: guestName.trim(),
                    avatar: guestAvatar || undefined,
                });

                await initMeeting();
            }
        } catch (err: any) {
            error = err.message || "Guest login failed";
        } finally {
            isGuestJoining = false;
        }
    }

    async function initMeeting() {
        // Check the params
        if (!$page.params.meetId) {
            goto("/404");
            return;
        }

        // Try to join the meeting
        isLoading = true;

        try {
            const joinRoomResp = await joinRoomAPI({
                roomName: $page.params.meetId,
            });

            roomDetails = joinRoomResp;
            log(`Room Admin ID: ${roomDetails.adminId}`);

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
            keyProvider = new ExternalE2EEKeyProvider();
            const roomConfig: RoomOptions = {
                adaptiveStream: true,
                dynacast: true,
                audioCaptureDefaults: {
                    noiseSuppression: true,
                    autoGainControl: true,
                    echoCancellation: true,
                },
                e2ee: {
                    keyProvider: keyProvider,
                    worker: new Worker(
                        new URL("livekit-client/e2ee-worker", import.meta.url),
                        { type: "module" },
                    ),
                },
            };
            room = new Room(roomConfig);
            setupEventListeners();

            // Connect to the room
            // Connect to the room
            log("Starting connectToRoom call...");

            // Auto-enable E2EE if the room settings specify it
            if (roomDetails?.settings?.e2ee) {
                log("Room settings specify E2EE, pre-setting key...");
                try {
                    const sharedSecret = `bedrud-secure-${$page.params.meetId}`;
                    await keyProvider.setKey(sharedSecret);
                    log("Encryption key set successfully before connection");
                } catch (err: any) {
                    log(`Failed to pre-set E2EE key: ${err.message}`, "error");
                }
            }

            await connectToRoom(
                room,
                joinRoomResp.token,
                joinRoomResp.livekitHost,
            );

            // Activate E2EE locally if specified
            if (roomDetails?.settings?.e2ee) {
                log("Activating E2EE after connection...");
                try {
                    await toggleE2EE(true, true); // Treat as sync since we just joined and set key
                } catch (err: any) {
                    log(
                        `CRITICAL: Failed to enable E2EE: ${err.message}`,
                        "error",
                    );
                    error =
                        "Security activation failed. This meeting requires End-to-End Encryption which could not be activated.";
                    isLoading = false;
                    await room.disconnect();
                    return;
                }
            }

            // Ensure audio is allowed to play
            log("Attempting to start audio playback...");
            try {
                await room.startAudio();
                log("Audio playback started/confirmed");
            } catch (err) {
                log("Audio start failed (expected if no gesture yet)");
            }

            // Update local participant reference
            localParticipant = room?.localParticipant || null;
            log(
                `Local participant identified: ${localParticipant?.identity || "unknown"}`,
            );

            // Advertise name and avatar from IndexedDB if not set (or for guests)
            if (localParticipant) {
                const profile = await getGuestProfile();

                if (!localParticipant.name && profile?.name) {
                    try {
                        log(
                            `Setting participant name from profile: ${profile.name}`,
                        );
                        await localParticipant.setName(profile.name);
                        log(`Successfully set name: ${profile.name}`);
                    } catch (e: any) {
                        log(`Failed to advertise name: ${e.message}`, "warn");
                    }
                }

                if (profile?.avatar) {
                    try {
                        log(
                            `Avatar found in profile (Size: ${profile.avatar.length} bytes)`,
                        );
                        if (profile.avatar.length > 10000) {
                            log(
                                "Avatar too large for LiveKit metadata (>10KB), skipping. Please re-upload.",
                                "warn",
                            );
                        } else {
                            log("Applying avatar metadata...");
                            await localParticipant.setMetadata(
                                JSON.stringify({ avatar: profile.avatar }),
                            );
                            log("Avatar metadata applied successfully");
                        }
                    } catch (e: any) {
                        log(`Failed to advertise avatar: ${e.message}`, "warn");
                    }
                }
            }

            if (localParticipant) {
                // Initialize local UI state from participant state
                audioEnabled = localParticipant.isMicrophoneEnabled;
                videoEnabled = localParticipant.isCameraEnabled;

                const onLocalUpdate = () => {
                    if (!room?.localParticipant) return;
                    audioEnabled = room.localParticipant.isMicrophoneEnabled;
                    videoEnabled = room.localParticipant.isCameraEnabled;
                    updateParticipantsList();
                };

                localParticipant.on("trackMuted", onLocalUpdate);
                localParticipant.on("trackUnmuted", onLocalUpdate);
                localParticipant.on("localTrackPublished", onLocalUpdate);
                localParticipant.on("localTrackUnpublished", onLocalUpdate);
            }

            connectionError = null;

            // Initial list sync
            updateParticipantsList();
            updateDevices(); // Initial device list

            // Refresh metadata after short delays to handle async sync transitions
            setTimeout(updateParticipantsList, 1000);
            setTimeout(updateParticipantsList, 3000);

            // Setup local media after connection
            const storedDontAskAgain =
                localStorage.getItem("bedrud_dont_ask_permissions") === "true";
            if (storedDontAskAgain) {
                dontAskAgain = true;
                joinWithCamera =
                    localStorage.getItem("bedrud_join_with_camera") === "true";
                joinWithMic =
                    localStorage.getItem("bedrud_join_with_mic") !== "false"; // Default to true if not set
                log(
                    "Skipping permission request due to 'dontAskAgain' setting",
                );
                requestMediaPermissions();
            } else {
                log("Showing permission request before media setup...");
                isLoading = false;
                showPermissionRequest = true;
            }
        } catch (err: any) {
            console.error("Failed to setup meeting:", err);
            error = err.message || "Failed to join meeting";
            isLoading = false;
        }
    }

    onDestroy(() => {
        if (room) {
            // Clean up all audio elements created for remote participants
            document.querySelectorAll('audio[id^="audio-"]').forEach((el) => {
                el.remove();
            });

            room.disconnect();
            log("Disconnected from room");
        }
    });

    async function resumeAudio() {
        if (!room) return;
        try {
            await room.startAudio();
            log("Room audio playback resumed");
            // Double check all attached elements
            const mediaElements = document.querySelectorAll("audio, video");
            mediaElements.forEach((el) => {
                if (el instanceof HTMLMediaElement && !el.muted) {
                    el.play().catch(() => {});
                }
            });
        } catch (err: any) {
            log(`Failed to resume audio: ${err.message}`);
        }
    }

    function handleRetry() {
        // Refresh the page to retry connection
        window.location.reload();
    }

    async function kickParticipant(identity: string) {
        if (!roomDetails) return;
        try {
            await kickParticipantAPI(roomDetails.id, identity);
            log(`Kicked participant: ${identity}`);
        } catch (err: any) {
            log(`Failed to kick: ${err.message}`, "error");
        }
    }

    async function muteParticipant(identity: string) {
        if (!roomDetails) return;
        try {
            await muteParticipantAPI(roomDetails.id, identity);
            log(`Muted participant: ${identity}`);
        } catch (err: any) {
            log(`Failed to mute: ${err.message}`, "error");
        }
    }

    async function disableVideo(identity: string) {
        if (!roomDetails) return;
        try {
            await disableParticipantVideoAPI(roomDetails.id, identity);
            log(`Disabled video for participant: ${identity}`);
        } catch (err: any) {
            log(`Failed to disable video: ${err.message}`, "error");
        }
    }

    async function toggleE2EE(enabled: boolean, isSync = false) {
        if (!room || !keyProvider || isTogglingE2EE) return;
        if (isE2EEEnabled === enabled && !isSync) return;

        isTogglingE2EE = true;
        try {
            log(
                `Toggling E2EE to ${enabled ? "ENABLED" : "DISABLED"} (Sync: ${isSync})`,
            );

            // Persist to backend FIRST if admin AND not a sync from another user
            if (
                !isSync &&
                roomDetails &&
                room?.localParticipant?.identity === roomDetails.adminId
            ) {
                const newSettings = {
                    ...roomDetails.settings,
                    e2ee: enabled,
                };
                await updateRoomSettingsAPI(roomDetails.id, newSettings);
                roomDetails.settings = newSettings;
                log("Room E2EE settings persisted to backend");

                // Notify others to sync their E2EE state
                const data = JSON.stringify({
                    type: "e2ee-sync",
                    enabled: enabled,
                });
                await room.localParticipant.publishData(
                    new TextEncoder().encode(data),
                    {
                        reliable: true,
                    },
                );
                log(`Sent E2EE sync message to participants: ${enabled}`);
            }

            if (enabled) {
                const sharedSecret = `bedrud-secure-${$page.params.meetId}`;
                log("Setting encryption key...");
                await keyProvider.setKey(sharedSecret);
                // Give the worker a moment to process the key
                await new Promise((resolve) => setTimeout(resolve, 1000));
                log("Encryption key set and worker stabilized");
            }

            log(`Calling room.setE2EEEnabled(${enabled})...`);
            await room.setE2EEEnabled(enabled);
            isE2EEEnabled = enabled;
            log(`End-to-End Encryption ${enabled ? "enabled" : "disabled"}`);
        } catch (err: any) {
            log(`Failed to toggle E2EE: ${err.message}`, "error");
            throw err;
        } finally {
            isTogglingE2EE = false;
        }
    }

    async function requestMediaPermissions() {
        if (!room) return;
        showPermissionRequest = false;
        isLoading = true;

        log(`Checking room state for media setup: ${room.state}`);
        if (room.state === "connected") {
            // Check available devices first if possible
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideo = devices.some((d) => d.kind === "videoinput");
            const hasAudio = devices.some((d) => d.kind === "audioinput");

            log(`Devices found - Video: ${hasVideo}, Audio: ${hasAudio}`);

            // Enable Camera (only if user opted in)
            if (hasVideo && joinWithCamera) {
                try {
                    log("Enabling camera...");
                    await room.localParticipant.setCameraEnabled(true);
                    log("Camera enabled successfully");
                } catch (cameraError: any) {
                    log(`Camera error: ${cameraError.message}`, "warn");
                }
            } else if (!joinWithCamera) {
                log("User opted to join without camera");
            } else {
                log("No camera found, skipping camera enablement");
            }

            // Enable Microphone (only if user opted in)
            if (hasAudio && joinWithMic) {
                try {
                    log("Enabling microphone...");
                    await room.localParticipant.setMicrophoneEnabled(true);
                    log("Microphone enabled successfully");
                } catch (micError: any) {
                    log(`Microphone error: ${micError.message}`, "warn");
                }
            } else if (!joinWithMic) {
                log("User opted to join without microphone");
            } else {
                log("No microphone found, skipping microphone enablement");
            }

            // Save preferences if 'Don't ask again' is checked
            if (dontAskAgain) {
                localStorage.setItem("bedrud_dont_ask_permissions", "true");
                localStorage.setItem(
                    "bedrud_join_with_camera",
                    joinWithCamera.toString(),
                );
                localStorage.setItem(
                    "bedrud_join_with_mic",
                    joinWithMic.toString(),
                );
                log("Saved permission preferences to localStorage");
            } else {
                localStorage.removeItem("bedrud_dont_ask_permissions");
            }

            // Sync UI state
            audioEnabled = room.localParticipant.isMicrophoneEnabled;
            videoEnabled = room.localParticipant.isCameraEnabled;
            updateParticipantsList();
        } else {
            log(`Cannot setup media: Room state is ${room.state}`);
            connectionError = "Connection lost before media setup";
            isLoading = false;
            return;
        }

        isLoading = false;
    }
</script>

{#snippet tileSnippet(tile: GridTile)}
    <div
        class="participant-video overflow-hidden relative group transition-all duration-75
               {isMobile
            ? 'bg-gray-950 rounded-xl border border-white/5'
            : 'bg-gray-900 rounded-2xl border-2 shadow-2xl border-transparent shadow-black/50'}"
        style="
            border-color: {(audioLevels.get(tile.participant.identity) || 0) >
        AUDIO_THRESHOLD_UI
            ? `rgba(37, 99, 235, ${Math.min(1, 0.4 + (audioLevels.get(tile.participant.identity) || 0) * 2)})`
            : 'transparent'};
            box-shadow: {(audioLevels.get(tile.participant.identity) || 0) >
        AUDIO_THRESHOLD_UI
            ? `0 0 ${10 + (audioLevels.get(tile.participant.identity) || 0) * 40}px -3px rgba(37, 99, 235, ${Math.min(0.6, 0.3 + (audioLevels.get(tile.participant.identity) || 0) * 2)})`
            : 'none'};
            transform: {(audioLevels.get(tile.participant.identity) || 0) >
        AUDIO_THRESHOLD_UI
            ? `scale(${1 + (audioLevels.get(tile.participant.identity) || 0) * 0.05})`
            : 'scale(1)'};
        "
    >
        <!-- Dynamic Background (Deterministic Color Based on Identity) -->
        {#if tile.type === "camera" && participantStatuses.get(tile.participant.identity)?.video === false}
            {@const themeColor = getParticipantColor(tile.participant.identity)}
            <div
                class="absolute inset-0 transition-colors duration-1000"
                style="background: radial-gradient(circle at center, {themeColor}, #0a0a0a);"
            ></div>
            <!-- Subtle Overlay for depth -->
            <div class="absolute inset-0 bg-black/20 pointer-events-none"></div>
        {/if}

        {#if (audioLevels.get(tile.participant.identity) || 0) > AUDIO_THRESHOLD_UI}
            <div
                class="absolute inset-0 bg-blue-500/10 pointer-events-none"
            ></div>
        {/if}

        <!-- Video Track Container -->
        <div
            use:attachTrack={{
                participant: tile.participant,
                source:
                    tile.type === "camera"
                        ? Track.Source.Camera
                        : Track.Source.ScreenShare,
                isLocal: tile.isLocal,
            }}
            class="w-full h-full object-cover"
            class:opacity-10={tile.type === "camera" &&
                participantStatuses.get(tile.participant.identity)?.video ===
                    false}
            class:grayscale={tile.type === "camera" &&
                participantStatuses.get(tile.participant.identity)?.video ===
                    false}
            class:blur-xl={tile.type === "camera" &&
                participantStatuses.get(tile.participant.identity)?.video ===
                    false}
        ></div>

        <!-- Video Off Overlay -->
        {#if tile.type === "camera" && participantStatuses.get(tile.participant.identity)?.video === false}
            <div
                class="absolute inset-0 flex flex-col items-center justify-center transition-all duration-500"
            >
                <div
                    class="relative flex flex-col items-center {isMobile
                        ? 'scale-90'
                        : 'scale-110'}"
                >
                    <ParticipantAvatar
                        participant={tile.participant}
                        audioLevel={audioLevels.get(
                            tile.participant.identity,
                        ) || 0}
                        recentlyTalking={recentlyTalking.get(
                            tile.participant.identity,
                        ) || false}
                        {isMobile}
                        displayName={tile.displayName}
                        threshold={AUDIO_THRESHOLD_UI}
                    />
                </div>
            </div>
        {/if}

        <!-- Status Icons -->
        <div class="absolute top-4 right-4 flex items-center gap-2">
            {#if tile.type === "camera"}
                {#if participantStatuses.get(tile.participant.identity)?.audio === false}
                    <div
                        class="p-2 bg-red-500 rounded-xl shadow-lg border border-red-400/50 backdrop-blur-md"
                    >
                        <MicOff class="h-4 w-4 text-white" />
                    </div>
                {/if}
            {/if}
            {#if tile.type === "screen"}
                <div
                    class="p-2 bg-blue-600 rounded-xl shadow-lg border border-blue-400/50 backdrop-blur-md"
                >
                    <ScreenShare class="h-4 w-4 text-white" />
                </div>
            {/if}
        </div>

        <!-- Nameplate -->
        <div
            class="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none"
        >
            <div
                class="{isMobile
                    ? 'bg-black/40 px-3 py-1 rounded-lg text-xs'
                    : 'bg-black/40 backdrop-blur-xl px-3.5 py-2 rounded-2xl text-[13px] font-bold'} text-white border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-2"
            >
                {#if roomDetails?.adminId === tile.participant.identity}
                    <Crown
                        class="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0"
                    />
                {/if}
                <span class="truncate max-w-[120px]">{tile.displayName}</span>
                {#if participantStatuses.get(tile.participant.identity)?.audio === false}
                    <MicOff class="h-3.5 w-3.5 text-red-500" />
                {/if}
            </div>
        </div>
    </div>
{/snippet}

{#if showGuestForm}
    <div class="h-screen flex items-center justify-center bg-background">
        <Card.Root class="w-[400px]">
            <Card.Header>
                <Card.Title>Join Meeting</Card.Title>
                <Card.Description>
                    Enter your name to join the meeting.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="grid w-full items-center gap-6">
                    <div class="flex flex-col items-center gap-4">
                        <button
                            class="relative group w-24 h-24 rounded-full overflow-hidden transition-all hover:ring-4 hover:ring-primary/20"
                            onclick={() => avatarInput?.click()}
                        >
                            {#if guestAvatar}
                                <img
                                    src={guestAvatar}
                                    alt="Avatar"
                                    class="w-full h-full object-cover"
                                />
                            {:else}
                                <div
                                    class="w-full h-full bg-muted flex items-center justify-center"
                                >
                                    <Camera
                                        class="w-8 h-8 text-muted-foreground"
                                    />
                                </div>
                            {/if}
                            <div
                                class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span class="text-white text-xs font-bold"
                                    >Change</span
                                >
                            </div>
                        </button>
                    </div>

                    <div class="flex flex-col space-y-1.5">
                        <Label for="name">Your Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter your display name"
                            bind:value={guestName}
                            onkeydown={(e: KeyboardEvent) =>
                                e.key === "Enter" && handleGuestJoin()}
                        />
                    </div>
                </div>
            </Card.Content>
            <Card.Footer class="flex justify-between">
                <Button variant="outline" onclick={() => goto("/")}>
                    Cancel
                </Button>
                <Button
                    onclick={handleGuestJoin}
                    disabled={!guestName.trim() || isGuestJoining}
                >
                    {#if isGuestJoining}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    Join Meeting
                </Button>
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
{:else if showPermissionRequest}
    <div class="h-screen flex items-center justify-center bg-background">
        <Card.Root class="w-[450px]">
            <Card.Header>
                <Card.Title>Camera & Microphone Access</Card.Title>
                <Card.Description>
                    To join the meeting, we need access to your camera and
                    microphone.
                </Card.Description>
            </Card.Header>
            <Card.Content class="flex flex-col items-center gap-6 py-8">
                <div class="flex gap-4">
                    <div class="p-4 bg-primary/10 rounded-full">
                        <Video class="w-8 h-8 text-primary" />
                    </div>
                    <div class="p-4 bg-primary/10 rounded-full">
                        <Mic class="w-8 h-8 text-primary" />
                    </div>
                </div>
                <p class="text-center text-sm text-muted-foreground">
                    Your browser will prompt you for access. Please select
                    "Allow" to continue.
                </p>

                <!-- Join preferences -->
                <div class="w-full space-y-3 pt-2 border-t border-border">
                    <p class="text-xs text-muted-foreground text-center">
                        Join preferences
                    </p>
                    <div class="flex flex-col gap-3">
                        <label
                            class="flex items-center gap-3 cursor-pointer group"
                        >
                            <Checkbox bind:checked={joinWithCamera} />
                            <div class="flex items-center gap-2">
                                <Video
                                    class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
                                />
                                <span
                                    class="text-sm text-muted-foreground group-hover:text-foreground transition-colors"
                                    >Start with camera on</span
                                >
                            </div>
                        </label>
                        <label
                            class="flex items-center gap-3 cursor-pointer group"
                        >
                            <Checkbox bind:checked={joinWithMic} />
                            <div class="flex items-center gap-2">
                                <Mic
                                    class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
                                />
                                <span
                                    class="text-sm text-muted-foreground group-hover:text-foreground transition-colors"
                                    >Start with microphone on</span
                                >
                            </div>
                        </label>
                        <div class="pt-2 border-t border-border/50">
                            <label
                                class="flex items-center gap-3 cursor-pointer group"
                            >
                                <Checkbox bind:checked={dontAskAgain} />
                                <div class="flex items-center gap-2">
                                    <span
                                        class="text-xs font-bold text-blue-600 uppercase tracking-tighter"
                                        >Don't ask again</span
                                    >
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </Card.Content>
            <Card.Footer class="flex justify-center">
                <Button class="w-full" onclick={requestMediaPermissions}>
                    Allow and Join
                </Button>
            </Card.Footer>
        </Card.Root>
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
    <div class="h-screen flex flex-col bg-background">
        {#if !isMobile}
            <!-- Desktop Header - Exactly as before -->
            <div
                class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
                <div class="flex h-14 items-center px-4 justify-between">
                    <div class="flex items-center gap-4 overflow-hidden">
                        <h1 class="font-semibold truncate">
                            {$page.params.meetId}
                        </h1>
                        <div
                            class="flex items-center gap-1.5 text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border"
                        >
                            <Users class="h-3 w-3" />
                            <span class="text-[11px] font-bold leading-none"
                                >{participants.length + 1}</span
                            >
                        </div>

                        <button
                            onclick={() => (isEncryptionModalOpen = true)}
                            class="flex items-center gap-1.5 px-2 py-1 rounded-full transition-all hover:scale-105 active:scale-95 {isE2EEEnabled
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}"
                        >
                            {#if isE2EEEnabled}
                                <ShieldCheck class="h-3 w-3" />
                                <span
                                    class="text-[10px] font-bold uppercase tracking-wider"
                                    >Secure</span
                                >
                            {:else}
                                <ShieldAlert class="h-3 w-3" />
                                <span
                                    class="text-[10px] font-bold uppercase tracking-wider"
                                    >Standard</span
                                >
                            {/if}
                        </button>
                    </div>

                    <div class="flex items-center gap-3">
                        {#if room && !room.canPlaybackAudio}
                            <Button
                                variant="destructive"
                                size="sm"
                                onclick={resumeAudio}
                            >
                                <MicOff class="h-4 w-4 mr-2" /> Resume Audio
                            </Button>
                        {/if}

                        {#if currentUser}
                            <button
                                class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 hover:border-primary/50 active:scale-95"
                                onclick={() => {
                                    isSettingsOpen = true;
                                    settingsTab = "general";
                                    tempDisplayName = currentUser?.name || "";
                                    updateDevices();
                                }}
                            >
                                {#if currentUser.avatarUrl}
                                    <img
                                        src={currentUser.avatarUrl}
                                        alt={currentUser.name}
                                        class="w-full h-full object-cover"
                                    />
                                {:else}
                                    <div
                                        class="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold"
                                    >
                                        {currentUser.name
                                            ?.charAt(0)
                                            .toUpperCase()}
                                    </div>
                                {/if}
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}

        <div class="flex-1 flex overflow-hidden bg-gray-950">
            <div class="flex-1 flex flex-col min-w-0 relative">
                {#if room}
                    <div class="flex-1 flex overflow-hidden">
                        {#if isPresentationActive}
                            <PresentationLayout
                                {screenTiles}
                                {cameraTiles}
                                {tileSnippet}
                                {audioLevels}
                                {participantStatuses}
                                isAdmin={roomDetails?.adminId ===
                                    localParticipant?.identity}
                                onFocus={(identity) =>
                                    updateLayout("stage", identity)}
                                {getParticipantAvatar}
                                {AUDIO_THRESHOLD_UI}
                            />
                        {:else if activeLayout === "stage" && stageTile}
                            <StageLayout
                                {stageTile}
                                {nonStageTiles}
                                {tileSnippet}
                                {audioLevels}
                                {participantStatuses}
                                isAdmin={roomDetails?.adminId ===
                                    localParticipant?.identity}
                                onFocus={(identity) =>
                                    updateLayout("stage", identity)}
                                {attachTrack}
                                {getParticipantAvatar}
                                {AUDIO_THRESHOLD_UI}
                            />
                        {:else}
                            <GridLayout tiles={gridTiles} {tileSnippet} />
                        {/if}
                    </div>
                {/if}

                {#if isMobile}
                    <!-- Mobile Control Overlay (Floating Pill) -->
                    <div
                        class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl z-50 overflow-x-auto max-w-[95vw] no-scrollbar"
                    >
                        <Button
                            variant={audioEnabled ? "ghost" : "destructive"}
                            size="icon"
                            onclick={toggleMic}
                            class="h-10 w-10 sm:h-11 sm:w-11 rounded-full text-white shrink-0"
                        >
                            {#if audioEnabled}
                                <Mic class="h-4 w-4 sm:h-5 sm:w-5" />
                            {:else}
                                <MicOff class="h-4 w-4 sm:h-5 sm:w-5" />
                            {/if}
                        </Button>
                        <Button
                            variant={videoEnabled ? "ghost" : "destructive"}
                            size="icon"
                            onclick={toggleVideo}
                            class="h-10 w-10 sm:h-11 sm:w-11 rounded-full text-white shrink-0"
                        >
                            {#if videoEnabled}
                                <Video class="h-4 w-4 sm:h-5 sm:w-5" />
                            {:else}
                                <VideoOff class="h-4 w-4 sm:h-5 sm:w-5" />
                            {/if}
                        </Button>
                        <Button
                            variant={isLocalScreenSharing
                                ? "secondary"
                                : "ghost"}
                            size="icon"
                            onclick={toggleScreenShare}
                            class="h-10 w-10 sm:h-11 sm:w-11 rounded-full text-white shrink-0"
                        >
                            <ScreenShare class="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Button
                            variant={isParticipantsOpen ? "secondary" : "ghost"}
                            size="icon"
                            onclick={() => {
                                isParticipantsOpen = !isParticipantsOpen;
                                if (isParticipantsOpen) isChatOpen = false;
                            }}
                            class="h-10 w-10 sm:h-11 sm:w-11 rounded-full text-white shrink-0"
                        >
                            <Users class="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Button
                            variant={isChatOpen ? "secondary" : "ghost"}
                            size="icon"
                            onclick={() => {
                                isChatOpen = !isChatOpen;
                                if (isChatOpen) isParticipantsOpen = false;
                            }}
                            class="h-10 w-10 sm:h-11 sm:w-11 rounded-full text-white shrink-0"
                        >
                            <MessageCircle class="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onclick={() => (isSettingsOpen = true)}
                            class="h-10 w-10 sm:h-11 sm:w-11 rounded-full text-white shrink-0"
                        >
                            <Settings class="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <div class="w-px h-6 bg-white/20 mx-0.5 shrink-0"></div>
                        <Button
                            variant="destructive"
                            size="icon"
                            onclick={leaveMeeting}
                            class="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0"
                        >
                            <LogOut class="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>
                {/if}
            </div>

            <!-- Sidebars Container -->
            <div
                class="{sidebarMode === 'push' && !isMobile
                    ? 'relative border-l border-white/5 bg-background shadow-2xl shrink-0'
                    : 'fixed inset-0 z-[100]'} 
                       {isChatOpen || isParticipantsOpen
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'}
                       flex justify-end overflow-hidden transition-all duration-300 ease-in-out"
                style={sidebarMode === "push" && !isMobile
                    ? `width: ${isChatOpen || isParticipantsOpen ? "360px" : "0px"}`
                    : ""}
            >
                <!-- Inner Sliding Content -->
                <div
                    class="w-full h-full flex flex-col transition-all duration-300 shrink-0"
                    style="width: 360px;"
                >
                    {#if isParticipantsOpen}
                        <ParticipantsList
                            room={room!}
                            {participants}
                            adminId={roomDetails?.adminId}
                            onClose={() => (isParticipantsOpen = false)}
                            onKick={(identity) => kickParticipant(identity)}
                            onMute={(identity) => muteParticipant(identity)}
                            onDisableVideo={(identity) =>
                                disableVideo(identity)}
                            onStageFocus={(identity) =>
                                updateLayout("stage", identity)}
                        />
                    {/if}

                    {#if isChatOpen}
                        <Chat
                            room={room!}
                            messages={chatMessages}
                            onClose={() => (isChatOpen = false)}
                            adminId={roomDetails?.adminId}
                        />
                    {/if}
                </div>
            </div>
        </div>

        {#if !isMobile}
            <!-- Desktop Footer - Exactly as before -->
            <div
                class="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
                <div class="flex h-16 items-center justify-center gap-2 px-4">
                    <MicButton
                        enabled={audioEnabled}
                        {room}
                        devices={audioDevices}
                        outputDevices={audioOutputDevices}
                        activeOutputId={activeAudioOutputId}
                        onToggle={toggleMic}
                        onDeviceSelect={setAudioDevice}
                        onOutputSelect={setAudioOutputDevice}
                        onOpen={updateDevices}
                    />

                    <CameraButton
                        enabled={videoEnabled}
                        {room}
                        devices={videoDevices}
                        onToggle={toggleVideo}
                        onDeviceSelect={setVideoDevice}
                        onOpen={updateDevices}
                    />

                    <Button
                        variant={isLocalScreenSharing ? "default" : "outline"}
                        size="icon"
                        onclick={toggleScreenShare}
                    >
                        <ScreenShare class="h-4 w-4" />
                    </Button>

                    <div class="w-px h-8 bg-border"></div>

                    <Button
                        variant={isParticipantsOpen ? "default" : "outline"}
                        size="icon"
                        onclick={() => {
                            isParticipantsOpen = !isParticipantsOpen;
                            if (isParticipantsOpen) isChatOpen = false;
                        }}
                    >
                        <Users class="h-4 w-4" />
                    </Button>

                    <Button
                        variant={isChatOpen ? "default" : "outline"}
                        size="icon"
                        onclick={() => {
                            isChatOpen = !isChatOpen;
                            if (isChatOpen) isParticipantsOpen = false;
                        }}
                    >
                        <MessageCircle class="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onclick={() => (isSettingsOpen = true)}
                    >
                        <Settings class="h-4 w-4" />
                    </Button>

                    <Button
                        variant="destructive"
                        class="px-6"
                        onclick={leaveMeeting}
                    >
                        <LogOut class="h-4 w-4 mr-2" /> End Call
                    </Button>
                </div>
            </div>
        {/if}
    </div>
{/if}
<!-- Message Notification Toast -->
{#if showMessageNotification && lastNotificationMessage}
    <div
        class="fixed bottom-24 right-6 z-[100] w-full max-w-sm bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-5 transform transition-all ease-out"
    >
        <div class="flex items-start gap-4">
            <div
                class="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-blue-100 shadow-sm overflow-hidden"
            >
                {#if getParticipantAvatar(lastNotificationMessage.sender)}
                    <img
                        src={getParticipantAvatar(
                            lastNotificationMessage.sender,
                        )}
                        alt=""
                        class="w-full h-full object-cover"
                    />
                {:else}
                    <div
                        class="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg uppercase"
                    >
                        {getParticipantName(
                            lastNotificationMessage.sender,
                        ).charAt(0)}
                    </div>
                {/if}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1.5">
                    <span class="text-sm font-bold text-gray-900 truncate">
                        {getParticipantName(lastNotificationMessage.sender)}
                    </span>
                    <button
                        class="text-gray-300 hover:text-gray-500 transition-colors p-1 hover:bg-gray-50 rounded-full"
                        onclick={() => (showMessageNotification = false)}
                    >
                        <CloseIcon class="h-4 w-4" />
                    </button>
                </div>
                <p
                    class="text-[14px] text-gray-600 line-clamp-2 leading-relaxed font-medium"
                >
                    {#if lastNotificationMessage.imageUrl}
                        <span
                            class="flex items-center gap-1.5 text-blue-600 font-bold mb-0.5"
                        >
                            <ImageIcon class="h-4 w-4" />
                            Sent a photo
                        </span>
                    {/if}
                    {lastNotificationMessage.text || ""}
                </p>
                <div class="mt-4 flex items-center justify-end">
                    <button
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                        onclick={() => {
                            isChatOpen = true;
                            showMessageNotification = false;
                        }}
                    >
                        <MessageCircle class="h-3.5 w-3.5" />
                        Reply to message
                    </button>
                </div>
            </div>
        </div>
        <div
            class="absolute bottom-0 left-0 h-1 bg-blue-100 w-full overflow-hidden rounded-b-2xl"
        >
            <div class="h-full bg-blue-600"></div>
        </div>
    </div>
{/if}

<!-- Settings Modal -->
{#if isSettingsOpen}
    <div
        class="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
        <div
            class="bg-background rounded-2xl md:rounded-3xl w-full max-w-3xl h-full md:h-[600px] max-h-[90vh] md:max-h-[600px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-border m-4 md:m-0"
            role="dialog"
            aria-modal="true"
        >
            <!-- Sidebar / Top Nav -->
            <div
                class="w-full md:w-64 bg-muted/30 border-b md:border-b-0 md:border-r border-border p-2 md:p-6 flex flex-row md:flex-col gap-1 md:gap-2 shrink-0 overflow-x-auto scrollbar-none"
            >
                <h2
                    class="text-xl font-bold text-foreground mb-6 px-2 hidden md:block"
                >
                    Settings
                </h2>

                <button
                    class="flex flex-1 md:flex-none flex-row items-center justify-center md:justify-start gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-medium {settingsTab ===
                    'general'
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'}"
                    onclick={() => (settingsTab = "general")}
                >
                    <Settings class="h-4 w-4 md:h-5 md:w-5" />
                    <span class="text-[12px] md:text-sm">General</span>
                </button>

                <button
                    class="flex flex-1 md:flex-none flex-row items-center justify-center md:justify-start gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-medium {settingsTab ===
                    'audio'
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'}"
                    onclick={() => (settingsTab = "audio")}
                >
                    <Volume2 class="h-4 w-4 md:h-5 md:w-5" />
                    <span class="text-[12px] md:text-sm">Audio</span>
                </button>

                <button
                    class="flex flex-1 md:flex-none flex-row items-center justify-center md:justify-start gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-medium {settingsTab ===
                    'video'
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'}"
                    onclick={() => (settingsTab = "video")}
                >
                    <Video class="h-4 w-4 md:h-5 md:w-5" />
                    <span class="text-[12px] md:text-sm">Video</span>
                </button>

                <div class="mt-auto hidden md:block md:pt-6">
                    <Button
                        variant="ghost"
                        class="w-full justify-start gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors font-medium"
                        onclick={leaveMeeting}
                    >
                        <LogOut class="h-5 w-5" />
                        Leave Room
                    </Button>
                </div>
            </div>

            <!-- Content -->
            <div class="flex-1 flex flex-col min-w-0 bg-background">
                <div class="flex items-center justify-between p-4 md:p-6">
                    <h2
                        class="text-xl md:text-2xl font-black text-foreground md:hidden uppercase tracking-tight"
                    >
                        Settings
                    </h2>
                    <h2
                        class="text-xl md:text-2xl font-black text-foreground hidden md:block uppercase tracking-tight"
                    >
                        {settingsTab === "general" ? "Profile" : settingsTab}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        class="rounded-full hover:bg-muted h-10 w-10"
                        onclick={() => (isSettingsOpen = false)}
                    >
                        <CloseIcon class="h-6 w-6 text-muted-foreground" />
                    </Button>
                </div>

                <div class="flex-1 overflow-y-auto px-4 md:px-10 pb-6 md:pb-10">
                    {#if settingsTab === "general"}
                        <div class="max-w-md mx-auto space-y-6 md:space-y-8">
                            <div class="md:hidden">
                                <h3
                                    class="text-base font-bold text-foreground mb-1"
                                >
                                    Profile
                                </h3>
                                <p class="text-xs text-muted-foreground mb-4">
                                    Manage your profile in this meeting.
                                </p>
                            </div>

                            <div
                                class="flex flex-col items-center mb-6 md:mb-10"
                            >
                                <div class="relative group">
                                    <div
                                        class="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"
                                    ></div>
                                    <button
                                        class="relative w-20 h-20 md:w-28 md:h-28 rounded-full p-1 bg-background border border-border shadow-2xl transition-all duration-300 group-active:scale-95"
                                        onclick={() => avatarInput?.click()}
                                    >
                                        <div
                                            class="w-full h-full rounded-full overflow-hidden bg-muted/30 flex items-center justify-center"
                                        >
                                            {#if guestAvatar}
                                                <img
                                                    src={guestAvatar}
                                                    alt="Profile"
                                                    class="w-full h-full object-cover"
                                                />
                                            {:else}
                                                <Camera
                                                    class="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/30"
                                                />
                                            {/if}

                                            <div
                                                class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] rounded-full"
                                            >
                                                <Camera
                                                    class="w-6 h-6 text-white mb-1"
                                                />
                                                <span
                                                    class="text-white text-[10px] font-bold uppercase"
                                                    >Change</span
                                                >
                                            </div>
                                        </div>
                                    </button>

                                    <div
                                        class="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white translate-y-0 group-hover:-translate-y-1 transition-transform"
                                    >
                                        <ImageIcon class="w-4 w-4" />
                                    </div>
                                </div>

                                <div class="mt-4 text-center">
                                    <h3
                                        class="text-lg md:text-xl font-bold text-foreground"
                                    >
                                        {tempDisplayName || "Participant"}
                                    </h3>
                                    <p
                                        class="text-xs text-primary font-bold uppercase mt-1"
                                    >
                                        Local Profile
                                    </p>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <Label
                                    for="display-name"
                                    class="text-sm font-semibold text-foreground/80"
                                    >Display Name</Label
                                >
                                <Input
                                    id="display-name"
                                    bind:value={tempDisplayName}
                                    placeholder="Enter your name"
                                    class="h-12 px-4 rounded-2xl border-border focus:ring-2 focus:ring-primary/20 transition-all text-foreground font-medium bg-background"
                                />
                                <p
                                    class="text-[11px] text-muted-foreground font-medium"
                                >
                                    This name is visible to everyone in the
                                    room.
                                </p>
                            </div>

                            <div class="pt-4 md:pt-6 border-t border-border">
                                <h3
                                    class="text-base md:text-lg font-bold text-foreground mb-3"
                                >
                                    Appearance
                                </h3>
                                <div class="grid grid-cols-3 gap-3 mb-6">
                                    {#each ["light", "dark", "system"] as t}
                                        <button
                                            class="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all {$themeStore ===
                                            t
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                                : 'border-border hover:bg-muted text-muted-foreground'}"
                                            onclick={() =>
                                                themeStore.setTheme(t as Theme)}
                                        >
                                            <span
                                                class="text-sm font-semibold capitalize"
                                                >{t}</span
                                            >
                                        </button>
                                    {/each}
                                </div>

                                <h3
                                    class="text-base md:text-lg font-bold text-foreground mb-3"
                                >
                                    Sidebar Layout
                                </h3>
                                <div class="grid grid-cols-2 gap-3">
                                    {#each ["overlay", "push"] as m}
                                        <button
                                            class="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all {sidebarMode ===
                                            m
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                                : 'border-border hover:bg-muted text-muted-foreground'}"
                                            onclick={() =>
                                                (sidebarMode = m as
                                                    | "overlay"
                                                    | "push")}
                                        >
                                            <span
                                                class="text-sm font-semibold capitalize"
                                                >{m}</span
                                            >
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {:else if settingsTab === "audio"}
                        <div class="max-w-md mx-auto space-y-6 md:space-y-8">
                            <div class="md:hidden">
                                <h3
                                    class="text-base font-bold text-foreground mb-1"
                                >
                                    Audio
                                </h3>
                                <p class="text-xs text-muted-foreground mb-4">
                                    Configure your microphone and audio.
                                </p>
                            </div>
                            <div class="hidden md:block">
                                <p class="text-sm text-muted-foreground mb-6">
                                    Configure your microphone and audio
                                    settings.
                                </p>
                            </div>

                            <div class="space-y-4">
                                <Label
                                    class="text-sm font-semibold text-foreground/80"
                                    >Microphone</Label
                                >
                                <div class="relative group">
                                    <select
                                        class="w-full h-12 px-4 rounded-2xl border border-border focus:ring-2 focus:ring-primary/20 transition-all text-foreground font-medium appearance-none bg-background pr-10"
                                        onchange={(e) =>
                                            setAudioDevice(
                                                e.currentTarget.value,
                                            )}
                                        value={room?.localParticipant
                                            ?.getTrackPublication(
                                                Track.Source.Microphone,
                                            )
                                            ?.track?.mediaStreamTrack?.getSettings()
                                            ?.deviceId}
                                    >
                                        {#each audioDevices as device}
                                            <option value={device.deviceId}
                                                >{device.label ||
                                                    `Microphone ${device.deviceId.slice(0, 5)}...`}</option
                                            >
                                        {/each}
                                    </select>
                                    <div
                                        class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60 group-hover:text-foreground transition-colors"
                                    >
                                        <ChevronUp class="h-4 w-4 rotate-180" />
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <Label
                                        class="text-sm font-semibold text-foreground/80 flex items-center gap-2"
                                    >
                                        <Sparkles
                                            class="h-4 w-4 text-primary"
                                        />
                                        Noise Suppression
                                    </Label>
                                    <span
                                        class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                                        >Beta</span
                                    >
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    {#each ["low", "moderate", "high", "very-high"] as level}
                                        <button
                                            class="flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all text-sm font-medium
                                                   {noiseSuppressionLevel ===
                                            level
                                                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                                : 'border-border hover:bg-muted text-muted-foreground'}"
                                            onclick={() =>
                                                setNoiseSuppressionLevel(
                                                    level as any,
                                                )}
                                        >
                                            <div
                                                class="h-2 w-2 rounded-full {noiseSuppressionLevel ===
                                                level
                                                    ? 'bg-primary animate-pulse'
                                                    : 'bg-muted-foreground/30'}"
                                            ></div>
                                            <span class="capitalize"
                                                >{level.replace("-", " ")}</span
                                            >
                                        </button>
                                    {/each}
                                </div>
                                <p
                                    class="text-[11px] text-muted-foreground px-1"
                                >
                                    Reduces background noise like fans, typing,
                                    or traffic. "Low" disables suppression for
                                    maximum fidelity.
                                </p>
                            </div>

                            <div
                                class="p-6 bg-muted/50 rounded-3xl flex items-center gap-4 dark:bg-muted/20"
                            >
                                <div
                                    class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                                >
                                    <Mic class="h-5 w-5" />
                                </div>
                                <div class="flex-1">
                                    <div
                                        class="text-sm font-bold text-foreground"
                                    >
                                        Audio Level
                                    </div>
                                    <div
                                        class="mt-2 h-1.5 w-full bg-blue-200 rounded-full overflow-hidden"
                                    >
                                        <div
                                            class="h-full bg-blue-600 transition-all duration-75"
                                            style="width: {(audioLevels.get(
                                                localParticipant?.identity ||
                                                    '',
                                            ) || 0) * 100}%"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {:else if settingsTab === "video"}
                        <div class="max-w-md mx-auto space-y-6 md:space-y-8">
                            <div class="md:hidden">
                                <h3
                                    class="text-base font-bold text-foreground mb-1"
                                >
                                    Video
                                </h3>
                                <p class="text-xs text-muted-foreground mb-4">
                                    Configure your camera and quality.
                                </p>
                            </div>
                            <div class="hidden md:block">
                                <p class="text-sm text-muted-foreground mb-6">
                                    Configure your camera and video quality.
                                </p>
                            </div>

                            <div class="space-y-4">
                                <Label
                                    class="text-sm font-semibold text-foreground/80"
                                    >Camera</Label
                                >
                                <div class="relative group">
                                    <select
                                        class="w-full h-12 px-4 rounded-2xl border border-border focus:ring-2 focus:ring-primary/20 transition-all text-foreground font-medium appearance-none bg-background pr-10"
                                        onchange={(e) =>
                                            setVideoDevice(
                                                e.currentTarget.value,
                                            )}
                                        value={room?.localParticipant
                                            ?.getTrackPublication(
                                                Track.Source.Camera,
                                            )
                                            ?.track?.mediaStreamTrack?.getSettings()
                                            ?.deviceId}
                                    >
                                        {#each videoDevices as device}
                                            <option value={device.deviceId}
                                                >{device.label ||
                                                    `Camera ${device.deviceId.slice(0, 5)}...`}</option
                                            >
                                        {/each}
                                    </select>
                                    <div
                                        class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60 group-hover:text-foreground transition-colors"
                                    >
                                        <ChevronUp class="h-4 w-4 rotate-180" />
                                    </div>
                                </div>
                            </div>

                            <div
                                class="aspect-video bg-gray-100 rounded-3xl overflow-hidden relative flex items-center justify-center border-4 border-gray-50"
                            >
                                <Video class="h-12 w-12 text-gray-300" />
                                <div
                                    class="absolute inset-0 bg-black/5 flex items-center justify-center"
                                >
                                    <p
                                        class="text-xs font-bold text-gray-400 uppercase"
                                    >
                                        Preview
                                    </p>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

{#if isKickModalOpen && participantToKick}
    <div
        class="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
        <div
            class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform"
            role="dialog"
            aria-modal="true"
        >
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900 tracking-tight">
                    Kick Participant
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    class="rounded-full hover:bg-gray-100"
                    onclick={() => (isKickModalOpen = false)}
                >
                    <CloseIcon class="h-5 w-5 text-gray-500" />
                </Button>
            </div>

            <div class="space-y-6">
                <p class="text-gray-600 leading-relaxed">
                    Are you sure you want to kick <span
                        class="font-bold text-gray-900"
                        >{participantToKick.name}</span
                    > from the meeting? They will be disconnected immediately.
                </p>

                <div class="flex gap-4">
                    <Button
                        variant="ghost"
                        class="flex-1 rounded-2xl h-12 text-gray-600 hover:bg-gray-50"
                        onclick={() => (isKickModalOpen = false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        class="flex-1 rounded-2xl h-12 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                        onclick={async () => {
                            if (participantToKick) {
                                await kickParticipant(
                                    participantToKick.identity,
                                );
                                isKickModalOpen = false;
                            }
                        }}
                    >
                        Kick Participant
                    </Button>
                </div>
            </div>
        </div>
    </div>
{/if}

<input
    type="file"
    accept="image/*"
    class="hidden"
    bind:this={avatarInput}
    onchange={handleAvatarChange}
/>
<EncryptionModal
    isOpen={isEncryptionModalOpen}
    isEncrypted={isE2EEEnabled}
    isAdmin={roomDetails?.adminId === localParticipant?.identity}
    onClose={() => (isEncryptionModalOpen = false)}
    onToggleE2EE={(enabled) => toggleE2EE(enabled)}
/>

<style>
    @keyframes progress {
        from {
            width: 100%;
        }
        to {
            width: 0%;
        }
    }
    @keyframes avatar-breathe {
        0%,
        100% {
            border-color: rgba(37, 99, 235, 0.5);
            box-shadow: 0 0 0 0px rgba(37, 99, 235, 0);
        }
        50% {
            border-color: rgba(37, 99, 235, 1);
            box-shadow: 0 0 15px 2px rgba(37, 99, 235, 0.3);
        }
    }
    .participant-video {
        width: 100%;
        height: 100%;
        min-height: 200px;
        background-color: #1a1a1a;
        aspect-ratio: 16 / 9;
    }
</style>
