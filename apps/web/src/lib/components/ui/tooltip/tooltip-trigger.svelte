<script lang="ts">
    import { getContext } from "svelte";

    let { children, child, asChild, ...restProps } = $props<{
        children?: import("svelte").Snippet;
        child?: import("svelte").Snippet<[{ props: Record<string, any> }]>;
        [key: string]: any;
    }>();

    const tooltip = getContext<any>("tooltip");

    const triggerProps = $derived({
        onmouseenter: () => (tooltip.open = true),
        onmouseleave: () => (tooltip.open = false),
        onfocus: () => (tooltip.open = true),
        onblur: () => (tooltip.open = false),
        ...restProps,
    });
</script>

{#if child}
    {@render child({ props: triggerProps })}
{:else}
    <button type="button" {...triggerProps}>
        {@render children?.()}
    </button>
{/if}
