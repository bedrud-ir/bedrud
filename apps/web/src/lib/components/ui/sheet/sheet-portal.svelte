<script lang="ts">
    let { children } = $props<{ children?: import("svelte").Snippet }>();
</script>

<div class="fixed inset-0 z-50">
    {@render children?.()}
</div>
