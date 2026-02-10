<script lang="ts">
    import { getContext } from "svelte";

    let { children, child, asChild, ...restProps } = $props<{
        children?: import("svelte").Snippet;
        child?: import("svelte").Snippet<[{ props: Record<string, any> }]>;
        [key: string]: any;
    }>();

    const menu = getContext<any>("dropdown-menu");

    const triggerProps = $derived({
        onclick: (e: MouseEvent) => {
            e.stopPropagation();
            menu.toggle();
        },
        "aria-expanded": menu.open,
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
