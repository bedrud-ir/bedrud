<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		orientation = "horizontal",
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		class?: string;
		orientation?: "horizontal" | "vertical";
		[key: string]: any;
	} = $props();
</script>

<div
	bind:this={ref}
	role="none"
	class={cn(
		"bg-border shrink-0",
		orientation === "horizontal" ? "h-[1px] w-full" : "min-h-full w-[1px]",
		className,
	)}
	{...restProps}
></div>
