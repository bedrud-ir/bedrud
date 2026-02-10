<script lang="ts">
	import { setContext } from "svelte";
	import { cn } from "$lib/utils.js";

	let {
		value = $bindable(),
		class: className,
		children,
		...restProps
	}: {
		value?: string;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	setContext("radio-group", {
		get value() {
			return value as string;
		},
		set value(v: string) {
			value = v;
		},
	});
</script>

<div class={cn("grid gap-2", className)} role="radiogroup" {...restProps}>
	{@render children?.()}
</div>
