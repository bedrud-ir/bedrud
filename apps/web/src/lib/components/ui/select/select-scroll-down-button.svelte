<script lang="ts">
	import ChevronDown from "lucide-svelte/icons/chevron-down";
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
	<ChevronDown class="size-4" />
</div>
