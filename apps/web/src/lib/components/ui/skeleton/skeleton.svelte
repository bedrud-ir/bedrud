<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		class?: string;
		[key: string]: any;
	} = $props();
</script>

<div
	bind:this={ref}
	class={cn("bg-muted animate-pulse rounded-md", className)}
	{...restProps}
></div>
