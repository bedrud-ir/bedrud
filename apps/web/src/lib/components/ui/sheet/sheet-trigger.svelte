<script lang="ts">
    import { getContext } from "svelte";

    let { children, ...restProps } = $props<{
        children?: import("svelte").Snippet;
        [key: string]: any;
    }>();

    const sheet = getContext<any>("sheet");
</script>

<button type="button" onclick={() => (sheet.open = true)} {...restProps}>
    {@render children?.()}
</button>
