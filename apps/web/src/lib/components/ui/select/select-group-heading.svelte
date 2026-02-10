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

<div class={cn("px-2 py-1.5 text-sm font-semibold", className)} {...restProps}>
	{@render children?.()}
</div>
