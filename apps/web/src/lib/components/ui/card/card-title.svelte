<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		children,
		...restProps
	}: {
		ref?: HTMLHeadingElement | null;
		class?: string;
		level?: 1 | 2 | 3 | 4 | 5 | 6;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	const tag = `h${level}`;
</script>

<svelte:element
	this={tag}
	bind:this={ref}
	class={cn("text-2xl font-semibold leading-none tracking-tight", className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
