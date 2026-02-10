<script lang="ts">
	import ChevronUp from "lucide-svelte/icons/chevron-up";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: {
		ref?: HTMLElement | null;
		class?: string;
		[key: string]: any;
	} = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		"flex cursor-default items-center justify-center py-1",
		className,
	)}
	{...restProps}
>
	<ChevronUp class="size-4" />
</div>
