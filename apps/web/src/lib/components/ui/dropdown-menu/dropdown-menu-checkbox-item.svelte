<script lang="ts">
	import Check from "lucide-svelte/icons/check";
	import Minus from "lucide-svelte/icons/minus";
	import { cn } from "$lib/utils.js";
	import { getContext } from "svelte";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLElement | null;
		checked?: boolean;
		indeterminate?: boolean;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	const menu = getContext<any>("dropdown-menu");

	function toggle() {
		checked = !checked;
		// Typically you'd close the menu on click, unless you want it to stay open for multiple selections
		// menu.close();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={ref}
	class={cn(
		"hover:bg-accent hover:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		className,
	)}
	onclick={toggle}
	{...restProps}
>
	<span class="absolute left-2 flex size-3.5 items-center justify-center">
		{#if indeterminate}
			<Minus class="size-4" />
		{:else if checked}
			<Check class="size-4" />
		{/if}
	</span>
	{@render children?.()}
</div>
