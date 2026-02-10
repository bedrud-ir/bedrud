<script lang="ts">
    import { setContext } from "svelte";

    let { children } = $props<{ children?: import("svelte").Snippet }>();
    let open = $state(false);

    setContext("tooltip", {
        get open() {
            return open;
        },
        set open(v) {
            open = v;
        },
    });
</script>

<div class="relative inline-block">
    {@render children?.()}
</div>
