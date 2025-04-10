<script lang="ts">
    import { getAdminConfig, brand } from "../../config";
    import { userStore } from "$lib/stores/user.store";
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import Users from "lucide-svelte/icons/users";
    import Home from "lucide-svelte/icons/home";
    import Settings from "lucide-svelte/icons/settings";
    import { goto } from "$app/navigation";

    let adminConfig = $state(null);

    const adminCards = [
        {
            title: "Users",
            description: "Manage user accounts and permissions",
            icon: Users,
            color: "bg-blue-500",
            href: "/admin/users",
        },
        {
            title: "Rooms",
            description: "View and manage active rooms",
            icon: Home,
            color: "bg-green-500",
            href: "/admin/rooms",
        },
        {
            title: "Settings",
            description: "Configure system settings",
            icon: Settings,
            color: "bg-purple-500",
            href: "/admin/settings",
        },
    ];

    $effect(() => {
        if ($userStore) {
            adminConfig = getAdminConfig($userStore);
        } else {
            adminConfig = null;
        }
    });
</script>

<header class="flex h-16 shrink-0 items-center gap-2">
    <div class="flex items-center gap-2 px-4">
        <Sidebar.Trigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb.Root>
            <Breadcrumb.List>
                <Breadcrumb.Item>
                    <Breadcrumb.Page>Admin Dashboard</Breadcrumb.Page>
                </Breadcrumb.Item>
            </Breadcrumb.List>
        </Breadcrumb.Root>
    </div>
</header>
<div class="p-4">
    <div class="grid gap-4 md:grid-cols-3">
        {#each adminCards as card}
            <button
                class="group relative rounded-lg border p-6 hover:bg-muted/50 transition-colors"
                onclick={() => goto(card.href)}
            >
                <div class="flex items-center gap-4">
                    <div
                        class="flex size-12 shrink-0 items-center justify-center rounded-lg {card.color} text-white"
                    >
                        {@render card.icon()}
                    </div>
                    <div class="flex flex-col items-start gap-1 text-left">
                        <h3 class="font-semibold">{card.title}</h3>
                        <p class="text-sm text-muted-foreground">
                            {card.description}
                        </p>
                    </div>
                </div>
            </button>
        {/each}
    </div>

    <!-- You can add more sections here like recent activity, stats, etc. -->
    <div class="mt-8 grid gap-4 md:grid-cols-2">
        <div class="rounded-lg border p-6">
            <h3 class="font-semibold mb-4">Quick Stats</h3>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-lg bg-muted/50 p-4">
                    <div class="text-2xl font-bold">-</div>
                    <div class="text-sm text-muted-foreground">
                        Active Users
                    </div>
                </div>
                <div class="rounded-lg bg-muted/50 p-4">
                    <div class="text-2xl font-bold">-</div>
                    <div class="text-sm text-muted-foreground">
                        Active Rooms
                    </div>
                </div>
            </div>
        </div>
        <div class="rounded-lg border p-6">
            <h3 class="font-semibold mb-4">Recent Activity</h3>
            <div class="text-sm text-muted-foreground">No recent activity</div>
        </div>
    </div>
</div>
