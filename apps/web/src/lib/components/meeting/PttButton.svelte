<script lang="ts">
	import { AudioLines } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		isPttActive: boolean;
		onStart: () => void;
		onStop: () => void;
		class?: string;
	}

	let { isPttActive, onStart, onStop, class: className = '' }: Props = $props();
</script>

<Button
	variant={isPttActive ? 'default' : 'outline'}
	size="icon"
	class={`select-none touch-none ${isPttActive ? 'ring-2 ring-green-500 bg-green-600 hover:bg-green-700' : ''} ${className}`}
	onpointerdown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onStart(); }}
	onpointerup={onStop}
	onpointerleave={onStop}
	onpointercancel={onStop}
	title="Push to Talk (hold)"
>
	<AudioLines class="h-4 w-4" />
</Button>
