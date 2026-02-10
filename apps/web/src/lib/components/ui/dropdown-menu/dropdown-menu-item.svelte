<script lang="ts">
	import { getContext } from "svelte";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		disabled = false,
		inset,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		disabled?: boolean;
		inset?: boolean;
		[key: string]: any;
	} = $props();

	const menu = getContext<any>("dropdown-menu");

	function handleClick() {
		if (disabled) return;
		menu.close();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={ref}
	class={cn(
		"focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
		inset && "pl-8",
		"hover:bg-accent hover:text-accent-foreground",
		className,
	)}
	data-disabled={disabled ? "" : undefined}
	onclick={handleClick}
	{...restProps}
>
	{@render children?.()}
</div>
