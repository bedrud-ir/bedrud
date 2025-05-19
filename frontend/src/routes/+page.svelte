<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Hand, Sun, Moon } from "lucide-svelte";
    import { spring } from "svelte/motion";
    import { fade } from "svelte/transition";
    import { onMount } from "svelte";
    import { userStore } from "$lib/stores/user.store";
    import { authStore } from "$lib/stores/auth.store";
    import { fetchAndUpdateCurrentUser } from "$lib/auth";

    // Dark mode toggle
    let darkMode = $state(false);
    function toggleDarkMode() {
        darkMode = !darkMode;
        document.documentElement.classList.toggle("dark", darkMode);
    }

    let wiggleAnimation = $state(true);
    let contentVisible = $state(false);

    let logoCoords = spring(
        { x: 50, y: 50, scale: 2 },
        {
            stiffness: 0.05, // Reduced for smoother motion
            damping: 0.8, // Increased for less bouncing
        },
    );

    onMount(async () => {
        // Attempt to fetch and update current user data
        // This ensures the user information is up-to-date if they had a session.
        if ($userStore) {
            // Only fetch if there's a user in the store, implying a session might exist
            try {
                await fetchAndUpdateCurrentUser();
            } catch (error) {
                console.error("Error fetching user data on page load:", error);
                // If fetching fails (e.g., token expired and refresh failed),
                // the user and auth stores would have been cleared by the auth logic.
            }
        }

        setTimeout(() => {
            wiggleAnimation = false;
            // Add a small delay before starting the spring animation
            setTimeout(() => {
                logoCoords.set({ x: 50, y: 50, scale: 1 }, { hard: false });
                setTimeout(() => {
                    contentVisible = true;
                }, 600);
            }, 100);
        }, 1200); // Longer initial wiggle
    });

    function logout() {
        userStore.clear();
        authStore.clear();
        // Optionally, you might want to redirect the user after logout, e.g., to the home page.
        // You would need to import `goto` from `$app/navigation` for this.
        // import { goto } from '$app/navigation';
        // goto('/');
    }
</script>

<svelte:head>
    <title>Bedrud - Simple Meeting App</title>
</svelte:head>

<div
    class="min-h-screen bg-background transition-colors duration-200 relative overflow-hidden flex flex-col"
    class:dark={darkMode}
>
    <!-- Main content area with fixed centering -->
    <div class="flex-1 flex items-center justify-center">
        <div
            class="logo-element text-center"
            style="transform: translate(-50%, -50%) scale({$logoCoords.scale}); left: {$logoCoords.x}%; top: {$logoCoords.y}%;"
        >
            <div class="flex flex-col items-center space-y-6">
                <div
                    class="bg-primary/10 flex items-center justify-center h-24 w-24 rounded-2xl"
                    class:wiggle={wiggleAnimation}
                >
                    <Hand class="h-14 w-14 text-primary" />
                </div>
                <span
                    class="text-5xl font-bold tracking-tight"
                    style="transform: none;">Bedrud</span
                >
                {#if contentVisible}
                    <p
                        class="text-muted-foreground max-w-[20rem] text-center mt-2"
                        in:fade={{ duration: 300, delay: 200 }}
                    >
                        Meeting simplified & Open
                    </p>
                {/if}
            </div>
        </div>
    </div>

    <!-- Bottom navigation -->
    {#if contentVisible}
        <div
            class="w-full p-6 flex justify-between items-center border-t"
            in:fade={{ duration: 300, delay: 300 }}
        >
            <!-- Bottom Left -->
            <div class="text-sm text-muted-foreground space-x-4">
                <a
                    href="https://github.com/yourusername/bedrud"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="hover:text-primary transition-colors"
                >
                    GitHub
                </a>
                <span class="text-muted-foreground/50">•</span>
                <a
                    href="https://www.gnu.org/licenses/gpl-3.0.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="hover:text-primary transition-colors"
                >
                    GPLv3 License
                </a>
            </div>

            <!-- Bottom Right -->
            <div class="flex items-center space-x-3">
                <Button variant="ghost" size="icon" onclick={toggleDarkMode}>
                    {#if darkMode}
                        <Sun class="h-5 w-5" />
                    {:else}
                        <Moon class="h-5 w-5" />
                    {/if}
                </Button>
                {#if $userStore}
                    {#if $userStore.avatarUrl}
                        <img
                            src={$userStore.avatarUrl}
                            alt="User avatar"
                            class="h-8 w-8 rounded-full"
                        />
                    {/if}
                    <Button variant="outline" onclick={logout}>Logout</Button>
                    <Button variant="default" href="/dashboard"
                        >Dashboard</Button
                    >
                {:else}
                    <Button variant="outline" href="/auth/login">Sign in</Button
                    >
                    <Button href="/auth/register">Register</Button>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .logo-element {
        position: absolute;
        transition-property: all;
        transition-duration: 0.8s;
        transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        will-change: transform;
    }

    .wiggle {
        animation: wiggle 1.2s ease-in-out infinite;
    }

    @keyframes wiggle {
        0% {
            transform: rotate(0deg);
        }
        25% {
            transform: rotate(-12deg);
        }
        75% {
            transform: rotate(12deg);
        }
        100% {
            transform: rotate(0deg);
        }
    }
</style>
