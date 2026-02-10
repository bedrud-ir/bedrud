<script lang="ts">
    import type { GridTile } from "$lib/types/meeting";
    import type { Snippet } from "svelte";

    let {
        tiles,
        tileSnippet,
    }: {
        tiles: GridTile[];
        tileSnippet: Snippet<[GridTile]>;
    } = $props();

    // Derived grid configuration for optimal participant viewing
    let gridConfig = $derived(() => {
        const count = tiles.length;
        if (count <= 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-1 md:grid-cols-2";
        if (count <= 4) return "grid-cols-2";
        if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
        if (count <= 9) return "grid-cols-3";
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
    });
</script>

<div
    class="flex-1 bg-gray-950 p-4 md:p-6 overflow-hidden flex flex-col items-center justify-center"
>
    <div
        class="w-full h-full grid gap-4 md:gap-6 {gridConfig()}"
        style="grid-auto-rows: 1fr;"
    >
        {#each tiles as tile (tile.id)}
            <div
                class="w-full h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden rounded-3xl"
            >
                {@render tileSnippet(tile)}
            </div>
        {/each}
    </div>
</div>

<style>
    /* Ensure global video tiles fill their container perfectly */
    :global(.participant-video) {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        border-radius: inherit;
    }

    /* Desktop/Tablet fallback for single participant - force 16:9 for cinematic look */
    @media (min-width: 768px) {
        .grid-cols-1 :global(.participant-video) {
            max-height: 100%;
            width: auto !important;
            aspect-ratio: 16 / 9 !important;
        }
    }

    /* Mobile - let it fill more naturally */
    @media (max-width: 767px) {
        .grid-cols-1 :global(.participant-video) {
            width: 100% !important;
            height: 100% !important;
            aspect-ratio: unset !important;
        }
    }
</style>
