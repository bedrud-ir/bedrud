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
	data-sidebar="group"
	class={cn("relative flex w-full min-w-0 flex-col p-2", className)}
	{...restProps}
>
	{@render children?.()}
</div>
