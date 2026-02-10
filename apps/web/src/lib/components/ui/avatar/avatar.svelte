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
		"relative flex size-10 shrink-0 overflow-hidden rounded-full",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
