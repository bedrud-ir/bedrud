<script lang="ts">
	import { getContext } from "svelte";
	import { cn } from "$lib/utils.js";
	import { fade } from "svelte/transition";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	const select = getContext<any>("select");
</script>

{#if select.open}
	<div
		bind:this={ref}
		transition:fade={{ duration: 100 }}
		class={cn(
			"bg-popover text-popover-foreground absolute top-full z-50 mt-1 max-h-96 min-w-32 overflow-hidden rounded-md border shadow-md",
			className,
		)}
		{...restProps}
	>
		<div class="p-1">
			{@render children?.()}
		</div>
	</div>
{/if}
