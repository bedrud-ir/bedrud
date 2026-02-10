<script lang="ts">
	import { getContext } from "svelte";
	import { cn } from "$lib/utils.js";
	import { slide } from "svelte/transition";

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

	const accordion = getContext<any>("accordion");
	const item = getContext<any>("accordion-item");

	const isOpen = $derived(accordion.openItems.includes(item.value));
</script>

{#if isOpen}
	<div
		bind:this={ref}
		class={cn("overflow-hidden text-sm transition-all", className)}
		transition:slide={{ duration: 200 }}
		{...restProps}
	>
		<div class="pb-4 pt-0">
			{@render children?.()}
		</div>
	</div>
{/if}
