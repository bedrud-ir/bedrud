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

<tbody
	bind:this={ref}
	class={cn("[&_tr:last-child]:border-0", className)}
	{...restProps}
>
	{@render children?.()}
</tbody>
