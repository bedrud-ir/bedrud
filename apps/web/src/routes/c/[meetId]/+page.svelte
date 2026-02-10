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
        RemoteParticipant,
        Participant,
        LocalParticipant,
    } from "livekit-client";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import {
        Mic,
        MicOff,
        LogOut,
        Loader2,
        Crown,
        ShieldAlert,
        UserPlus,
        UserMinus,
        Hand,
        MessageCircle,
        Video,
        Camera,
    } from "lucide-svelte";
    import { joinRoomAPI, type Room as RoomModel } from "$lib/api/room";
    import { guestLoginAPI } from "$lib/api/auth";
    import { authStore } from "$lib/stores/auth.store";
    import { themeStore } from "$lib/stores/theme.store";
    import Chat from "$lib/components/meeting/Chat.svelte";
    import { type Message } from "$lib/models/chat";
    import { getGuestProfile, saveGuestProfile } from "$lib/storage";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";

    // Constants
    const AUDIO_THRESHOLD_UI = 0.005;

    // State management
    let room = $state<Room | null>(null);
    let participants = $state<any[]>([]);
    let localParticipant = $state<LocalParticipant | null>(null);
    let audioEnabled = $state(false);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let roomDetails = $state<any>(null); // Use any for more flexible property access in Svelte 5
    let isChatOpen = $state(false);
    let chatMessages = $state<Message[]>([]);

    // Guest state
    let showGuestForm = $state(false);
    let guestName = $state("");
    let guestAvatar = $state<string | null>(null);
    let isGuestJoining = $state(false);
    let avatarInput = $state<HTMLInputElement>();

    // UI State for animations/interaction
    let audioLevels = $state<Map<string, number>>(new Map());
    let localAudioLevel = $state(0);
    let handRaisedParticipants = $state<Set<string>>(new Set());
    let chatNotifications = $state<any[]>([]);
    let showRedirectModal = $state(false);

    // Derived UI state
    let allParticipantsUI = $derived([
        ...(localParticipant ? [localParticipant] : []),
        ...participants,
    ]);

    let isHandRaised = $derived(
        localParticipant
            ? handRaisedParticipants.has(localParticipant.identity)
            : false,
    );

    function log(message: string, type: "info" | "error" | "warn" = "info") {
        debugStore.log(message, type);
    }

    async function toggleMic() {
        if (!room) return;
        try {
            audioEnabled = !audioEnabled;
            await room.localParticipant.setMicrophoneEnabled(audioEnabled);
            log(`Microphone ${audioEnabled ? "enabled" : "disabled"}`);
        } catch (e: any) {
            log(`Failed to toggle microphone: ${e.message}`, "error");
        }
    }

    function raiseHand() {
        if (!room || !room.localParticipant) return;
        room.localParticipant.publishData(
            new TextEncoder().encode(JSON.stringify({ type: "hand-raised" })),
            { reliable: true },
        );
        handRaisedParticipants.add(room.localParticipant.identity);
    }

    function lowerHand() {
        if (!room || !room.localParticipant) return;
        room.localParticipant.publishData(
            new TextEncoder().encode(JSON.stringify({ type: "hand-lowered" })),
            { reliable: true },
        );
        handRaisedParticipants.delete(room.localParticipant.identity);
    }

    function handleDataReceived(data: any, sender: string | undefined) {
        log(`Received data from ${sender}`);
        const participant = room?.remoteParticipants.get(sender || "");

        try {
            // LiveKit might send data in different formats depending on the platform/provider
            // Ensure we have a Uint8Array for TextDecoder
            let uint8Data: Uint8Array;
            if (data instanceof Uint8Array) {
                uint8Data = data;
            } else if (data && typeof data === "object" && "0" in data) {
                // Handle cases where data is a stringified Uint8Array-like object
                uint8Data = new Uint8Array(Object.values(data) as number[]);
            } else {
                uint8Data = new Uint8Array(data);
            }

            const payload = JSON.parse(new TextDecoder().decode(uint8Data));

            // Resilience: treat as chat if it has text/imageUrl even without type
            const isChatMessage =
                payload.type === "chat" ||
                payload.text !== undefined ||
                payload.imageUrl !== undefined;

            if (isChatMessage) {
                const newMsg = {
                    sender: participant?.identity || sender || "Unknown",
                    text: payload.text,
                    imageUrl: payload.imageUrl,
                    timestamp: payload.timestamp || Date.now(),
                    isLocal: false,
                };

                chatMessages = [...chatMessages, newMsg];

                if (!isChatOpen) {
                    const id = Math.random().toString(36).substring(7);
                    chatNotifications = [
                        ...chatNotifications,
                        {
                            id,
                            sender:
                                participant?.identity || sender || "Unknown",
                            text: payload.text || "Shared an image",
                        },
                    ];
                    setTimeout(() => {
                        chatNotifications = chatNotifications.filter(
                            (n) => n.id !== id,
                        );
                    }, 5000);
                }
            } else if (payload.type === "hand-raised" && sender) {
                handRaisedParticipants.add(sender);
            } else if (payload.type === "hand-lowered" && sender) {
                handRaisedParticipants.delete(sender);
            }
        } catch (e: any) {
            log(`Failed to handle received data: ${e.message}`, "error");
            console.error("Data decode error:", e, data);
        }
    }

    let isInitializing = false;
    async function initMeeting() {
        if (isInitializing || (room && room.state === "connected")) {
            log("initMeeting: Already initializing or connected, skipping.");
            return;
        }

        isInitializing = true;
        isLoading = true;
        error = null;

        try {
            const meetId = $page.params.meetId;
            if (!meetId) throw new Error("Meeting ID missing");

            log(`Joining room: ${meetId}`);
            const res = await joinRoomAPI({ roomName: meetId });
            roomDetails = res;
            log(`joinRoomAPI successful: ${res.id}`);

            // Cleanup old room if exists
            if (room) {
                room.disconnect();
            }

            room = new Room({
                adaptiveStream: true,
                dynacast: true,
            });

            room.on(RoomEvent.ParticipantConnected, (p) => {
                participants = [...participants, p];
                log(`Participant connected: ${p.identity}`);
            })
                .on(RoomEvent.ParticipantDisconnected, (p) => {
                    participants = participants.filter(
                        (part) => part.identity !== p.identity,
                    );
                    log(`Participant disconnected: ${p.identity}`);
                })
                .on(RoomEvent.DataReceived, (data, participant) => {
                    handleDataReceived(data, participant?.identity);
                })
                .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                    // Update speaking status
                })
                .on(RoomEvent.Disconnected, (reason) => {
                    log(`Room Disconnected: ${reason}`, "warn");
                    // Only redirect if we're not currently initializing a new connection
                    if (!isInitializing) {
                        goto("/");
                    }
                });

            log(`Starting room.connect to ${roomDetails.livekitHost}`);
            await room.connect(roomDetails.livekitHost, roomDetails.token);
            log("room.connect successful");

            localParticipant = room.localParticipant;
            participants = Array.from(room.remoteParticipants.values());

            // Check if it's a standard video room
            if (roomDetails.mode === "standard") {
                log("Redirecting to video mode modal");
                showRedirectModal = true;
            }

            log(`Connected to room: ${room.name}`);
        } catch (e: any) {
            log(`Connection failed: ${e.message}`, "error");
            error = e.message;
        } finally {
            isLoading = false;
            isInitializing = false;
        }
    }

    async function handleGuestJoin() {
        if (!guestName.trim()) return;
        isGuestJoining = true;
        try {
            await saveGuestProfile({
                name: guestName,
                avatar: guestAvatar || undefined,
            });
            const res = await guestLoginAPI({ name: guestName });
            authStore.setTokens(res.tokens);
            userStore.set(res.user);
            showGuestForm = false;
            await initMeeting();
        } catch (e: any) {
            log(`Guest join failed: ${e.message}`, "error");
            error = e.message;
        } finally {
            isGuestJoining = false;
        }
    }

    function handleAvatarChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                guestAvatar = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    onMount(async () => {
        const profile = await getGuestProfile();
        if (profile) {
            guestName = profile.name;
            guestAvatar = profile.avatar || null;
        }

        if (!$userStore) {
            isLoading = false;
            showGuestForm = true;
            return;
        }
        await initMeeting();
    });

    onDestroy(() => {
        room?.disconnect();
    });

    function getParticipantName(identity: string, p: any) {
        try {
            const meta = JSON.parse(p.metadata || "{}");
            return meta.name || identity;
        } catch {
            return identity;
        }
    }

    function getParticipantAvatar(identity: string, p: any) {
        try {
            const meta = JSON.parse(p.metadata || "{}");
            return meta.avatar;
        } catch {
            return null;
        }
    }
