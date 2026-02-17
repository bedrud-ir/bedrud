<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { fade, scale } from "svelte/transition";
    import { Button } from "$lib/components/ui/button";
    import {
        Video,
        ChevronRight,
        Loader2,
        ArrowLeft,
        ShieldAlert,
    } from "lucide-svelte";
    import { createRoomAPI } from "$lib/api/room";
    import { userStore } from "$lib/stores/user.store";
    import { debugStore } from "$lib/stores/debug.store";

    let isLoading = $state(false);
    let error = $state("");
    let creatingMode = $state("");

    onMount(() => {
        if (!$userStore) {
            localStorage.setItem("redirect", "/new");
            goto("/auth/login");
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get("mode");
        if (mode === "standard") {
            handleCreate(mode);
        }
    });

    async function handleCreate(mode: string) {
        if (isLoading) return;
        isLoading = true;
        creatingMode = mode;
        error = "";

        const chars = "abcdefghijklmnopqrstuvwxyz";
        const part = (len: number) =>
            Array.from(
                { length: len },
                () => chars[Math.floor(Math.random() * chars.length)],
            ).join("");
        const randomName = `${part(3)}-${part(4)}-${part(3)}`;

        try {
            await createRoomAPI({
                name: randomName,
                mode,
                settings: {
                    allowChat: true,
                    allowVideo: true,
                    allowAudio: true,
                    requireApproval: false,
                    e2ee: false,
                },
            });

            debugStore.log(
                `Encounter created: ${mode} ${randomName}`,
                "info",
                "New",
            );
            goto(`/m/${randomName}`);
        } catch (e: any) {
            error = e.message || "Failed to launch";
            isLoading = false;
            creatingMode = "";
        }
    }
</script>

<svelte:head>
    <title>New Space | Bedrud</title>
</svelte:head>

<div
    class="min-h-screen bg-background flex flex-col items-center justify-center p-6"
>
    <div class="w-full max-w-sm" in:fade={{ duration: 300 }}>
        {#if isLoading}
            <div
                class="flex flex-col items-center space-y-4"
                in:scale={{ duration: 200, start: 0.95 }}
            >
                <Loader2 class="h-8 w-8 text-primary animate-spin" />
                <p class="text-sm font-medium">Launching {creatingMode}...</p>
            </div>
        {:else}
            <div class="mb-12 flex items-center justify-between">
                <button
                    onclick={() => goto("/")}
                    class="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft class="h-5 w-5" />
                </button>
                <h1 class="text-xl font-bold">New Space</h1>
                <div class="w-5"></div>
            </div>

            {#if error}
                <div
                    class="mb-6 p-3 rounded-lg bg-destructive/5 text-destructive text-sm border border-destructive/10 flex items-center gap-2"
                >
                    <ShieldAlert class="h-4 w-4" />
                    {error}
                </div>
            {/if}

            <div class="space-y-3">
                <button
                    class="w-full flex items-center gap-4 p-4 rounded-2xl border bg-card hover:bg-accent/50 transition-colors text-left"
                    onclick={() => handleCreate("standard")}
                >
                    <div
                        class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"
                    >
                        <Video class="h-5 w-5" />
                    </div>
                    <div class="flex-1">
                        <div class="font-bold">Video Room</div>
                        <div class="text-xs text-muted-foreground">
                            Collaborative meeting
                        </div>
                    </div>
                    <ChevronRight class="h-4 w-4 text-muted-foreground/30" />
                </button>

            </div>
        {/if}
    </div>
</div>
