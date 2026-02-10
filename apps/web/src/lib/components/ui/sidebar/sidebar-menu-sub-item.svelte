<script lang="ts">
	let {
		ref = $bindable(null),
		children,
		...restProps
	}: {
		ref?: HTMLLIElement | null;
		children?: import("svelte").Snippet;
		[key: string]: any;
	} = $props();
</script>

<li bind:this={ref} data-sidebar="menu-sub-item" {...restProps}>
	{@render children?.()}
</li>
