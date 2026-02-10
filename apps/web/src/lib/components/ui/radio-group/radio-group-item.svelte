<script lang="ts">
	import { getContext } from "svelte";
	import Circle from "lucide-svelte/icons/circle";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value,
		class: className,
		...restProps
	}: {
		ref?: HTMLButtonElement | null;
		value: string;
		class?: string;
		[key: string]: any;
	} = $props();

	const group = getContext<any>("radio-group");
	const isActive = $derived(group.value === value);
</script>

<button
	bind:this={ref}
	type="button"
	role="radio"
	aria-checked={isActive}
	class={cn(
		"aspect-square size-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
		className,
	)}
	onclick={() => (group.value = value)}
	{...restProps}
>
	<div class="flex items-center justify-center">
		{#if isActive}
			<Circle class="size-2.5 fill-current text-current" />
		{/if}
	</div>
</button>
