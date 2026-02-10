<script lang="ts">
	import { getContext } from "svelte";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value,
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLButtonElement | null;
		value: string;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	const tabs = getContext<any>("tabs");
	const isActive = $derived(tabs.value === value);
</script>

<button
	bind:this={ref}
	type="button"
	class={cn(
		"ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
		isActive
			? "bg-background text-foreground shadow-sm"
			: "hover:bg-background/50",
		className,
	)}
	onclick={() => (tabs.value = value)}
	{...restProps}
>
	{@render children?.()}
</button>
