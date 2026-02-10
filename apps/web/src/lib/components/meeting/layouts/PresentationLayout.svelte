<script lang="ts">
    import type { GridTile, ParticipantStatus } from "$lib/types/meeting";
    import type { Snippet } from "svelte";
    import { MicOff, MonitorUp } from "lucide-svelte";

    let {
        screenTiles,
        cameraTiles,
        tileSnippet,
        audioLevels,
        participantStatuses,
        isAdmin,
        onFocus,
        getParticipantAvatar,
        AUDIO_THRESHOLD_UI,
    }: {
        screenTiles: GridTile[];
        cameraTiles: GridTile[];
        tileSnippet: Snippet<[GridTile]>;
        audioLevels: Map<string, number>;
        participantStatuses: Map<string, ParticipantStatus>;
        isAdmin: boolean;
        onFocus: (identity: string) => void;
        getParticipantAvatar: (identity: string) => string | null;
        AUDIO_THRESHOLD_UI: number;
    } = $props();
</script>

<div class="flex-1 flex flex-col md:flex-row overflow-hidden bg-background">
    <!-- Screen Share Area -->
    <div class="flex-1 bg-muted/30 dark:bg-black/95 p-4 overflow-auto min-h-0">
        <div
            class="w-full h-full grid gap-4 items-center justify-center {screenTiles.length ===
            1
                ? 'single-tile'
                : 'multi-tile'}"
        >
            {#each screenTiles as tile (tile.id)}
                {@render tileSnippet(tile)}
            {/each}
        </div>
    </div>

    <!-- Participant Sidebar -->
    <div
        class="w-full md:w-72 border-t md:border-l border-border bg-background/50 overflow-y-auto p-4 flex flex-row md:flex-col gap-4 min-h-[120px] md:min-h-0 scrollbar-custom"
    >
        {#each cameraTiles as tile (tile.id)}
            <button
                class="w-48 md:w-full aspect-video flex-shrink-0 rounded-lg overflow-hidden border border-white/10 group relative {isAdmin
                    ? 'cursor-pointer hover:border-blue-500/50 hover:scale-[1.02]'
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
                <!-- Avatar Display -->
                <div
                    class="absolute inset-0 bg-gray-900 flex items-center justify-center"
                >
                    <div class="relative scale-75 md:scale-100">
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

<style>
    .single-tile {
        grid-template-columns: 1fr;
        max-width: 1200px;
        margin: 0 auto;
    }

    .multi-tile {
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        align-content: center;
    }
</style>
