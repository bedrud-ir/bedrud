<script lang="ts">
	import { getContext } from "svelte";
	import { cn } from "$lib/utils.js";
	import { fade } from "svelte/transition";

	let {
		ref = $bindable(null),
		class: className,
		side = "bottom",
		align = "center",
		sideOffset = 4,
		children,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		class?: string;
		side?: "top" | "bottom" | "left" | "right";
		align?: "start" | "center" | "end";
		sideOffset?: number;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	const menu = getContext<any>("dropdown-menu");

	const positionClass = $derived.by(() => {
		if (side === "bottom") return "top-full mt-1 left-0";
		if (side === "top") return "bottom-full mb-1 left-0";
		if (side === "right") return "left-full ml-1 top-0";
		if (side === "left") return "right-full mr-1 top-0";
		return "";
	});
</script>

{#if menu.open}
	<div
		bind:this={ref}
		transition:fade={{ duration: 100 }}
		class={cn(
			"bg-popover text-popover-foreground z-50 min-w-32 overflow-hidden rounded-md border p-1 shadow-md",
			"absolute",
			positionClass,
			className,
		)}
		onclick={(e) => e.stopPropagation()}
		{...restProps}
	>
		{@render children?.()}
	</div>
{/if}
