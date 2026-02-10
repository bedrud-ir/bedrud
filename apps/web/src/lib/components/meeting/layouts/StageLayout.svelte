<script lang="ts">
    import type { GridTile, ParticipantStatus } from "$lib/types/meeting";
    import type { Snippet } from "svelte";
    import { MicOff, MonitorUp } from "lucide-svelte";
    import { Track } from "livekit-client";

    let {
        stageTile,
        nonStageTiles,
        tileSnippet,
        audioLevels,
        participantStatuses,
        isAdmin,
        onFocus,
        attachTrack,
        getParticipantAvatar,
        AUDIO_THRESHOLD_UI,
    }: {
        stageTile: GridTile;
        nonStageTiles: GridTile[];
        tileSnippet: Snippet<[GridTile]>;
        audioLevels: Map<string, number>;
        participantStatuses: Map<string, ParticipantStatus>;
        isAdmin: boolean;
        onFocus: (identity: string) => void;
        attachTrack: any;
        getParticipantAvatar: (identity: string) => string | null;
        AUDIO_THRESHOLD_UI: number;
    } = $props();
</script>

<div class="flex-1 flex flex-col overflow-hidden bg-black/95">
    <!-- Stage Focused Area -->
    <div class="flex-1 p-4 flex items-center justify-center min-h-0">
        <div class="w-full h-full max-w-6xl max-h-full">
            {@render tileSnippet(stageTile)}
        </div>
    </div>

    <!-- Small Bottom Row -->
    <div
        class="h-28 bg-black/60 border-t border-white/5 flex items-center gap-3 px-4 overflow-x-auto overflow-y-hidden scrollbar-custom py-2"
    >
        {#each nonStageTiles as tile (tile.id)}
            <button
                class="h-full aspect-video flex-shrink-0 rounded-lg overflow-hidden border border-white/10 group relative {isAdmin
                    ? 'cursor-pointer hover:border-blue-500/50 hover:scale-105'
                    : 'cursor-default'}"
                class:ring-2={(audioLevels.get(tile.participant.identity) ||
                    0) > AUDIO_THRESHOLD_UI}
                class:ring-blue-500={(audioLevels.get(
                    tile.participant.identity,
                ) || 0) > AUDIO_THRESHOLD_UI}
                onclick={() => {
                    if (isAdmin) {
                        onFocus(tile.participant.identity);
                    }
                }}
            >
                <!-- Avatar Display (No Video) -->
                <div
                    class="absolute inset-0 bg-gray-900 flex items-center justify-center"
                >
                    <div class="relative">
                        {#if (audioLevels.get(tile.participant.identity) || 0) > AUDIO_THRESHOLD_UI}
                            <!-- Removed animations -->
                        {/if}

                        {#if getParticipantAvatar(tile.participant.identity)}
                            <img
                                src={getParticipantAvatar(
                                    tile.participant.identity,
                                )}
                                alt=""
                                class="w-11 h-11 rounded-full object-cover border border-white/5 shadow-2xl relative z-10"
                            />
                        {:else}
                            <div
                                class="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-base font-black shadow-2xl relative z-10"
                            >
                                {tile.displayName.charAt(0).toUpperCase()}
                            </div>
                        {/if}
                    </div>
                </div>

                <div
                    class="absolute bottom-1 left-2 text-[9px] font-medium text-white/70 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-md truncate max-w-[85%]"
                >
                    {tile.displayName}
                </div>

                {#if participantStatuses.get(tile.participant.identity)?.audio === false}
                    <div
                        class="absolute top-1 right-1 p-1 bg-red-500/60 rounded"
                    >
                        <MicOff class="h-2 w-2 text-white" />
                    </div>
                {/if}

                {#if isAdmin}
                    <div
                        class="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 flex items-center justify-center"
                    >
                        <MonitorUp
                            class="h-4 w-4 text-white opacity-0 group-hover:opacity-100"
                        />
                    </div>
                {/if}
            </button>
        {/each}
    </div>
</div>
