<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLTableSectionElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<thead bind:this={ref} class={cn("[&_tr]:border-b", className)} {...restProps}>
	{@render children?.()}
</thead>
