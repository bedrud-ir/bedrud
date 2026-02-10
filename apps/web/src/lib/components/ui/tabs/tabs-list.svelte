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
		"bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
