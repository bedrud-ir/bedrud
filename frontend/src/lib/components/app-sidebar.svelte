<script lang="ts">
	import NavMain from "$lib/components/nav-main.svelte";
	import NavProjects from "$lib/components/nav-projects.svelte";
	import NavSecondary from "$lib/components/nav-secondary.svelte";
	import NavUser from "$lib/components/nav-user.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import Hand from "lucide-svelte/icons/hand";

	let {
		ref = $bindable(null),
		user,
		navMain: navMains,
		navSecondary,
		projects,
		brand,
		...restProps
	} = $props();
</script>

<style>
    @keyframes shine {
        0% {
            background-position: -100% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
        100% {
            background-position: -100% 50%;
        }
    }

    .brand-icon {
        position: relative;
        overflow: hidden;
    }

    .brand-icon::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            110deg,
            transparent 35%,
            rgba(255, 255, 255, 0.15) 50%,
            transparent 65%
        );
        background-size: 200% 100%;
        animation: shine 6s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
    }
</style>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="##" {...props}>
							<div
								class="brand-icon flex aspect-square size-8 items-center justify-center rounded-lg"
								style:background-color={brand.color}
							>
								<Hand class="size-4 text-white" />
							</div>
							<div
								class="grid flex-1 text-left text-sm leading-tight"
							>
								<span class="truncate font-semibold">
									{brand.name}
								</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={navMains} />
		<NavProjects {projects} />
		<NavSecondary items={navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
</Sidebar.Root>
