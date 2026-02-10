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

<p class={cn("text-muted-foreground text-sm", className)} {...restProps}>
	{@render children?.()}
</p>
