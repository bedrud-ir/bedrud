<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLOListElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<ol
	bind:this={ref}
	class={cn(
		"text-muted-foreground flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2.5",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</ol>
