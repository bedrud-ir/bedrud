<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Separator } from "$lib/components/ui/separator";
    import { login, passkeyLogin } from "$lib/auth";
    import { baseURL } from "$lib/api"; // Import baseURL for direct backend calls
    import { goto } from "$app/navigation";
    import { userStore } from "$lib/stores/user.store";
    import {
        Mail,
        Lock,
        AlertCircle,
        CheckCircle,
        Fingerprint,
    } from "lucide-svelte";
    import { fly, fade, scale } from "svelte/transition";
    import { Checkbox } from "$lib/components/ui/checkbox";

    // Access the animationComplete prop from layout

    let email = $state("");
    let password = $state("");
    let remember = $state(false);
    let error = $state("");
    let isLoading = $state(false);
    let showSuccessAnimation = $state(false);

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true;
        error = "";

        try {
            await login(email, password, remember);

            // Show success animation
            showSuccessAnimation = true;

            // Wait for the animation to complete before redirecting
            setTimeout(() => {
                const redirectPath = localStorage.getItem("redirect");
                if (redirectPath) {
                    goto(redirectPath);
                } else {
                    goto("/");
                }
            }, 1200); // Show success for 1.2 seconds before redirecting
        } catch (e: any) {
            console.error(e);
            error = e.message || "Login failed. Please try again.";
            isLoading = false;
        }
    }

    async function handleGoogleLogin() {
        isLoading = true;
        error = "";
        try {
            // Construct the backend URL for Google login
            const googleLoginUrl = `${baseURL}/auth/google/login`;
            // Redirect the browser to this URL
            window.location.href = googleLoginUrl;
            // If the redirect is successful, the page will navigate away.
            // isLoading will remain true, which is fine as the page is changing.
        } catch (e: any) {
            // This catch block handles errors in constructing the URL or if window.location.href fails.
            console.error("Google login error:", e);
            error = e.message || "Google login failed. Please try again.";
            isLoading = false; // Reset loading state in case of an immediate error
        }
    }

    async function handlePasskeyLogin() {
        isLoading = true;
        error = "";
        try {
            await passkeyLogin();
            showSuccessAnimation = true;
            setTimeout(() => {
                const redirectPath = localStorage.getItem("redirect");
                if (redirectPath) {
                    goto(redirectPath);
                } else {
                    goto("/");
                }
            }, 1200);
        } catch (e: any) {
            console.error(e);
            error = e.message || "Passkey login failed. Please try again.";
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Login | Bedrud</title>
</svelte:head>

<!-- Success Animation overlay -->
{#if showSuccessAnimation}
    <div
        class="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50"
        in:fade={{ duration: 300 }}
        out:fade={{ duration: 300 }}
    >
        <div
            class="success-animation"
            in:scale={{ duration: 400, start: 0.5, opacity: 0 }}
        >
            <CheckCircle class="h-16 w-16 text-green-500" strokeWidth={3} />
            <p class="text-lg font-medium mt-4">Login successful!</p>
            <p class="text-muted-foreground text-sm">
                ;) happy to see you again
            </p>
        </div>
    </div>
{/if}

<!-- Login form - appears after animation -->
<div class="w-full max-w-sm px-4" in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <Card.Root class="border shadow-sm">
        <form onsubmit={handleSubmit} class="space-y-4">
            <Card.Header class="pb-0">
                <Card.Title class="text-center">Sign in</Card.Title>
            </Card.Header>

            <Card.Content class="space-y-4 pt-4">
                {#if error}
                    <div
                        class="p-2 rounded-md bg-destructive/10 text-destructive flex items-start space-x-2 text-sm"
                    >
                        <AlertCircle class="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                {/if}

                <!-- Passkey Path -->
                <div class="space-y-2">
                    <Button
                        type="button"
                        variant="outline"
                        class="w-full h-11 transition-all active:scale-[0.98]"
                        onclick={handlePasskeyLogin}
                        disabled={isLoading}
                    >
                        <Fingerprint class="mr-2 h-4 w-4" />
                        Sign in with Passkey
                    </Button>
                </div>

                <div class="relative py-2">
                    <div class="absolute inset-0 flex items-center">
                        <Separator class="w-full" />
                    </div>
                    <div class="relative flex justify-center">
                        <span
                            class="bg-background px-2 text-xs text-muted-foreground"
                            >or</span
                        >
                    </div>
                </div>

                <!-- Traditional Path -->
                <div class="space-y-1.5">
                    <Label for="email" class="text-xs">Email</Label>
                    <div class="relative">
                        <Mail
                            class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                        />
                        <Input
                            id="email"
                            type="email"
                            bind:value={email}
                            placeholder="name@example.com"
                            required
                            class="pl-8"
                            disabled={isLoading}
                            autocomplete="username"
                        />
                    </div>
                </div>

                <div class="space-y-1.5">
                    <Label for="password" class="text-xs">Password</Label>
                    <div class="relative">
                        <Lock
                            class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                        />
                        <Input
                            id="password"
                            type="password"
                            bind:value={password}
                            required
                            class="pl-8"
                            disabled={isLoading}
                            autocomplete="current-password"
                        />
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <Checkbox
                            id="remember"
                            checked={remember}
                            onCheckedChange={(checked: boolean) =>
                                (remember = checked)}
                        />
                        <Label for="remember" class="text-xs">Remember me</Label
                        >
                    </div>
                    <a
                        href="/auth/reset-password"
                        class="text-xs text-primary hover:underline"
                        >Forgot password?</a
                    >
                </div>

                <div class="pt-2">
                    <Button
                        type="submit"
                        variant="secondary"
                        class="w-full"
                        disabled={isLoading || showSuccessAnimation}
                    >
                        {#if isLoading && !showSuccessAnimation}
                            Signing in...
                        {:else if showSuccessAnimation}
                            Success!
                        {:else}
                            Sign in
                        {/if}
                    </Button>
                </div>
            </Card.Content>
        </form>
    </Card.Root>

    <div class="text-center text-xs text-muted-foreground mt-4">
        Don't have an account?
        <a href="/auth/register" class="text-primary hover:underline"
            >Create one</a
        >
    </div>
</div>

<style>
    .success-animation {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        animation: success-pulse 1.2s ease-in-out;
    }

    @keyframes success-pulse {
        0% {
            transform: scale(1);
        }
        10% {
            transform: scale(1.05);
        }
        20% {
            transform: scale(1);
        }
        100% {
            transform: scale(1);
        }
    }
</style>
