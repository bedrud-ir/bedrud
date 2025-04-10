<script lang="ts">
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import Search from "lucide-svelte/icons/search";
    import Plus from "lucide-svelte/icons/plus";
    import type { Room } from "$lib/api";
    import { listAllRoomsAPI } from "$lib/api";

    let searchQuery = "";
    let rooms = $state<Room[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>(null);

    loadRooms();

    async function loadRooms() {
        try {
            isLoading = true;
            error = null;
            const response = await listAllRoomsAPI();
            console.log('API Response:', response);
            if (Array.isArray(response)) {
                rooms = response;
            } else {
                rooms = [];
                error = 'Invalid response format';
            }
        } catch (e) {
            error = e.message || 'Failed to load rooms';
            console.error('Load error:', e);
            rooms = [];
        } finally {
            isLoading = false;
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleString();
    }
</script>

<header class="flex h-16 shrink-0 items-center gap-2">
    <div class="flex items-center gap-2 px-4 w-full justify-between">
        <div class="flex items-center gap-2">
            <Sidebar.Trigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 h-4" />
            <Breadcrumb.Root>
                <Breadcrumb.List>
                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/admin">Admin</Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator />
                    <Breadcrumb.Item>
                        <Breadcrumb.Page>Rooms</Breadcrumb.Page>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb.Root>
        </div>
        <div class="flex items-center gap-2">
            <div class="relative">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    bind:value={searchQuery}
                    placeholder="Search rooms..."
                    class="pl-9 w-[250px]"
                />
            </div>
            <Button>
                <Plus class="mr-2 h-4 w-4" />
                <span>Create Room</span>
            </Button>
        </div>
    </div>
</header>
<div class="p-4">
    {#if error}
        <div class="mb-4 p-2 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
        </div>
    {/if}
    
    {#if isLoading}
        <div class="flex justify-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    {:else}
        <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
            {#if rooms.length === 0}
                <div class="p-8 text-center text-gray-500">
                    No rooms found
                </div>
            {:else}
                <table class="w-full">
                    <thead>
                        <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th class="h-12 px-4 text-left align-middle font-medium">Name</th>
                            <th class="h-12 px-4 text-left align-middle font-medium">Participants</th>
                            <th class="h-12 px-4 text-left align-middle font-medium">Status</th>
                            <th class="h-12 px-4 text-left align-middle font-medium">Expires</th>
                            <th class="h-12 px-4 text-left align-middle font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each rooms as room (room.id)}
                            <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td class="p-4">{room.name}</td>
                                <td class="p-4">{room.participants.length} / {room.maxParticipants}</td>
                                <td class="p-4">
                                    <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                        class:bg-green-50={room.isActive}
                                        class:text-green-700={room.isActive}
                                        class:ring-green-600={room.isActive}
                                        class:bg-red-50={!room.isActive}
                                        class:text-red-700={!room.isActive}
                                        class:ring-red-600={!room.isActive}>
                                        {room.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td class="p-4">{formatDate(room.expiresAt)}</td>
                                <td class="p-4">
                                    <Button variant="ghost" size="sm">Manage</Button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    {/if}
</div>