</script>

<div
    class="h-screen flex flex-col bg-slate-950 text-white font-sans selection:bg-blue-500/30"
>
    {#if isLoading}
        <div class="flex-1 flex items-center justify-center">
            <div class="flex flex-col items-center gap-6">
                <div class="relative w-16 h-16">
                    <div
                        class="absolute inset-0 rounded-full border-4 border-white/5"
                    ></div>
                    <div
                        class="absolute inset-0 rounded-full border-4 border-t-white animate-spin"
                    ></div>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <h2
                        class="text-xl font-light tracking-[0.2em] uppercase text-white"
                    >
                        Entering
                    </h2>
                    <p
                        class="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40"
                    >
                        Secure Environment
                    </p>
                </div>
            </div>
        </div>
    {:else if error}
        <div class="flex-1 flex items-center justify-center">
            <Card.Root
                class="w-[400px] border border-white/5 shadow-2xl bg-slate-900/50 backdrop-blur-2xl"
            >
                <Card.Header>
                    <Card.Title class="text-xl font-semibold text-red-500/90"
                        >Connection Error</Card.Title
                    >
                    <Card.Description class="text-slate-400 text-sm"
                        >{error}</Card.Description
                    >
                </Card.Header>
                <Card.Footer>
                    <Button
                        onclick={() => window.location.reload()}
                        class="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all"
                        >Retry Connection</Button
                    >
                </Card.Footer>
            </Card.Root>
        </div>
    {:else if showGuestForm}
        <div class="flex-1 flex items-center justify-center p-4">
            <Card.Root
                class="w-full max-w-[450px] border-none shadow-2xl bg-white/95 dark:bg-slate-900/95 overflow-hidden transform animate-in zoom-in-95 duration-300 rounded-[2.5rem]"
            >
                <div class="h-2 bg-indigo-600 w-full"></div>
                <Card.Header class="text-center pt-10 pb-6">
                    <button
                        type="button"
                        class="mx-auto w-24 h-24 mb-6 relative group cursor-pointer border-none bg-transparent block"
                        onclick={() => avatarInput?.click()}
                    >
                        <div
                            class="w-full h-full rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden group-hover:scale-105 transition-transform"
                        >
                            {#if guestAvatar}
                                <img
                                    src={guestAvatar}
                                    alt="Avatar"
                                    class="w-full h-full object-cover"
                                />
                            {:else}
                                <Camera
                                    class="h-10 w-10 text-indigo-600 dark:text-indigo-400"
                                />
                            {/if}
                        </div>
                        <div
                            class="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg border-4 border-white dark:border-slate-900 group-hover:scale-110 transition-transform"
                        >
                            <UserPlus class="h-4 w-4" />
                        </div>
                    </button>
                    <Card.Title
                        class="text-3xl font-bold text-slate-900 dark:text-white"
                        >Welcome!</Card.Title
                    >
                    <Card.Description
                        class="text-slate-500 dark:text-slate-400 font-medium text-lg"
                        >Choose how you'll appear in the room</Card.Description
                    >
                </Card.Header>
                <Card.Content class="px-10 space-y-8">
                    <div class="space-y-3">
                        <Label
                            for="name"
                            class="text-xs font-bold uppercase text-slate-400 ml-1"
                            >Your Name</Label
                        >
                        <Input
                            id="name"
                            bind:value={guestName}
                            placeholder="Enter your name..."
                            class="h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-lg font-bold px-6 focus-visible:ring-indigo-500/30 focus-visible:ring-offset-0"
                            onkeypress={(e: KeyboardEvent) =>
                                e.key === "Enter" && handleGuestJoin()}
                        />
                    </div>
                </Card.Content>
                <Card.Footer class="p-10 pt-4">
                    <Button
                        class="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all uppercase gap-3"
                        onclick={handleGuestJoin}
                        disabled={!guestName.trim() || isGuestJoining}
                    >
                        {#if isGuestJoining}
                            <Loader2 class="h-5 w-5 animate-spin" /> Joining...
                        {:else}
                            Join Meeting
                        {/if}
                    </Button>
                </Card.Footer>
            </Card.Root>
        </div>
    {:else if room}
        <div
            class="flex flex-1 h-screen overflow-hidden bg-slate-950 relative {isChatOpen
                ? 'chat-open'
                : ''}"
        >
            <div
                class="flex-1 flex flex-col relative min-w-0 transition-all duration-500 ease-in-out overflow-hidden"
            >
                <!-- Branding -->
                <div
                    class="absolute top-8 left-8 z-40 pointer-events-none animate-fade-in opacity-0"
                    style="animation-delay: 400ms; animation-fill-mode: forwards;"
                >
                    <h1
                        class="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60 select-none"
                    >
                        {($page.params.meetId || "").slice(0, 12)}
                    </h1>
                </div>

                <!-- Actions -->
                <div
                    class="absolute top-6 right-8 z-40 flex items-center gap-2 animate-fade-in opacity-0"
                    style="animation-delay: 600ms; animation-fill-mode: forwards;"
                >
                    <button
                        class="rounded-full hover:bg-white/10 h-8 w-8 text-white/70 hover:text-white transition-all flex items-center justify-center"
                        onclick={() => (isChatOpen = !isChatOpen)}
                    >
                        <MessageCircle class="h-4 w-4" />
                    </button>
                    <button
                        class="rounded-full hover:bg-red-500/20 h-8 w-8 text-white/70 hover:text-red-400 transition-all flex items-center justify-center"
                        onclick={() => goto("/")}
                    >
                        <LogOut class="h-4 w-4" />
                    </button>
                </div>

                <main class="flex-1 overflow-y-auto pt-24 pb-32 px-12 relative">
                    <div class="max-w-7xl">
                        <div
                            class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-x-10 gap-y-14 transition-all duration-500"
                        >
                            {#each allParticipantsUI as p, i (p.identity)}
                                <div
                                    class="flex flex-col items-center gap-4 group relative animate-scale-in opacity-0"
                                    style="animation-delay: {100 +
                                        i *
                                            50}ms; animation-fill-mode: forwards;"
                                >
                                    <div class="relative">
                                        <div
                                            class="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-slate-900 border border-white/10 transition-all duration-500 overflow-hidden {(p.identity ===
                                            localParticipant?.identity
                                                ? audioEnabled
                                                : p.isMicrophoneEnabled) &&
                                            (p.identity ===
                                            localParticipant?.identity
                                                ? localAudioLevel
                                                : audioLevels.get(p.identity) ||
                                                  0) > AUDIO_THRESHOLD_UI
                                                ? 'scale-105 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                                                : 'opacity-90 group-hover:opacity-100'}"
                                        >
                                            {#if getParticipantAvatar(p.identity, p)}
                                                <img
                                                    src={getParticipantAvatar(
                                                        p.identity,
                                                        p,
                                                    )}
                                                    alt=""
                                                    class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                />
                                            {:else}
                                                <div
                                                    class="w-full h-full bg-slate-900 flex items-center justify-center text-slate-600 text-lg font-light"
                                                >
                                                    {p.name?.charAt(0) ||
                                                        p.identity.charAt(0)}
                                                </div>
                                            {/if}
                                        </div>
                                        {#if (p.identity === localParticipant?.identity ? audioEnabled : p.isMicrophoneEnabled) && (p.identity === localParticipant?.identity ? localAudioLevel : audioLevels.get(p.identity) || 0) > AUDIO_THRESHOLD_UI}
                                            <div
                                                class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse"
                                            ></div>
                                        {/if}
                                        {#if !(p.identity === localParticipant?.identity ? audioEnabled : p.isMicrophoneEnabled)}
                                            <div
                                                class="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-red-500/40 rounded-full border border-slate-950"
                                            ></div>
                                        {/if}
                                        {#if handRaisedParticipants.has(p.identity)}
                                            <div
                                                class="absolute -top-1 -left-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-slate-950 animate-bounce"
                                            ></div>
                                        {/if}
                                    </div>
                                    <span
                                        class="text-[10px] font-bold uppercase tracking-wider text-white/70 group-hover:text-white transition-colors duration-300 text-center truncate max-w-full px-1"
                                    >
                                        {getParticipantName(
                                            p.identity,
                                            p,
                                        ).split(" ")[0]}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>
                </main>

                <!-- Dock -->
                <div
                    class="absolute bottom-10 left-1/2 -translate-x-1/2 h-14 px-3 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full shadow-2xl z-40 animate-fly-up opacity-0"
                    style="animation-delay: 800ms; animation-fill-mode: forwards;"
                >
                    <div class="h-full flex items-center gap-1">
                        <button
                            class="w-10 h-10 rounded-full transition-all flex items-center justify-center {audioEnabled
                                ? 'text-emerald-400 hover:bg-emerald-500/20'
                                : 'text-red-400 hover:bg-red-500/20'}"
                            onclick={toggleMic}
                        >
                            {#if audioEnabled}
                                <Mic class="h-4 w-4 fill-emerald-400/20" />
                            {:else}
                                <MicOff class="h-4 w-4" />
                            {/if}
                        </button>
                        <div class="w-[1px] h-4 bg-white/20 mx-1"></div>
                        <button
                            class="w-10 h-10 rounded-full transition-all flex items-center justify-center {isHandRaised
                                ? 'text-blue-400 hover:bg-blue-500/20'
                                : 'text-white/60 hover:text-white'}"
                            onclick={isHandRaised ? lowerHand : raiseHand}
                        >
                            <Hand
                                class="h-4 w-4 {isHandRaised
                                    ? 'fill-current'
                                    : ''}"
                            />
                        </button>
                    </div>
                </div>

                <!-- Notifications -->
                <div
                    class="absolute bottom-28 right-8 flex flex-col gap-2 z-[60] pointer-events-none"
                >
                    {#each chatNotifications as n (n.id)}
                        <button
                            class="bg-white/10 backdrop-blur-2xl border border-white/20 px-4 py-2.5 rounded-full shadow-xl flex items-center gap-3 animate-slide-in-right pointer-events-auto hover:bg-white/20 transition-all font-medium"
                            onclick={() => {
                                isChatOpen = true;
                                chatNotifications = chatNotifications.filter(
                                    (notif) => notif.id !== n.id,
                                );
                            }}
                        >
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-blue-500"
                            ></div>
                            <span
                                class="text-[10px] font-bold text-white uppercase tracking-widest"
                                >{n.sender.split(" ")[0]}</span
                            >
                            <span
                                class="text-[10px] text-white/90 truncate max-w-[140px]"
                                >{n.text}</span
                            >
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Chat Sidebar -->
            <div
                class="fixed inset-y-0 right-0 w-full sm:w-80 md:relative md:flex-shrink-0 z-50 border-l border-white/10 bg-slate-950 flex flex-col shadow-2xl transition-all duration-500 ease-in-out {!isChatOpen
                    ? 'translate-x-full md:w-0 md:opacity-0 pointer-events-none'
                    : 'translate-x-0 opacity-100'}"
            >
                {#if isChatOpen}
                    <Chat
                        {room}
                        messages={chatMessages}
                        onClose={() => (isChatOpen = false)}
                        adminId={roomDetails?.adminId}
                    />
                {/if}
            </div>
        </div>
    {/if}
</div>

{#if showRedirectModal}
    <div
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in"
    >
        <Card.Root
            class="w-[450px] border-none shadow-2xl bg-white/95 dark:bg-slate-900/95 overflow-hidden transform animate-scale-in"
        >
            <div class="h-2 bg-blue-600 w-full"></div>
            <Card.Header class="text-center pt-10 pb-6 px-8">
                <div
                    class="mx-auto w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6"
                >
                    <Video class="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <Card.Title
                    class="text-3xl font-bold text-slate-900 dark:text-white leading-tight"
                    >Video Meeting Detected</Card.Title
                >
                <Card.Description
                    class="text-slate-500 dark:text-slate-400 text-lg mt-4 font-medium leading-relaxed"
                    >This is a standard video meeting. Please use the
                    full-featured meeting interface.</Card.Description
                >
            </Card.Header>
            <Card.Footer class="flex flex-col gap-4 p-8 pt-0">
                <Button
                    onclick={() => (showRedirectModal = false)}
                    class="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all uppercase gap-3"
                    >Switch to Video Mode</Button
                >
                <Button
                    variant="ghost"
                    onclick={() => goto("/")}
                    class="w-full h-12 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold rounded-2xl transition-all"
                    >Back to Home</Button
                >
            </Card.Footer>
        </Card.Root>
    </div>
{/if}

<input
    type="file"
    accept="image/*"
    class="hidden"
    bind:this={avatarInput}
    onchange={handleAvatarChange}
/>

<style>
    :global(body) {
        background-color: #020617;
        color: white;
        font-family:
            "Inter",
            system-ui,
            -apple-system,
            sans-serif;
    }

    ::-webkit-scrollbar {
        width: 6px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes scaleIn {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @keyframes flyUp {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }

    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .animate-fade-in {
        animation: fadeIn 0.8s ease-out;
    }

    .animate-scale-in {
        animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .animate-fly-up {
        animation: flyUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .animate-slide-in-right {
        animation: slideInRight 0.4s ease-out;
    }
</style>
