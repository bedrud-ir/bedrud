<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";
	export const sheetVariants = tv({
		base: "bg-background fixed z-50 gap-4 p-6 shadow-lg transition ease-in-out",
		variants: {
			side: {
				top: "inset-x-0 top-0 border-b",
				bottom: "inset-x-0 bottom-0 border-t",
				left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
				right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
			},
		},
		defaultVariants: {
			side: "right",
		},
	});

	export type Side = VariantProps<typeof sheetVariants>["side"];
</script>

<script lang="ts">
	import { getContext } from "svelte";
	import X from "lucide-svelte/icons/x";
	import { cn } from "$lib/utils.js";
	import { fly } from "svelte/transition";
	import SheetOverlay from "./sheet-overlay.svelte";
	import SheetPortal from "./sheet-portal.svelte";

	let {
		ref = $bindable(null),
		class: className,
		side = "right",
		children,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		class?: string;
		side?: Side;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();

	const sheet = getContext<any>("sheet");

	const transitionParams = $derived({
		x: side === "left" ? -300 : side === "right" ? 300 : 0,
		y: side === "top" ? -300 : side === "bottom" ? 300 : 0,
		duration: 300,
	});
</script>

{#if sheet.open}
	<SheetPortal>
		<SheetOverlay />
		<div
			bind:this={ref}
			transition:fly={transitionParams}
			class={cn(sheetVariants({ side }), className)}
			{...restProps}
		>
			{@render children?.()}
			<button
				type="button"
				onclick={() => sheet.close()}
				class="ring-offset-background focus:ring-ring absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
			>
				<X class="size-4" />
				<span class="sr-only">Close</span>
			</button>
		</div>
	</SheetPortal>
{/if}
