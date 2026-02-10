<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/utils.js";
    import { slide } from "svelte/transition";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: {
        ref?: HTMLDivElement | null;
        class?: string;
        children?: import("svelte").Snippet;
        [key: string]: any;
    } = $props();

    const collapsible = getContext<any>("collapsible");
</script>

{#if collapsible.open}
    <div
        bind:this={ref}
        class={cn("overflow-hidden", className)}
        transition:slide={{ duration: 200 }}
        {...restProps}
    >
        {@render children?.()}
    </div>
{/if}
