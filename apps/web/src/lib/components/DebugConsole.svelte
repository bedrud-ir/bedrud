<script lang="ts">
    import { debugStore } from "$lib/stores/debug.store";
    import { fade, slide } from "svelte/transition";
    import { Terminal, X, Trash2, ChevronDown, ChevronUp } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";

    let isOpen = $state(false);
    let isMinimized = $state(true);
    let scrollContainer = $state<HTMLDivElement>();

    function toggle() {
        isOpen = !isOpen;
    }

    function toggleMinimize() {
        isMinimized = !isMinimized;
    }

    function clear() {
        debugStore.clear();
    }

    function formatTime(date: Date) {
        return (
            date.toLocaleTimeString([], {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }) +
            "." +
            date.getMilliseconds().toString().padStart(3, "0")
        );
    }

    $effect(() => {
        if (scrollContainer && !isMinimized) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    });

    const getLevelColor = (level: string) => {
        switch (level) {
            case "error":
                return "text-red-500";
            case "warn":
                return "text-yellow-500";
            case "debug":
                return "text-blue-400";
            default:
                return "text-green-400";
        }
    };
</script>

{#if !isOpen}
    <button
        onclick={toggle}
        class="fixed bottom-4 right-4 z-[9999] bg-black/80 text-green-500 p-2 rounded-full border border-green-500/30 hover:bg-black hover:border-green-500 transition-all shadow-lg"
        title="Show Debug Console"
    >
        <Terminal size={20} />
    </button>
{:else}
    <div
        class="fixed bottom-4 right-4 z-[9999] bg-black/90 border border-white/10 rounded-lg shadow-2xl flex flex-col transition-all overflow-hidden"
        style="width: {isMinimized ? '300px' : '600px'}; height: {isMinimized
            ? '40px'
            : '400px'}; max-width: calc(100vw - 32px);"
        in:fade={{ duration: 150 }}
    >
        <!-- Header -->
        <div
            class="flex items-center justify-between px-3 h-10 border-b border-white/10 shrink-0 select-none"
        >
            <div class="flex items-center gap-2">
                <Terminal size={14} class="text-green-500" />
                <span class="text-xs font-mono font-bold text-white/70"
                    >DEBUG CONSOLE</span
                >
            </div>
            <div class="flex items-center gap-1">
                <button
                    onclick={toggleMinimize}
                    class="p-1 hover:bg-white/10 rounded text-white/50"
                >
                    {#if isMinimized}
                        <ChevronUp size={14} />
                    {:else}
                        <ChevronDown size={14} />
                    {/if}
                </button>
                <button
                    onclick={clear}
                    class="p-1 hover:bg-white/10 rounded text-white/50"
                    title="Clear logs"
                >
                    <Trash2 size={14} />
                </button>
                <button
                    onclick={toggle}
                    class="p-1 hover:bg-white/10 rounded text-white/50"
                >
                    <X size={14} />
                </button>
            </div>
        </div>

        <!-- Logs Content -->
        {#if !isMinimized}
            <div
                bind:this={scrollContainer}
                class="flex-1 overflow-y-auto p-2 font-mono text-[10px] leading-tight space-y-1 bg-black/40"
            >
                {#if $debugStore.length === 0}
                    <div class="text-white/30 text-center py-4 italic">
                        No logs yet...
                    </div>
                {/if}
                {#each $debugStore as log}
                    <div class="flex gap-2 group border-b border-white/5 pb-1">
                        <span class="text-white/20 shrink-0"
                            >{formatTime(log.timestamp)}</span
                        >
                        <span
                            class="text-white/40 italic shrink-0"
                            style="width: 40px;">[{log.context}]</span
                        >
                        <span class={getLevelColor(log.level)}
                            >{log.message}</span
                        >
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}
