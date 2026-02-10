<script lang="ts">
	import ChevronRight from "lucide-svelte/icons/chevron-right";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLLIElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<li
	bind:this={ref}
	role="presentation"
	aria-hidden="true"
	class={cn("[&>svg]:size-3.5", className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<ChevronRight />
	{/if}
</li>
