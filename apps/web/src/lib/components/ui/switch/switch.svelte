<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		disabled = false,
		name = "",
		id = "",
		...restProps
	}: {
		ref?: HTMLButtonElement | null;
		class?: string;
		checked?: boolean;
		disabled?: boolean;
		name?: string;
		id?: string;
		[key: string]: any;
	} = $props();

	function toggle() {
		if (disabled) return;
		checked = !checked;
	}
</script>

<button
	bind:this={ref}
	type="button"
	role="switch"
	aria-checked={checked}
	{disabled}
	{id}
	class={cn(
		"focus-visible:ring-ring focus-visible:ring-offset-background peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
		checked ? "bg-primary" : "bg-input",
		className,
	)}
	onclick={toggle}
	{...restProps}
>
	<span
		class={cn(
			"bg-background pointer-events-none block size-5 rounded-full shadow-lg ring-0 transition-transform",
			checked ? "translate-x-5" : "translate-x-0",
		)}
	></span>
</button>

<input
	type="checkbox"
	{checked}
	{disabled}
	{name}
	{id}
	class="sr-only"
	tabindex="-1"
/>
