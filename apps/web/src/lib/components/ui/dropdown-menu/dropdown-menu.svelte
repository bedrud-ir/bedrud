<script lang="ts">
    import { setContext } from "svelte";

    let {
        children,
        open = $bindable(false),
        onOpenChange,
    }: {
        children?: import("svelte").Snippet;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
    } = $props();

    $effect(() => {
        onOpenChange?.(open);
    });

    setContext("dropdown-menu", {
        get open() {
            return open;
        },
        set open(v) {
            open = v;
        },
        toggle() {
            open = !open;
        },
        close() {
            open = false;
        },
    });
</script>

<div class="relative inline-block w-full">
    {@render children?.()}
</div>

{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-40"
        onclick={() => (open = false)}
        oncontextmenu={(e) => {
            e.preventDefault();
            open = false;
        }}
    ></div>
{/if}
