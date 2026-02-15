<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { fade, fly, scale } from "svelte/transition";
    import { spring } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import Hand from "lucide-svelte/icons/hand";
    import Sun from "lucide-svelte/icons/sun";
    import Moon from "lucide-svelte/icons/moon";
    import LogOut from "lucide-svelte/icons/log-out";
    import Plus from "lucide-svelte/icons/plus";
    import Video from "lucide-svelte/icons/video";
    import Mic from "lucide-svelte/icons/mic";
    import Sparkles from "lucide-svelte/icons/sparkles";
    import ShieldCheck from "lucide-svelte/icons/shield-check";
    import ShieldAlert from "lucide-svelte/icons/shield-alert";
    import Loader2 from "lucide-svelte/icons/loader-2";
    import Dices from "lucide-svelte/icons/dices";
    import Github from "lucide-svelte/icons/github";
    import ChevronRight from "lucide-svelte/icons/chevron-right";
    import Fingerprint from "lucide-svelte/icons/fingerprint";

    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Avatar from "$lib/components/ui/avatar";
    import * as Card from "$lib/components/ui/card";
    import { Switch } from "$lib/components/ui/switch";
    import { Label } from "$lib/components/ui/label";
    import { Badge } from "$lib/components/ui/badge";

    import { userStore } from "$lib/stores/user.store";
    import { authStore } from "$lib/stores/auth.store";
    import { debugStore } from "$lib/stores/debug.store";
    import { themeStore } from "$lib/stores/theme.store";
    import {
        fetchAndUpdateCurrentUser,
        passkeyRegister,
        passkeyLogin,
    } from "$lib/auth";
    import {
        createRoomAPI,
        listRoomsAPI,
        type UserRoomResponse,
    } from "$lib/api/room";

    // --- LANDING STATE ---
    let wiggleAnimation = $state(true);
    let contentVisible = $state(false);
    let logoCoords = spring(
        { scale: 1.5, opacity: 0 },
        { stiffness: 0.1, damping: 0.8 },
    );

    // --- DASHBOARD STATE ---
    let loadingMeetings = $state(true);
    let rooms = $state<UserRoomResponse[]>([]);
    let error = $state<string | null>(null);
    let newMeetingName = $state("");
    let creatingMeeting = $state(false);
    let creatingMode = $state<string | null>(null);
    let useE2EE = $state(false);

    let isUserLoggedIn = $derived(!!$userStore);

    onMount(async () => {
        debugStore.log("Home page mounted", "info", "Home");

        if ($userStore) {
            wiggleAnimation = false;
            logoCoords.set({ scale: 1, opacity: 1 }, { hard: true });
            contentVisible = true;
            try {
                await fetchAndUpdateCurrentUser();
                fetchRooms();
            } catch (err) {
                console.error("Auth sync failed", err);
            }
        } else {
            logoCoords.set({ scale: 1.5, opacity: 0 }, { hard: true });
            setTimeout(() => {
                logoCoords.set({ scale: 1, opacity: 1 }, { hard: false });
                wiggleAnimation = false;
                setTimeout(() => {
                    contentVisible = true;
                }, 400);
            }, 800);
        }
    });

    async function fetchRooms() {
        if (!isUserLoggedIn) return;
        loadingMeetings = true;
        try {
            const resp = await listRoomsAPI();
            rooms = resp || [];
        } catch (e: any) {
            error = e.message || "Failed to load meetings";
        } finally {
            loadingMeetings = false;
        }
    }

    async function createMeeting(mode: string = "standard") {
        if (creatingMeeting) return;

        creatingMeeting = true;
        creatingMode = mode;
        error = null;
        try {
            await createRoomAPI({
                name: newMeetingName.trim() || undefined,
                mode,
                settings: {
                    allowChat: true,
                    allowVideo: true,
                    allowAudio: true,
                    requireApproval: false,
                    e2ee: useE2EE,
                },
            });
            newMeetingName = "";
            await fetchRooms();
            debugStore.log(`Meeting created: ${mode}`, "info", "Home");
        } catch (e: any) {
            const msg = e?.message || "Failed to create meeting";
            error = msg;
            debugStore.log(`Failed to create meeting: ${msg}`, "error", "Home");
        } finally {
            creatingMeeting = false;
            creatingMode = null;
        }
    }

    function logout() {
        userStore.clear();
        authStore.clear();
        goto("/");
    }

    function toggleDarkMode() {
        themeStore.setTheme($themeStore === "dark" ? "light" : "dark");
    }

    function generateRandomName() {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        const randomChar = () => {
            const array = new Uint8Array(1);
            crypto.getRandomValues(array);
            return chars[array[0] % chars.length];
        };
        const part = (len: number) =>
            Array.from({ length: len }, randomChar).join("");
        newMeetingName = `${part(3)}-${part(4)}-${part(3)}`;
    }
