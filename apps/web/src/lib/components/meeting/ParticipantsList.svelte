<script lang="ts">
    import {
        Room,
        Participant,
        RemoteParticipant,
        LocalParticipant,
        Track,
    } from "livekit-client";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import {
        X,
        Search,
        UserMinus,
        MicOff,
        VideoOff,
        Crown,
        MoreVertical,
        ShieldAlert,
        Mic,
        Volume2,
        VolumeX,
        MonitorUp,
        LayoutGrid,
    } from "lucide-svelte";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

    let {
        room,
        participants = [],
        onClose,
        adminId,
        onMute,
        onDisableVideo,
        onKick,
        onStageFocus,
    }: {
        room: Room;
        participants: Participant[];
        onClose: () => void;
        adminId?: string;
        onMute: (identity: string) => void;
        onDisableVideo: (identity: string) => void;
        onKick: (identity: string) => void;
        onStageFocus: (identity: string) => void;
    } = $props();

    let searchQuery = $state("");
    let localMutedIdentities = $state(new Set<string>());
    let openMenuIdentity = $state<string | null>(null);

    function toggleLocalMute(p: Participant) {
        if (localMutedIdentities.has(p.identity)) {
            localMutedIdentities.delete(p.identity);
            // Unmute logic: Find all microphone tracks and reset volume
            Array.from(p.trackPublications.values()).forEach((pub) => {
                if (
                    pub.source === Track.Source.Microphone &&
                    pub.track &&
                    "setVolume" in pub.track
                ) {
                    (pub.track as any).setVolume(1);
                }
            });
        } else {
            localMutedIdentities.add(p.identity);
            // Mute logic: Find all microphone tracks and set volume to 0
            Array.from(p.trackPublications.values()).forEach((pub) => {
                if (
                    pub.source === Track.Source.Microphone &&
                    pub.track &&
                    "setVolume" in pub.track
                ) {
                    (pub.track as any).setVolume(0);
                }
            });
        }
        localMutedIdentities = new Set(localMutedIdentities);
    }

    // Combine local and remote participants for the list
    let allParticipants = $derived.by(() => {
        if (!room) return [];
        return [room.localParticipant, ...participants];
    });

    let filteredParticipants = $derived.by(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return allParticipants;

        return allParticipants.filter((p) => {
            const name = p.name || p.identity;
            return name.toLowerCase().includes(query);
        });
    });

    function getParticipantAvatar(p: Participant) {
        if (p.metadata) {
            try {
                const meta = JSON.parse(p.metadata);
                return meta.avatar || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    function isLocalAdmin() {
        return room?.localParticipant.identity === adminId;
    }
</script>

<div
    class="flex flex-col h-full bg-background border-l border-border w-full shadow-2xl overflow-hidden font-sans"
>
    <!-- Header -->
    <div
        class="h-16 px-6 flex items-center justify-between border-b border-border"
    >
        <h2
            class="text-foreground text-[18px] font-medium flex items-center gap-2"
        >
            Participants
            <span
                class="text-[12px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
            >
                {allParticipants.length}
            </span>
        </h2>
        <Button
            variant="ghost"
            size="icon"
            onclick={onClose}
            class="text-muted-foreground hover:bg-accent rounded-full h-10 w-10"
        >
            <X class="h-5 w-5" />
        </Button>
    </div>

    <!-- Search -->
    <div class="p-4 border-b border-border">
        <div class="relative">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
                bind:value={searchQuery}
                placeholder="Search people"
                class="pl-9 bg-muted/50 border-none rounded-xl h-10 focus:ring-1 focus:ring-ring"
            />
        </div>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto py-2 scrollbar-custom bg-background">
        {#each filteredParticipants as p (p.identity)}
            <div
                class="px-4 py-2 group {openMenuIdentity === p.identity
                    ? 'bg-muted/70'
                    : 'hover:bg-muted/50'}"
            >
                <div class="flex items-center gap-3">
                    <!-- Avatar -->
                    <div class="relative flex-none">
                        <div
                            class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-[12px] font-bold text-muted-foreground uppercase overflow-hidden border border-border"
                        >
                            {#if getParticipantAvatar(p)}
                                <img
                                    src={getParticipantAvatar(p)}
                                    alt=""
                                    class="w-full h-full object-cover"
                                />
                            {:else}
                                {(p.name || p.identity).charAt(0)}
                            {/if}
                        </div>
                        {#if adminId === p.identity}
                            <div
                                class="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 border border-white dark:border-gray-800 shadow-sm"
                            >
                                <Crown
                                    class="h-2.5 w-2.5 text-white fill-white"
                                />
                            </div>
                        {/if}
                    </div>

                    <!-- Name & Status -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span
                                class="text-[14px] font-medium text-foreground truncate"
                            >
                                {p.name || p.identity}
                                {#if p instanceof LocalParticipant}
                                    <span
                                        class="text-muted-foreground font-normal"
                                        >(You)</span
                                    >
                                {/if}
                            </span>
                        </div>
                        <div class="flex items-center gap-2 mt-0.5">
                            {#if !p.isMicrophoneEnabled}
                                <MicOff class="h-3 w-3 text-red-500" />
                            {:else}
                                <Mic class="h-3 w-3 text-emerald-500" />
                            {/if}
                            {#if !p.isCameraEnabled}
                                <VideoOff
                                    class="h-3 w-3 text-muted-foreground"
                                />
                            {/if}
                            {#if localMutedIdentities.has(p.identity)}
                                <VolumeX class="h-3 w-3 text-red-500" />
                            {/if}
                        </div>
                    </div>

                    <!-- Actions -->
                    {#if !(p instanceof LocalParticipant)}
                        <div class="flex-none ml-auto">
                            <DropdownMenu.Root
                                onOpenChange={(open) => {
                                    if (open) openMenuIdentity = p.identity;
                                    else if (openMenuIdentity === p.identity)
                                        openMenuIdentity = null;
                                }}
                            >
                                <DropdownMenu.Trigger>
                                    {#snippet child({ props })}
                                        <Button
                                            {...props}
                                            variant="ghost"
                                            size="icon"
                                            class="h-8 w-8 rounded-full {isLocalAdmin() &&
                                            openMenuIdentity !== p.identity
                                                ? 'opacity-0 group-hover:opacity-100'
                                                : 'opacity-100'}"
                                        >
                                            <MoreVertical class="h-4 w-4" />
                                        </Button>
                                    {/snippet}
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content
                                    side="left"
                                    align="start"
                                    sideOffset={12}
                                    class="w-48 z-[200]"
                                >
                                    <DropdownMenu.Group>
                                        <DropdownMenu.Label
                                            class="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2"
                                        >
                                            Personal
                                        </DropdownMenu.Label>
                                        <DropdownMenu.Item
                                            class="flex items-center gap-2"
                                            onclick={() => toggleLocalMute(p)}
                                        >
                                            {#if localMutedIdentities.has(p.identity)}
                                                <Volume2
                                                    class="h-4 w-4 text-muted-foreground"
                                                />
                                                Unmute for me
                                            {:else}
                                                <VolumeX
                                                    class="h-4 w-4 text-muted-foreground"
                                                />
                                                Mute for me
                                            {/if}
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Group>

                                    {#if isLocalAdmin()}
                                        <DropdownMenu.Separator />
                                        <DropdownMenu.Group>
                                            <DropdownMenu.Label
                                                class="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2"
                                            >
                                                Management
                                            </DropdownMenu.Label>
                                            <DropdownMenu.Item
                                                class="flex items-center gap-2"
                                                onclick={() =>
                                                    onMute(p.identity)}
                                            >
                                                <MicOff
                                                    class="h-4 w-4 text-muted-foreground"
                                                />
                                                Mute for Everyone
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                class="flex items-center gap-2"
                                                onclick={() =>
                                                    onDisableVideo(p.identity)}
                                            >
                                                <VideoOff
                                                    class="h-4 w-4 text-muted-foreground"
                                                />
                                                Disable Video
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                class="flex items-center gap-2"
                                                onclick={() =>
                                                    onStageFocus(p.identity)}
                                            >
                                                <MonitorUp
                                                    class="h-4 w-4 text-muted-foreground"
                                                />
                                                Focus to Stage
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Separator />
                                            <DropdownMenu.Item
                                                class="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                                                onclick={() =>
                                                    onKick(p.identity)}
                                            >
                                                <UserMinus class="h-4 w-4" />
                                                Kick Participant
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Group>
                                    {/if}
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </div>
                    {/if}
                </div>
            </div>
        {/each}

        {#if filteredParticipants.length === 0}
            <div class="px-6 py-8 text-center">
                <p class="text-[13px] text-muted-foreground">
                    No participants found matching "{searchQuery}"
                </p>
            </div>
        {/if}
    </div>

    <!-- Info Box -->
    <div class="p-6 bg-muted/30 border-t border-border">
        <div class="flex gap-3 items-start">
            <ShieldAlert
                class="h-5 w-5 text-muted-foreground shrink-0 mt-0.5"
            />
            <p class="text-[12px] text-muted-foreground leading-normal">
                You can mute any participant for yourself. Only the host can
                manage participants for everyone.
            </p>
        </div>
    </div>
</div>

<style>
    .scrollbar-custom::-webkit-scrollbar {
        width: 6px;
    }
    .scrollbar-custom::-webkit-scrollbar-track {
        background: transparent;
    }
    .scrollbar-custom::-webkit-scrollbar-thumb {
        background-color: hsl(var(--muted-foreground) / 0.2);
        border-radius: 9999px;
        border: 2px solid transparent;
        background-clip: padding-box;
    }
    .scrollbar-custom::-webkit-scrollbar-thumb:hover {
        background-color: hsl(var(--muted-foreground) / 0.4);
    }
</style>
