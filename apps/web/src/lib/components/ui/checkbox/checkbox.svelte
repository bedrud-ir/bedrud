<script lang="ts">
	import Check from "lucide-svelte/icons/check";
	import Minus from "lucide-svelte/icons/minus";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		disabled = false,
		required = false,
		name = "",
		id = "",
		...restProps
	}: {
		ref?: HTMLButtonElement | null;
		checked?: boolean | "indeterminate";
		indeterminate?: boolean;
		class?: string;
		disabled?: boolean;
		required?: boolean;
		name?: string;
		id?: string;
		[key: string]: any;
	} = $props();

	function toggle() {
		if (disabled) return;
		if (checked === "indeterminate" || indeterminate) {
			checked = true;
			indeterminate = false;
		} else {
			checked = !checked;
		}
	}
</script>

<button
	bind:this={ref}
	type="button"
	role="checkbox"
	aria-checked={indeterminate
		? "mixed"
		: checked === "indeterminate"
			? "mixed"
			: checked}
	aria-required={required}
	{disabled}
	{id}
	class={cn(
		"border-primary ring-offset-background focus-visible:ring-ring peer box-content size-4 shrink-0 rounded-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
		checked || indeterminate
			? "bg-primary text-primary-foreground"
			: "bg-background",
		className,
	)}
	onclick={toggle}
	{...restProps}
>
	<div class="flex size-4 items-center justify-center text-current">
		{#if indeterminate}
			<Minus class="size-3.5" />
		{:else if checked}
			<Check class="size-3.5" />
		{/if}
	</div>
</button>

<input
	type="checkbox"
	checked={checked === "indeterminate" ? false : checked}
	{indeterminate}
	{disabled}
	{required}
	{name}
	{id}
	class="sr-only"
	tabindex="-1"
/>
