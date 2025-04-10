<script lang="ts">
	import { onMount } from "svelte";
	import { spring } from "svelte/motion";
	import { fade } from "svelte/transition";
	import { Hand } from "lucide-svelte";

	let { children } = $props();
	
	let wiggleAnimation = $state(true);
	let animationComplete = $state(false);

	let logoCoords = spring({ x: 50, y: 50, scale: 1.8 }, {
		stiffness: 0.1,
		damping: 0.6
	});

	onMount(() => {
		// Start with wiggling hand in center
		setTimeout(() => {
			// Stop wiggling and move to bottom left
			wiggleAnimation = false;
			
			// Position it more tightly to bottom left
			logoCoords.set({ x: 2, y: 98, scale: 0.6 });
			
			// Show form after logo moves
			setTimeout(() => {
				animationComplete = true;
			}, 800);
		}, 500);
	});
</script>

<div class="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
	<!-- Logo that moves from center to bottom left -->
	<div 
		class="logo-element absolute z-10"
		class:wiggle={wiggleAnimation}
		style="left: {$logoCoords.x}%; top: {$logoCoords.y}%; transform: translate(-50%, -50%) scale({$logoCoords.scale});"
	>
		<div class="flex items-center space-x-2">
			<div class="bg-transparent flex items-center justify-center h-20 w-20 pl-7">
				<Hand class="h-8 w-8 text-sidebar-foreground" />
			</div>
			{#if $logoCoords.x < 30}
				<span 
					class="text-xl font-bold"
					in:fade={{ delay: 600, duration: 300 }}
				>Bedrud</span>
			{/if}
		</div>
	</div>

	<!-- Render child content -->
	{@render children()}



    <!-- Footer links -->
    <div
        class="absolute bottom-4 right-4 flex space-x-4 text-xs text-muted-foreground"
    >
        <a href="/about" class="hover:text-primary hover:underline">About</a>
        <a href="/terms" class="hover:text-primary hover:underline">Terms</a>
        <a href="/privacy" class="hover:text-primary hover:underline">Privacy</a
        >
        <a href="/contact" class="hover:text-primary hover:underline">Contact</a
        >
    </div>
</div>

<style>
	.logo-element {
		transition-property: transform, opacity;
		transition-duration: 0.8s;
		transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
	}
	
	.wiggle {
		animation: wiggle 0.5s ease-in-out infinite;
	}
	
	@keyframes wiggle {
		0% { transform: translate(-50%, -50%) scale(1.8) rotate(0deg); }
		20% { transform: translate(-50%, -50%) scale(1.8) rotate(-10deg); }
		35% { transform: translate(-50%, -52%) scale(1.8) rotate(0deg); }
		50% { transform: translate(-50%, -48%) scale(1.8) rotate(10deg); }
		65% { transform: translate(-50%, -52%) scale(1.8) rotate(0deg); }
		80% { transform: translate(-50%, -50%) scale(1.8) rotate(-10deg); }
		100% { transform: translate(-50%, -50%) scale(1.8) rotate(0deg); }
	}
	
	.bg-sidebar {
		background-color: var(--sidebar, hsl(0 0% 100%));
		border: 1px solid var(--sidebar-border, hsl(240 5.9% 90%));
	}
	
	.text-sidebar-foreground {
		color: var(--sidebar-foreground, hsl(240 10% 3.9%));
	}
</style>
