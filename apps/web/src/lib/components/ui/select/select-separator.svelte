<script lang="ts">
	import { cn } from "$lib/utils.js";

	let { class: className, ...restProps } = $props<{
		class?: string;
		[key: string]: any;
	}>();
</script>

<div class={cn("bg-muted -mx-1 my-1 h-px", className)} {...restProps}></div>
