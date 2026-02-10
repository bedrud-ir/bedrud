<script lang="ts">
	import Ellipsis from "lucide-svelte/icons/ellipsis";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: {
		ref?: HTMLSpanElement | null;
		class?: string;
		[key: string]: any;
	} = $props();
</script>

<span
	bind:this={ref}
	role="presentation"
	aria-hidden="true"
	class={cn("flex size-9 items-center justify-center", className)}
	{...restProps}
>
	<Ellipsis class="size-4" />
	<span class="sr-only">More</span>
</span>
