<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import PanelLeft from "lucide-svelte/icons/panel-left";
	import { useSidebar } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		...restProps
	}: {
		ref?: any;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		[key: string]: any;
	} = $props();

	const sidebar = useSidebar();
</script>

<Button
	type="button"
	onclick={(e: MouseEvent) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	data-sidebar="trigger"
	variant="ghost"
	size="icon"
	class={cn("h-7 w-7", className)}
	{...restProps}
>
	<PanelLeft />
	<span class="sr-only">Toggle Sidebar</span>
</Button>
