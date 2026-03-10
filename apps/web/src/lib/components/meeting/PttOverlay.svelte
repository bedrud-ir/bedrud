<script lang="ts">
	interface Props {
		visible: boolean;
	}
	let { visible }: Props = $props();
</script>

{#if visible}
	<div class="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2">
		<div class="flex items-center gap-2 rounded-full bg-black/70 px-5 py-2.5 text-white backdrop-blur-md">
			<span class="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400"></span>
			<span class="text-sm font-semibold tracking-wide">Transmitting...</span>
		</div>
	</div>
{/if}
