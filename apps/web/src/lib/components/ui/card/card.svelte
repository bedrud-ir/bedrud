<script lang="ts">
	import { cn } from "$lib/utils.js";

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
</script>

<div
	bind:this={ref}
	class={cn(
		"bg-card text-card-foreground rounded-lg border shadow-sm",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
