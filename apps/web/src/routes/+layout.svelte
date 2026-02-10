<script lang="ts">
	import "../app.css";
	import { themeStore } from "$lib/stores/theme.store";
	import { onMount } from "svelte";

	let { children } = $props();

	onMount(() => {
		themeStore.init();
	});
</script>

{@render children()}
