<script lang="ts">
    import { setContext } from "svelte";

    let {
        open = $bindable(false),
        onOpenChange,
        children,
    }: {
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
        children?: import("svelte").Snippet;
    } = $props();

    setContext("sheet", {
        get open() {
            return open;
        },
        set open(v) {
            open = v;
            onOpenChange?.(v);
        },
        close() {
            open = false;
            onOpenChange?.(false);
        },
    });
</script>

{@render children?.()}
