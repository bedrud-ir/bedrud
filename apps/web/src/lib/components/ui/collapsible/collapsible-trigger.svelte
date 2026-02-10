<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/utils.js";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: {
        ref?: HTMLButtonElement | null;
        class?: string;
        children?: import("svelte").Snippet;
        [key: string]: any;
    } = $props();

    const collapsible = getContext<any>("collapsible");
</script>

<button
    bind:this={ref}
    type="button"
    class={className}
    onclick={() => collapsible.toggle()}
    aria-expanded={collapsible.open}
    {...restProps}
>
    {@render children?.()}
</button>
