<script lang="ts">
    import { getAdminConfig } from "../../config";
    import { userStore } from "$lib/stores/user.store";
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";

    let { children } = $props();
    let adminConfig = $state(null);

    $effect(() => {
        if ($userStore) {
            adminConfig = getAdminConfig($userStore);
        } else {
            adminConfig = null;
        }
    });
</script>

{#if adminConfig}
    <Sidebar.Provider>
        <AppSidebar 
            user={adminConfig.user}
            navMain={adminConfig.navMain}
            navSecondary={adminConfig.navSecondary}
            projects={adminConfig.projects}
            brand={adminConfig.brand}
        />
        <Sidebar.Inset>
            {@render children()}
        </Sidebar.Inset>
    </Sidebar.Provider>
{:else}
    <div class="flex items-center justify-center h-screen">
        <p>Loading...</p>
    </div>
{/if}
