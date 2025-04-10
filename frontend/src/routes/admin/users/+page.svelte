<script lang="ts">
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import Search from "lucide-svelte/icons/search";
    import Plus from "lucide-svelte/icons/plus";
    import type { AdminUser } from "$lib/api";
    import { listUsersAPI, updateUserStatusAPI } from "$lib/api";

    let searchQuery = "";
    let users = $state<AdminUser[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let statusUpdateLoading = $state<string | null>(null);

    loadUsers();

    async function loadUsers() {
        try {
            isLoading = true;
            error = null;
            const response = await listUsersAPI();
            users = response.users;
        } catch (e) {
            error = e.message || 'Failed to load users';
            console.error('Load error:', e);
            users = [];
        } finally {
            isLoading = false;
        }
    }

    async function toggleUserStatus(userId: string, currentStatus: boolean) {
        try {
            statusUpdateLoading = userId;
            await updateUserStatusAPI(userId, !currentStatus);
            // Reload users to get updated data
            await loadUsers();
        } catch (e) {
            error = e.message || 'Failed to update user status';
            console.error('Status update error:', e);
        } finally {
            statusUpdateLoading = null;
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
                        <Breadcrumb.Page>Users</Breadcrumb.Page>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb.Root>
        </div>
        <div class="flex items-center gap-2">
            <div class="relative">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    bind:value={searchQuery}
                    placeholder="Search users..."
                    class="pl-9 w-[250px]"
                />
            </div>
            <Button>
                <Plus class="mr-2 h-4 w-4" />
                <span>Add User</span>
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
            {#if users.length === 0}
                <div class="p-8 text-center text-gray-500">
                    No users found
                </div>
            {:else}
                <table class="w-full">
                    <thead>
                        <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th class="h-12 px-4 text-left align-middle font-medium">Name</th>
                            <th class="h-12 px-4 text-left align-middle font-medium">Email</th>
                            <th class="h-12 px-4 text-left align-middle font-medium">Provider</th>
                            <th class="h-12 px-4 text-left align-middle font-medium">Role</th>
                            <th class="h-12 px-4 text-left align-middle font-medium">Status</th>
                            <th class="h-12 px-4 text-left align-middle font-medium">Created</th>
                            <th class="h-12 px-4 text-left align-middle font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each users as user (user.id)}
                            <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td class="p-4">{user.name}</td>
                                <td class="p-4">{user.email}</td>
                                <td class="p-4">{user.provider}</td>
                                <td class="p-4">
                                    {#if user.accesses}
                                        <div class="flex gap-1">
                                            {#each user.accesses as access}
                                                <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                                                    {access}
                                                </span>
                                            {/each}
                                        </div>
                                    {/if}
                                </td>
                                <td class="p-4">
                                    <button
                                        class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                        class:bg-green-50={user.isActive}
                                        class:text-green-700={user.isActive}
                                        class:ring-green-600={user.isActive}
                                        class:bg-red-50={!user.isActive}
                                        class:text-red-700={!user.isActive}
                                        class:ring-red-600={!user.isActive}
                                        class:opacity-50={statusUpdateLoading === user.id}
                                        disabled={statusUpdateLoading === user.id}
                                        onclick={() => toggleUserStatus(user.id, user.isActive)}
                                    >
                                        {#if statusUpdateLoading === user.id}
                                            <span class="inline-block animate-spin mr-1">⟳</span>
                                        {/if}
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td class="p-4">{formatDate(user.createdAt)}</td>
                                <td class="p-4">
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    {/if}
</div>
