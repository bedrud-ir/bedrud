<script lang="ts">
	import Circle from "lucide-svelte/icons/circle";
	import { cn } from "$lib/utils.js";
	import { getContext } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		value,
		children,
		...restProps
	}: {
		ref?: HTMLElement | null;
		class?: string;
		value: string;
		children?: import("svelte").Snippet<[{ checked: boolean }]>;
		[key: string]: any;
	} = $props();

	// Assuming a radio group context if needed, but for now simple toggle or use parent
	const checked = false; // This would normally come from context
</script>

<div
	bind:this={ref}
	class={cn(
		"hover:bg-accent hover:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		className,
	)}
	{...restProps}
>
	<span class="absolute left-2 flex size-3.5 items-center justify-center">
		{#if checked}
			<Circle class="size-2 fill-current" />
		{/if}
	</span>
	{@render children?.({ checked })}
</div>
