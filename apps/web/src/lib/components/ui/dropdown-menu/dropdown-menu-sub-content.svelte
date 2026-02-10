<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		"bg-popover text-popover-foreground z-50 min-w-32 overflow-hidden rounded-md border p-1 shadow-lg",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
