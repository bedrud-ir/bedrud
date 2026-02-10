<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		href,
		...restProps
	}: {
		ref?: HTMLAnchorElement | HTMLElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		href?: string;
		[key: string]: any;
	} = $props();

	const Component = href ? "a" : "span";
</script>

<svelte:element
	this={Component}
	bind:this={ref}
	{href}
	class={cn("hover:text-foreground transition-colors", className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
