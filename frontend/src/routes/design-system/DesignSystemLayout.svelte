<script lang="ts">
    import { page } from "$app/stores";
    import * as Accordion from "$lib/components/ui/accordion";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { Sun, Moon, Menu, X } from "lucide-svelte";

    // Component categories for navigation
    const categories = [
        {
            name: "Foundations",
            items: [
                { name: "Colors", href: "/design-system/foundations/colors" },
                {
                    name: "Typography",
                    href: "/design-system/foundations/typography",
                },
                { name: "Spacing", href: "/design-system/foundations/spacing" },
                { name: "Icons", href: "/design-system/foundations/icons" },
            ],
        },
        {
            name: "Components",
            items: [
                {
                    name: "Accordion",
                    href: "/design-system/components/accordion",
                },
                { name: "Button", href: "/design-system/components/button" },
                { name: "Card", href: "/design-system/components/card" },
                { name: "Dialog", href: "/design-system/components/dialog" },
                {
                    name: "Separator",
                    href: "/design-system/components/separator",
                },
                {
                    name: "Form Controls",
                    href: "/design-system/components/form",
                },
            ],
        },
        {
            name: "Patterns",
            items: [
                { name: "Meeting UI", href: "/design-system/patterns/meeting" },
            ],
        },
    ];

    // State for mobile navigation and theme
    let darkMode = $state(false);
    let mobileNavOpen = $state(false);

    // Toggle dark mode
    function toggleDarkMode() {
        darkMode = !darkMode;
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("darkMode", String(darkMode));
    }

    // Initialize dark mode from system preference or localStorage
    $effect(() => {
        if (typeof window !== "undefined") {
            const savedDarkMode = localStorage.getItem("darkMode") === "true";
            const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)",
            ).matches;
            darkMode =
                savedDarkMode ||
                (localStorage.getItem("darkMode") === null && prefersDark);
            document.documentElement.classList.toggle("dark", darkMode);
        }
    });
</script>

<div
    class="min-h-screen flex flex-col transition-colors duration-200"
    class:dark={darkMode}
>
    <!-- Header -->
    <header
        class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
        <div class="container flex h-14 items-center">
            <div class="mr-4 flex md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => (mobileNavOpen = !mobileNavOpen)}
                >
                    {#if mobileNavOpen}
                        <X class="h-5 w-5" />
                    {:else}
                        <Menu class="h-5 w-5" />
                    {/if}
                </Button>
            </div>
            <div class="flex items-center justify-between flex-1">
                <a
                    href="/design-system"
                    class="flex items-center space-x-2 font-semibold"
                >
                    <span class="hidden sm:inline-block"
                        >Bedrud Design System</span
                    >
                    <span class="sm:hidden">BDS</span>
                </a>
                <Button variant="ghost" size="icon" onclick={toggleDarkMode}>
                    {#if darkMode}
                        <Sun class="h-5 w-5" />
                    {:else}
                        <Moon class="h-5 w-5" />
                    {/if}
                </Button>
            </div>
        </div>
    </header>

    <!-- Mobile Navigation Overlay -->
    {#if mobileNavOpen}
        <div
            class="fixed inset-0 z-50 bg-background md:hidden"
            onclick={() => (mobileNavOpen = false)}
        >
            <div class="p-6 h-full overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <span class="text-lg font-semibold">Navigation</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onclick={() => (mobileNavOpen = false)}
                    >
                        <X class="h-5 w-5" />
                    </Button>
                </div>

                <nav class="space-y-6">
                    {#each categories as category}
                        <div>
                            <h3
                                class="text-muted-foreground text-xs uppercase tracking-wider mb-3"
                            >
                                {category.name}
                            </h3>
                            <ul class="space-y-2">
                                {#each category.items as item}
                                    <li>
                                        <a
                                            href={item.href}
                                            class="block text-sm py-2 px-3 rounded-md transition-colors hover:bg-muted"
                                            class:bg-muted={$page.url
                                                .pathname === item.href}
                                            onclick={() =>
                                                (mobileNavOpen = false)}
                                        >
                                            {item.name}
                                        </a>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/each}
                </nav>
            </div>
        </div>
    {/if}

    <!-- Main Container -->
    <div class="flex-1 container flex flex-col md:flex-row md:gap-6 py-6">
        <!-- Desktop Sidebar -->
        <aside class="hidden md:block w-64 shrink-0 border-r pr-6 space-y-6">
            <a href="/design-system" class="flex items-center space-x-2 mb-6">
                <span class="text-xl font-bold">Bedrud</span>
            </a>

            <nav class="space-y-8">
                {#each categories as category}
                    <div>
                        <h3
                            class="text-muted-foreground text-xs uppercase tracking-wider mb-3"
                        >
                            {category.name}
                        </h3>
                        <Accordion.Root type="multiple" class="space-y-1">
                            {#each category.items as item}
                                <a
                                    href={item.href}
                                    class="block text-sm py-2 px-3 rounded-md transition-colors hover:bg-muted"
                                    class:bg-muted={$page.url.pathname ===
                                        item.href}
                                >
                                    {item.name}
                                </a>
                            {/each}
                        </Accordion.Root>
                    </div>
                {/each}
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 pt-4 md:pt-0 md:pl-6">
            <slot />
        </main>
    </div>
</div>