</script>

<svelte:head>
    <title>Bedrud | Modern Open Source Meetings</title>
</svelte:head>

<div
    class="min-h-screen bg-background text-foreground transition-colors duration-500 font-sans selection:bg-primary/10 flex flex-col"
    class:items-center={!isUserLoggedIn || !contentVisible}
    class:justify-center={!isUserLoggedIn || !contentVisible}
    class:p-4={!isUserLoggedIn || !contentVisible}
    class:md:p-6={!isUserLoggedIn || !contentVisible}
>
    {#if isUserLoggedIn && contentVisible}
        <!-- DASHBOARD CONTAINER -->
        <div
            class="w-full max-w-4xl mx-auto flex flex-col flex-1 px-4 md:px-6"
            in:fade={{ duration: 400 }}
        >
            <!-- MODERN HEADER -->
            <header class="flex items-center justify-between py-6">
                <div class="flex items-center gap-2">
                    <div class="bg-primary/5 p-2 rounded-xl">
                        <Hand class="h-6 w-6 text-primary" />
                    </div>
                    <span class="text-xl font-bold">Bedrud</span>
                </div>

                <div class="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onclick={toggleDarkMode}
                        class="rounded-full h-9 w-9"
                    >
                        {#if $themeStore === "dark"}
                            <Sun class="h-[1.2rem] w-[1.2rem]" />
                        {:else}
                            <Moon class="h-[1.2rem] w-[1.2rem]" />
                        {/if}
                    </Button>

                    <div class="h-6 w-px bg-border mx-1"></div>

                    <div class="flex items-center gap-3">
                        <Avatar.Root class="h-9 w-9 border border-border">
                            <Avatar.Image src={$userStore?.avatarUrl} />
                            <Avatar.Fallback class="bg-muted text-xs font-bold">
                                {$userStore?.name?.charAt(0)}
                            </Avatar.Fallback>
                        </Avatar.Root>
                        <div class="hidden md:flex flex-col">
                            <span class="text-sm font-semibold leading-none"
                                >{$userStore?.name}</span
                            >
                            <span
                                class="text-[10px] text-muted-foreground uppercase font-bold mt-1"
                                >Authorized</span
                            >
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onclick={logout}
                            class="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors rounded-full"
                        >
                            <LogOut class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main class="flex-1 space-y-12 pb-20">
                <!-- SPACE CONTROL / CREATION -->
                <section class="space-y-6">
                    <div class="flex flex-col gap-1">
                        <h2 class="text-2xl font-bold flex items-center gap-2">
                            New Encounter <Sparkles
                                class="h-4 w-4 text-primary"
                            />
                        </h2>
                        <p class="text-sm text-muted-foreground">
                            Start a collaborative video room or a drop-in audio
                            space.
                        </p>
                    </div>

                    <Card.Root
                        class="overflow-hidden border-border/50 bg-muted/20"
                    >
                        <Card.Content class="p-2 md:p-3">
                            <div class="flex flex-col md:flex-row gap-3">
                                <div class="relative flex-1 group">
                                    <Input
                                        placeholder="Enter space identifier..."
                                        bind:value={newMeetingName}
                                        disabled={creatingMeeting}
                                        class="h-12 bg-background border-border/40 px-4 text-sm font-medium focus-visible:ring-primary/20 transition-all pl-10"
                                    />
                                    <div
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary/50 transition-colors"
                                    >
                                        <Plus class="h-4 w-4" />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onclick={generateRandomName}
                                        disabled={creatingMeeting}
                                        class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground/40 hover:text-primary transition-colors"
                                    >
                                        <Dices class="h-4 w-4" />
                                    </Button>
                                </div>

                                <div
                                    class="flex items-center gap-4 bg-background border border-border/40 rounded-lg px-4 h-12"
                                >
                                    <div class="flex items-center space-x-2">
                                        <Switch
                                            id="e2ee-mode"
                                            bind:checked={useE2EE}
                                        />
                                        <Label
                                            for="e2ee-mode"
                                            class="text-[10px] font-bold uppercase text-muted-foreground cursor-pointer select-none"
                                        >
                                            {useE2EE ? "Secure+" : "Secure"}
                                        </Label>
                                    </div>

                                    <div class="h-4 w-px bg-border"></div>

                                    <div class="flex gap-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onclick={() =>
                                                createMeeting("standard")}
                                            disabled={creatingMeeting}
                                            class="h-9 px-4 rounded-md text-[11px] font-bold uppercase tracking-tight gap-2"
                                        >
                                            {#if creatingMeeting && creatingMode === "standard"}
                                                <Loader2
                                                    class="h-3 w-3 animate-spin"
                                                />
                                            {:else}
                                                <Video class="h-3 w-3" />
                                                Video
                                            {/if}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onclick={() =>
                                                createMeeting("clubhouse")}
                                            disabled={creatingMeeting}
                                            class="h-9 px-4 rounded-md text-[11px] font-bold uppercase tracking-tight gap-2"
                                        >
                                            {#if creatingMeeting && creatingMode === "clubhouse"}
                                                <Loader2
                                                    class="h-3 w-3 animate-spin"
                                                />
                                            {:else}
                                                <Mic class="h-3 w-3" />
                                                Audio
                                            {/if}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card.Content>
                    </Card.Root>

                    {#if error}
                        <div
                            class="mt-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium"
                            in:fade={{ duration: 200 }}
                        >
                            {error}
                        </div>
                    {/if}
                </section>

                <!-- INVENTORY / MEETINGS -->
                <section class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3
                            class="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"
                        >
                            Active Inventory <Badge
                                variant="outline"
                                class="text-[9px] h-5">{rooms.length}</Badge
                            >
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="text-[10px] font-bold uppercase text-muted-foreground hover:text-primary h-8"
                            onclick={fetchRooms}
                        >
                            Sync Cloud
                        </Button>
                    </div>

                    {#if loadingMeetings}
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {#each Array(3) as _}
                                <div
                                    class="h-32 bg-muted/30 animate-pulse rounded-xl border border-border/50"
                                ></div>
                            {/each}
                        </div>
                    {:else if rooms.length === 0}
                        <div
                            class="py-20 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-3xl bg-muted/5"
                        >
                            <div class="bg-muted p-4 rounded-full mb-4">
                                <Plus
                                    class="h-8 w-8 text-muted-foreground/30"
                                />
                            </div>
                            <h4 class="text-base font-bold tracking-tight">
                                Vault Empty
                            </h4>
                            <p
                                class="text-sm text-muted-foreground mt-1 text-center max-w-[200px]"
                            >
                                No meeting sessions detected in your account.
                            </p>
                        </div>
                    {:else}
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {#each rooms as room (room.id)}
                                <Card.Root
                                    class="group hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm relative overflow-hidden"
                                >
                                    <div class="absolute top-0 right-0 p-3">
                                        {#if room.isActive}
                                            <div
                                                class="flex items-center gap-1.5 text-emerald-500 font-bold text-[9px] uppercase bg-emerald-500/10 px-2.5 py-1.5 rounded-full leading-none"
                                            >
                                                <span
                                                    class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"
                                                ></span>
                                                <span class="pt-1">
                                                    Online
                                                </span>
                                            </div>
                                        {:else}
                                            <div
                                                class="flex items-center gap-1.5 text-muted-foreground font-bold text-[9px] uppercase bg-muted px-2.5 py-1.5 rounded-full leading-none"
                                            >
                                                <span class="leading-[9px]"
                                                    >Offline</span
                                                >
                                            </div>
                                        {/if}
                                    </div>
                                    <Card.Header class="pb-2">
                                        <div
                                            class="flex items-center gap-3 mb-1"
                                        >
                                            <div
                                                class="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors"
                                            >
                                                {#if room.mode === "clubhouse"}
                                                    <Mic
                                                        class="h-4 w-4 text-indigo-500"
                                                    />
                                                {:else}
                                                    <Video
                                                        class="h-4 w-4 text-emerald-500"
                                                    />
                                                {/if}
                                            </div>
                                            <Card.Title
                                                class="text-base font-bold tracking-tight break-all"
                                                >{room.name}</Card.Title
                                            >
                                        </div>
                                        <Card.Description
                                            class="text-[10px] font-bold uppercase opacity-60"
                                        >
                                            {room.relationship === "creator"
                                                ? "Host Control"
                                                : "Peer Access"}
                                        </Card.Description>
                                    </Card.Header>
                                    <Card.Content class="pb-4">
                                        <div
                                            class="flex items-center gap-4 text-[10px] text-muted-foreground border-t border-border/40 pt-4"
                                        >
                                            {#if room.settings?.e2ee}
                                                <div
                                                    class="flex items-center gap-1.5 text-primary/80 font-bold uppercase"
                                                    title="End-to-End Encrypted"
                                                >
                                                    <ShieldCheck
                                                        class="h-3 w-3"
                                                    />
                                                    E2EE
                                                </div>
                                            {:else}
                                                <div
                                                    class="flex items-center gap-1.5 opacity-40 font-bold uppercase tracking-widest"
                                                    title="Standard Encryption"
                                                >
                                                    <ShieldAlert
                                                        class="h-3 w-3"
                                                    />
                                                    TLS
                                                </div>
                                            {/if}
                                            <span class="opacity-30">•</span>
                                            <span
                                                class="font-bold uppercase tracking-widest"
                                                >{room.mode}</span
                                            >
                                        </div>
                                    </Card.Content>
                                    <Card.Footer
                                        class="bg-muted/30 p-3 pt-3 flex justify-end group-hover:bg-primary/5 transition-colors"
                                    >
                                        <Button
                                            href={room.mode === "clubhouse"
                                                ? `/c/${room.name}`
                                                : `/m/${room.name}`}
                                            disabled={!room.isActive}
                                            variant="ghost"
                                            size="sm"
                                            class="h-8 px-4 text-[10px] font-bold uppercase bg-background border border-border/50 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all rounded-md gap-2"
                                        >
                                            Enter Space <ChevronRight
                                                class="h-3 w-3"
                                            />
                                        </Button>
                                    </Card.Footer>
                                </Card.Root>
                            {/each}
                        </div>
                    {/if}
                </section>
            </main>

            <footer
                class="mt-auto py-10 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity"
            >
                <span class="text-[10px] font-bold uppercase"
                    >Bedrud Protocol © 2026</span
                >
                <div class="flex gap-8 items-center">
                    <a
                        href="/terms"
                        class="text-[10px] font-bold uppercase hover:text-primary transition-colors"
                        >Terms</a
                    >
                    <a
                        href="/privacy"
                        class="text-[10px] font-bold uppercase hover:text-primary transition-colors"
                        >Privacy</a
                    >
                    <a
                        href="https://github.com"
                        target="_blank"
                        class="hover:text-primary transition-colors"
                    >
                        <Github class="h-4 w-4" />
                    </a>
                </div>
            </footer>
        </div>
    {:else}
        <!-- MODERN LANDING -->
        <div
            class="flex-1 flex flex-col items-center justify-center w-full max-w-lg relative"
        >
            <!-- LOGO ANIMATION -->
            <div
                class="text-center mb-8"
                style="opacity: {$logoCoords.opacity}; transform: scale({$logoCoords.scale})"
            >
                <div class="flex flex-col items-center gap-8">
                    <div
                        class="bg-foreground text-background flex items-center justify-center h-28 w-28 rounded-[2.5rem] shadow-2xl shadow-primary/20 relative"
                        class:wiggle={wiggleAnimation}
                    >
                        <Hand class="h-12 w-12" />
                        <div
                            class="absolute -bottom-1 -right-1 bg-primary h-6 w-6 rounded-full border-4 border-background"
                        ></div>
                    </div>

                    <div class="space-y-3">
                        <h1 class="text-6xl font-bold">Bedrud</h1>
                        {#if contentVisible}
                            <p
                                class="text-muted-foreground font-medium text-lg leading-tight"
                                in:fade={{ duration: 400, delay: 200 }}
                            >
                                Secure video rooms and drop-in audio spaces.
                                Minimal, open source, and built for privacy.
                            </p>
                        {/if}
                    </div>
                </div>
            </div>

            {#if contentVisible}
                <div
                    class="flex flex-col items-center gap-10 w-full mt-4"
                    in:fade={{ duration: 400, delay: 400 }}
                >
                    <div class="flex flex-col gap-3 w-full px-4">
                        <div class="flex flex-col sm:flex-row gap-3 w-full">
                            <Button
                                href="/auth/login"
                                class="h-14 sm:flex-1 rounded-2xl font-bold text-[13px] uppercase shadow-xl shadow-primary/10 transition-all"
                            >
                                Log In
                            </Button>
                            <Button
                                variant="outline"
                                href="/auth/register"
                                class="h-14 sm:flex-1 rounded-2xl font-bold text-[13px] uppercase border-border/60 backdrop-blur-sm transition-all"
                            >
                                Quick Start
                            </Button>
                        </div>

                        <Button
                            variant="secondary"
                            onclick={async () => {
                                try {
                                    await passkeyLogin();
                                    goto("/");
                                } catch (e) {
                                    goto("/auth/login");
                                }
                            }}
                            class="h-14 rounded-2xl font-bold text-[13px] uppercase transition-all"
                        >
                            <Fingerprint class="mr-2 h-5 w-5" />
                            Sign in with Passkey
                        </Button>
                    </div>

                    <div class="flex flex-col items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onclick={toggleDarkMode}
                            class="rounded-full h-12 w-12 border border-border/40 bg-muted/10 hover:bg-muted/20"
                        >
                            {#if $themeStore === "dark"}
                                <Sun class="h-5 w-5" />
                            {:else}
                                <Moon class="h-5 w-5" />
                            {/if}
                        </Button>
                        <span
                            class="text-[9px] font-bold uppercase text-muted-foreground/40"
                            >Open Source Protocol</span
                        >
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .wiggle {
        animation: wiggle 1.2s ease-in-out infinite;
    }

    @keyframes wiggle {
        0%,
        100% {
            transform: rotate(0deg);
        }
        25% {
            transform: rotate(-12deg);
        }
        75% {
            transform: rotate(12deg);
        }
    }

    :global(html) {
        scrollbar-gutter: stable;
    }

    :global(body) {
        transition-property: color, background-color, border-color,
            text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 500ms;
        overflow-x: hidden;
    }
</style>
