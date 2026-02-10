<script lang="ts">
	import { getContext } from "svelte";
	import { cn } from "$lib/utils.js";
	import { fade } from "svelte/transition";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		children,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		class?: string;
		sideOffset?: number;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	const tooltip = getContext<any>("tooltip");
</script>

{#if tooltip.open}
	<div
		bind:this={ref}
		transition:fade={{ duration: 100 }}
		class={cn(
			"bg-popover text-popover-foreground z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md",
			"absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap", // Simple side:right for sidebar
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
	</div>
{/if}
