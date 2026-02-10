<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLUListElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<ul
	bind:this={ref}
	data-sidebar="menu"
	class={cn("flex w-full min-w-0 flex-col gap-1", className)}
	{...restProps}
>
	{@render children?.()}
</ul>
