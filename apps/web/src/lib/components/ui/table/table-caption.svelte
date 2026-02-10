<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLTableCaptionElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<caption
	bind:this={ref}
	class={cn("text-muted-foreground mt-4 text-sm", className)}
	{...restProps}
>
	{@render children?.()}
</caption>
