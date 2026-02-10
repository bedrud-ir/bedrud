<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		class: className,
		children,
		...restProps
	} = $props<{
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	}>();
</script>

<span
	class={cn(
		"text-muted-foreground ml-auto text-xs tracking-widest",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</span>
