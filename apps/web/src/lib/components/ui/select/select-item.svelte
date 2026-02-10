<script lang="ts">
	import Check from "lucide-svelte/icons/check";
	import { getContext } from "svelte";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		class?: string;
		value: string;
		label?: string;
		children?: import("svelte").Snippet<
			[{ selected: boolean; highlighted: boolean }]
		>;
		[key: string]: any;
	} = $props();

	const select = getContext<any>("select");
	const selected = $derived(select.value === value);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={ref}
	class={cn(
		"hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		className,
	)}
	onclick={() => (select.value = value)}
	{...restProps}
>
	<span class="absolute left-2 flex size-3.5 items-center justify-center">
		{#if selected}
			<Check class="size-4" />
		{/if}
	</span>
	{#if children}
		{@render children({ selected, highlighted: false })}
	{:else}
		{label || value}
	{/if}
</div>
