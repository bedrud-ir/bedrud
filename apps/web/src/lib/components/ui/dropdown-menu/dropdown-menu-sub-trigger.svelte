<script lang="ts">
	import ChevronRight from "lucide-svelte/icons/chevron-right";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		inset,
		children,
		...restProps
	}: {
		ref?: HTMLElement | null;
		class?: string;
		inset?: boolean;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		"focus:bg-accent data-[state=open]:bg-accent focus:text-accent-foreground data-[state=open]:text-accent-foreground flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
		inset && "pl-8",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronRight class="ml-auto size-4" />
</div>
