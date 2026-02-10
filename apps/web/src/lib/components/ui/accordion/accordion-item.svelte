<script lang="ts">
	import { setContext } from "svelte";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value,
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		value: string;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	setContext("accordion-item", { value });
</script>

<div
	bind:this={ref}
	class={cn("border-b", className)}
	data-state={value}
	{...restProps}
>
	{@render children?.()}
</div>
