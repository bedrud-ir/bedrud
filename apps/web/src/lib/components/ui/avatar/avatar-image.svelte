<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		src,
		alt = "",
		...restProps
	}: {
		ref?: HTMLImageElement | null;
		class?: string;
		src?: string;
		alt?: string;
		[key: string]: any;
	} = $props();

	let error = $state(false);
</script>

{#if src && !error}
	<img
		bind:this={ref}
		{src}
		{alt}
		class={cn("aspect-square h-full w-full", className)}
		onerror={() => (error = true)}
		{...restProps}
	/>
{/if}
