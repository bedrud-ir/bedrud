<script lang="ts">
	import { getContext } from "svelte";
	import { cn } from "$lib/utils.js";
	import { fade } from "svelte/transition";

	let { class: className, ...restProps } = $props<{
		class?: string;
		[key: string]: any;
	}>();
	const sheet = getContext<any>("sheet");
</script>

{#if sheet.open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		transition:fade={{ duration: 200 }}
		class={cn("bg-black/80 fixed inset-0 z-50", className)}
		onclick={() => sheet.close()}
		{...restProps}
	></div>
{/if}
