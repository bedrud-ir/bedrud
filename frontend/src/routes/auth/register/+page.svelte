<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import { register } from "$lib/auth";
    import { goto } from "$app/navigation";
    import { Mail, Lock, AlertCircle, CheckCircle, User, Eye, EyeOff } from "lucide-svelte";
    import { fade, scale, fly } from "svelte/transition";
    import { authStore } from "$lib/stores/auth.store";
    import { userStore } from "$lib/stores/user.store";

    let name = $state("");
    let email = $state("");
    let password = $state("");
    let repeatPassword = $state("");
    let error = $state("");
    let isLoading = $state(false);
    let showSuccessAnimation = $state(false);
    let passwordsMatch = $derived(password === repeatPassword || repeatPassword === "");
    
    // Password visibility states
    let showPassword = $state(false);
    let showRepeatPassword = $state(false);
    
    // Toggle password visibility functions
    function togglePasswordVisibility() {
        showPassword = !showPassword;
    }
    
    function toggleRepeatPasswordVisibility() {
        showRepeatPassword = !showRepeatPassword;
    }

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true;
        error = "";

        if (password !== repeatPassword) {
            error = "Passwords don't match";
            isLoading = false;
            return;
        }

        try {
            await register(email, password, name);
            showSuccessAnimation = true;
            setTimeout(() => {
                goto("/admin");
            }, 1200);
        } catch (e) {
            console.error("Registration error:", e);
            error =
                e instanceof Error
                    ? e.message
                    : "Registration failed. Please try again.";
            isLoading = false;
        }
    }

    async function handleGoogleRegister() {
        window.location.href = `${import.meta.env.VITE_BACKEND_API}/auth/google`;
    }
</script>

<svelte:head>
    <title>Register | Bedrud</title>
</svelte:head>

<div
    class="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden w-[400px]"
>
    <!-- Success Animation overlay -->
    {#if showSuccessAnimation}
        <div
            class="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50"
            in:fade={{ duration: 300 }}
            out:fade={{ duration: 300 }}
        >
            <div
                class="success-animation flex flex-col items-center"
                in:scale={{ duration: 400, start: 0.5, opacity: 0 }}
            >
                <CheckCircle class="h-16 w-16 text-green-500" strokeWidth={3} />
                <p class="text-lg font-medium mt-4">Registration successful!</p>
                <p class="text-muted-foreground text-sm">Welcome to Bedrud!</p>
            </div>
        </div>
    {/if}

    <!-- Registration form - appears after animation -->
    <div
        class="w-full max-w-sm px-4"
        in:fly={{ y: 20, duration: 400, delay: 100 }}
    >
        <Card.Root class="border shadow-sm">
            <form onsubmit={handleSubmit} class="space-y-4">
                <Card.Header class="pb-0">
                    <Card.Title class="text-center"
                        >Create an account</Card.Title
                    >
                    <Card.Description class="text-center">
                        Enter your information to get started
                    </Card.Description>
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

                    <div class="space-y-1.5">
                        <Label for="name" class="text-xs">Full Name</Label>
                        <div class="relative">
                            <User
                                class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                id="name"
                                type="text"
                                bind:value={name}
                                placeholder="John Doe"
                                required
                                class="pl-8"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

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
                                type={showPassword ? "text" : "password"}
                                bind:value={password}
                                required
                                class="pl-8 pr-10"
                                disabled={isLoading}
                                minlength={8}
                            />
                            <button 
                                type="button"
                                class="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                                onclick={togglePasswordVisibility}
                                tabindex="-1"
                            >
                                {#if showPassword}
                                    <EyeOff class="h-4 w-4" />
                                {:else}
                                    <Eye class="h-4 w-4" />
                                {/if}
                            </button>
                        </div>
                        <p class="text-xs text-muted-foreground mt-1">
                            Must be at least 8 characters
                        </p>
                    </div>

                    <div class="space-y-1.5">
                        <Label for="repeatPassword" class="text-xs">Repeat Password</Label>
                        <div class="relative">
                            <Lock
                                class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                id="repeatPassword"
                                type={showRepeatPassword ? "text" : "password"}
                                bind:value={repeatPassword}
                                required
                                class={`pl-8 pr-10 ${!passwordsMatch && repeatPassword ? 'border-destructive' : ''}`}
                                disabled={isLoading}
                                minlength={8}
                            />
                            <button 
                                type="button"
                                class="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                                onclick={toggleRepeatPasswordVisibility}
                                tabindex="-1"
                            >
                                {#if showRepeatPassword}
                                    <EyeOff class="h-4 w-4" />
                                {:else}
                                    <Eye class="h-4 w-4" />
                                {/if}
                            </button>
                        </div>
                        {#if !passwordsMatch && repeatPassword}
                            <p class="text-xs text-destructive mt-1">
                                Passwords don't match
                            </p>
                        {/if}
                    </div>

                    <Button
                        type="submit"
                        class="w-full"
                        disabled={isLoading || showSuccessAnimation || !passwordsMatch}
                    >
                        {#if isLoading && !showSuccessAnimation}
                            Creating account...
                        {:else if showSuccessAnimation}
                            Success!
                        {:else}
                            Create account
                        {/if}
                    </Button>

                    <div class="relative">
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

                    <Button
                        type="button"
                        variant="outline"
                        class="w-full"
                        onclick={handleGoogleRegister}
                        disabled={isLoading}
                    >
                        <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </Button>
                </Card.Content>
            </form>
        </Card.Root>

        <div class="text-center text-xs text-muted-foreground mt-4">
            Already have an account?
            <a href="/auth/login" class="text-primary hover:underline"
                >Sign in</a
            >
        </div>
    </div>
</div>

<style>
    .success-animation {
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
