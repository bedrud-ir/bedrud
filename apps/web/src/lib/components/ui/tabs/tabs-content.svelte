<script lang="ts">
	import { getContext } from "svelte";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value,
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		value: string;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	const tabs = getContext<any>("tabs");
	const isActive = $derived(tabs.value === value);
</script>

{#if isActive}
	<div
		bind:this={ref}
		class={cn(
			"ring-offset-background focus-visible:ring-ring mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
	</div>
{/if}
