<script lang="ts">
    import { setContext } from "svelte";

    let {
        value = $bindable(),
        onValueChange,
        children,
    }: {
        value?: string;
        onValueChange?: (value: string) => void;
        children?: import("svelte").Snippet;
    } = $props();

    let open = $state(false);

    setContext("select", {
        get value() {
            return value as string;
        },
        set value(v: string) {
            value = v;
            onValueChange?.(v);
            open = false;
        },
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

<div class="relative w-full">
    {@render children?.()}
</div>

{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-40" onclick={() => (open = false)}></div>
{/if}
