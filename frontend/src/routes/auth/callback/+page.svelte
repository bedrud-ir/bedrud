<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores"; // For SvelteKit < 1.0, this is $app/stores. For >1.0 it's $app/environment
    import { goto } from "$app/navigation";
    import {
        storeTokenAndMinimalUser,
        fetchAndUpdateCurrentUser,
    } from "$lib/auth";
    import { AlertCircle, CheckCircle, Loader2 } from "lucide-svelte";
    import { fly, fade, scale } from "svelte/transition";

    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let success = $state(false);

    onMount(async () => {
        const token = $page.url.searchParams.get("token");

        if (!token) {
            error = "Authentication token not found in URL.";
            isLoading = false;
            return;
        }

        try {
            // Store the token and minimal user info (from JWT)
            await storeTokenAndMinimalUser(token);

            // Fetch full user details from /auth/me
            await fetchAndUpdateCurrentUser();

            success = true;
            isLoading = false;

            // Wait for a moment to show success message before redirecting
            setTimeout(() => {
                const redirectPath = localStorage.getItem("redirect");
                if (redirectPath) {
                    localStorage.removeItem("redirect"); // Clean up
                    goto(redirectPath);
                } else {
                    goto("/admin"); // Default redirect
                }
            }, 1500); // Show success for 1.5 seconds
        } catch (e: any) {
            console.error("OAuth callback processing failed:", e);
            error = e.message || "An unexpected error occurred during sign-in.";
            isLoading = false;
        }
    });
</script>

<svelte:head>
    <title>Authenticating... | Bedrud</title>
</svelte:head>

<div class="flex items-center justify-center min-h-screen bg-background p-4">
    <div class="w-full max-w-md text-center">
        {#if isLoading}
            <div
                in:fade={{ duration: 200 }}
                class="flex flex-col items-center justify-center space-y-4"
            >
                <Loader2 class="h-12 w-12 animate-spin text-primary" />
                <p class="text-lg font-medium text-muted-foreground">
                    Authenticating with Google...
                </p>
                <p class="text-sm text-muted-foreground">
                    Please wait while we securely sign you in.
                </p>
            </div>
        {/if}

        {#if !isLoading && success}
            <div
                class="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50"
                in:fade={{ duration: 300 }}
                out:fade={{ duration: 300, delay: 1200 }}
            >
                <div
                    class="success-animation flex flex-col items-center justify-center p-6 rounded-lg"
                    in:scale={{ duration: 400, start: 0.7, opacity: 0 }}
                >
                    <CheckCircle
                        class="h-16 w-16 text-green-500 mb-4"
                        strokeWidth={2.5}
                    />
                    <p class="text-xl font-semibold text-foreground">
                        Authentication Successful!
                    </p>
                    <p class="text-muted-foreground">
                        Redirecting you shortly...
                    </p>
                </div>
            </div>
        {/if}

        {#if error && !isLoading}
            <div
                in:fly={{ y: 20, duration: 300 }}
                class="p-6 rounded-lg border bg-card text-card-foreground shadow-lg space-y-4"
            >
                <div class="flex flex-col items-center">
                    <AlertCircle class="h-12 w-12 text-destructive mb-3" />
                    <h2 class="text-xl font-semibold text-destructive">
                        Authentication Failed
                    </h2>
                </div>
                <p
                    class="text-destructive-foreground/80 text-sm bg-destructive/10 p-3 rounded-md"
                >
                    {error}
                </p>
                <p class="text-sm text-muted-foreground">
                    Please try signing in again. If the problem persists,
                    contact support.
                </p>
                <div class="mt-6 flex gap-3">
                    <a
                        href="/auth/login"
                        class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 w-full"
                    >
                        Try Again
                    </a>
                    <a
                        href="/"
                        class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 w-full"
                    >
                        Go to Homepage
                    </a>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .success-animation {
        animation: success-pulse 1.5s ease-in-out forwards;
    }

    @keyframes success-pulse {
        0% {
            transform: scale(0.8);
            opacity: 0.8;
        }
        20% {
            transform: scale(1.05);
            opacity: 1;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
</style>
