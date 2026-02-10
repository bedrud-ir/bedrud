<script lang="ts">
    let { children } = $props<{ children?: import("svelte").Snippet }>();
</script>

{@render children?.()}
