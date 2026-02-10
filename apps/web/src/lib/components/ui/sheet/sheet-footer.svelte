<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		class: className,
		children,
		...restProps
	}: {
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<div
	class={cn(
		"flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
