<script lang="ts">
    import { setContext } from "svelte";
    import { cn } from "$lib/utils.js";

    let {
        open = $bindable(false),
        class: className,
        children,
        ...restProps
    }: {
        open?: boolean;
        class?: string;
        children?: import("svelte").Snippet;
        [key: string]: any;
    } = $props();

    setContext("collapsible", {
        get open() {
            return open;
        },
        toggle() {
            open = !open;
        },
    });
</script>

<div class={className} {...restProps}>
    {@render children?.()}
</div>
