<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLTableSectionElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<tfoot
	bind:this={ref}
	class={cn(
		"bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</tfoot>
