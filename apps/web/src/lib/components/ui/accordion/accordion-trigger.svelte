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

	const accordion = getContext<any>("accordion");
	const item = getContext<any>("accordion-item");

	const isOpen = $derived(accordion.openItems.includes(item.value));
</script>

<div class="flex">
	<button
		bind:this={ref}
		type="button"
		class={cn(
			"flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
			isOpen && "[&>svg]:rotate-180",
			className,
		)}
		onclick={() => accordion.toggle(item.value)}
		aria-expanded={isOpen}
		{...restProps}
	>
		{@render children?.()}
		<ChevronDown
			class="size-4 shrink-0 transition-transform duration-200"
		/>
	</button>
</div>
