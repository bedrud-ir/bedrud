<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLElement | null;
		class?: string;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<nav bind:this={ref} class={className} aria-label="breadcrumb" {...restProps}>
	{@render children?.()}
</nav>
