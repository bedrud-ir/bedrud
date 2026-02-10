<script lang="ts">
	import { getContext } from "svelte";
	import ChevronDown from "lucide-svelte/icons/chevron-down";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLButtonElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	const select = getContext<any>("select");
</script>

<button
	bind:this={ref}
	type="button"
	class={cn(
		"border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
		className,
	)}
	onclick={() => select.toggle()}
	{...restProps}
>
	{@render children?.()}
	<ChevronDown class="size-4 opacity-50" />
</button>
