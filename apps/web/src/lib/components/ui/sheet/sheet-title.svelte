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

<h2
	class={cn("text-foreground text-lg font-semibold", className)}
	{...restProps}
>
	{@render children?.()}
</h2>
