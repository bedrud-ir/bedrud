<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Separator } from "$lib/components/ui/separator";
    import * as Accordion from "$lib/components/ui/accordion";
    import { Check, Copy, Palette, Layers, Grid, Sun, Moon } from "lucide-svelte";
    import * as Form from "$lib/components/ui/form";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Switch } from "$lib/components/ui/switch";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Select } from "$lib/components/ui/select";
    import { RadioGroup, RadioGroupItem } from "$lib/components/ui/radio-group";
    import { AlertCircle, CheckCircle2, Terminal } from "lucide-svelte";
    
    // Copy functionality
    let copySuccess = $state(false);
    function copyCode(code: string) {
        navigator.clipboard.writeText(code);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }

    // Dark mode toggle
    let darkMode = $state(false);
    function toggleDarkMode() {
        darkMode = !darkMode;
        document.documentElement.classList.toggle("dark", darkMode);
    }

    // Button examples
    const buttonExamples = [
        { variant: "default", label: "Default" },
        { variant: "destructive", label: "Destructive" },
        { variant: "outline", label: "Outline" },
        { variant: "secondary", label: "Secondary" },
        { variant: "ghost", label: "Ghost" },
        { variant: "link", label: "Link" },
    ];

    const buttonSizes = [
        { size: "default", label: "Default" },
        { size: "sm", label: "Small" },
        { size: "lg", label: "Large" },
        { size: "icon", label: "Icon", content: "✓" },
    ];

    // Color system
    const colors = [
        { name: 'primary', value: 'bg-primary' },
        { name: 'secondary', value: 'bg-secondary' },
        { name: 'accent', value: 'bg-accent' },
        { name: 'muted', value: 'bg-muted' },
        { name: 'destructive', value: 'bg-destructive' },
    ];

    // Typography examples
    const typography = [
        { class: 'text-4xl font-bold', label: 'Heading 1' },
        { class: 'text-3xl font-semibold', label: 'Heading 2' },
        { class: 'text-2xl font-semibold', label: 'Heading 3' },
        { class: 'text-xl font-medium', label: 'Large Text' },
        { class: 'text-base', label: 'Body Text' },
        { class: 'text-sm text-muted-foreground', label: 'Small Text' },
    ];
</script>

<svelte:head>
    <title>One Page Design System - Bedrud</title>
</svelte:head>

<div class="min-h-screen bg-background transition-colors duration-200" class:dark={darkMode}>
    <!-- Header -->
    <header class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div class="container flex h-14 items-center justify-between">
            <span class="text-xl font-bold">Bedrud Design System</span>
            <Button variant="ghost" size="icon" onclick={toggleDarkMode}>
                {#if darkMode}
                    <Sun class="h-5 w-5" />
                {:else}
                    <Moon class="h-5 w-5" />
                {/if}
            </Button>
        </div>
    </header>

    <main class="container py-8 space-y-12">
        <!-- Hero section -->
        <section class="text-center max-w-3xl mx-auto">
            <h1 class="text-4xl font-bold tracking-tight mb-4">Bedrud Design System</h1>
            <p class="text-xl text-muted-foreground">
                A comprehensive collection of UI components and guidelines for building consistent interfaces.
            </p>
        </section>

        <!-- Color System -->
        <section>
            <h2 class="text-2xl font-semibold mb-6">Color System</h2>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                {#each colors as color}
                    <div class="space-y-2">
                        <div class={`h-20 rounded-lg ${color.value}`}></div>
                        <p class="text-sm font-medium">{color.name}</p>
                    </div>
                {/each}
            </div>
        </section>

        <Separator />

        <!-- Typography -->
        <section>
            <h2 class="text-2xl font-semibold mb-6">Typography</h2>
            <Card.Root>
                <Card.Content class="space-y-6 py-6">
                    {#each typography as type}
                        <div class="flex items-center justify-between">
                            <span class={type.class}>{type.label}</span>
                            <code class="text-sm bg-muted px-2 py-1 rounded">{type.class}</code>
                        </div>
                    {/each}
                </Card.Content>
            </Card.Root>
        </section>

        <!-- Design Principles -->
        <section>
            <h2 class="text-2xl font-semibold mb-6">Design Principles</h2>
            <div class="grid sm:grid-cols-3 gap-6">
                <Card.Root>
                    <Card.Header>
                        <div class="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                            <Palette class="h-5 w-5 text-primary" />
                        </div>
                        <Card.Title>Minimal & Focused</Card.Title>
                        <Card.Description>Clear purpose, reduced visual clutter</Card.Description>
                    </Card.Header>
                </Card.Root>
                
                <Card.Root>
                    <Card.Header>
                        <div class="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                            <Layers class="h-5 w-5 text-primary" />
                        </div>
                        <Card.Title>Consistent Hierarchy</Card.Title>
                        <Card.Description>Intentional typography and spacing</Card.Description>
                    </Card.Header>
                </Card.Root>
                
                <Card.Root>
                    <Card.Header>
                        <div class="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                            <Grid class="h-5 w-5 text-primary" />
                        </div>
                        <Card.Title>Responsive & Adaptive</Card.Title>
                        <Card.Description>Works on all device sizes</Card.Description>
                    </Card.Header>
                </Card.Root>
            </div>
        </section>

        <Separator />

        <!-- Form Controls -->
        <section>
            <h2 class="text-2xl font-semibold mb-6">Form Controls</h2>
            <div class="grid md:grid-cols-2 gap-6">
                <Card.Root>
                    <Card.Header>
                        <Card.Title>Input Fields</Card.Title>
                    </Card.Header>
                    <Card.Content class="space-y-4">
                        <div class="space-y-2">
                            <Label>Default Input</Label>
                            <Input placeholder="Enter text..." />
                        </div>
                        <div class="space-y-2">
                            <Label>Disabled Input</Label>
                            <Input disabled placeholder="Disabled input" />
                        </div>
                        <div class="space-y-2">
                            <Label>With Icon</Label>
                            <div class="relative">
                                <AlertCircle class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input class="pl-9" placeholder="With icon..." />
                            </div>
                        </div>
                    </Card.Content>
                </Card.Root>

                <Card.Root>
                    <Card.Header>
                        <Card.Title>Selection Controls</Card.Title>
                    </Card.Header>
                    <Card.Content class="space-y-6">
                        <div class="flex items-center space-x-2">
                            <Switch id="airplane-mode" />
                            <Label for="airplane-mode">Airplane Mode</Label>
                        </div>
                        <div class="flex items-center space-x-2">
                            <Checkbox id="terms" />
                            <Label for="terms">Accept terms</Label>
                        </div>
                        <RadioGroup defaultValue="option-1">
                            <div class="flex items-center space-x-2">
                                <RadioGroupItem value="option-1" id="option-1" />
                                <Label for="option-1">Option 1</Label>
                            </div>
                            <div class="flex items-center space-x-2">
                                <RadioGroupItem value="option-2" id="option-2" />
                                <Label for="option-2">Option 2</Label>
                            </div>
                        </RadioGroup>
                    </Card.Content>
                </Card.Root>
            </div>
        </section>

        <Separator />

        <!-- Button Components -->
        <section>
            <h2 class="text-2xl font-semibold mb-6">Button Components</h2>
            
            <!-- Variants -->
            <Card.Root class="mb-6">
                <Card.Header>
                    <Card.Title>Button Variants</Card.Title>
                    <Card.Description>Different styles for different contexts</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div class="flex flex-wrap gap-4">
                        {#each buttonExamples as button}
                            <Button variant={button.variant}>{button.label}</Button>
                        {/each}
                    </div>
                </Card.Content>
            </Card.Root>

            <!-- Sizes -->
            <Card.Root class="mb-6">
                <Card.Header>
                    <Card.Title>Button Sizes</Card.Title>
                    <Card.Description>Different size options</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div class="flex flex-wrap items-center gap-4">
                        {#each buttonSizes as button}
                            <Button size={button.size}>
                                {button.content || button.label}
                            </Button>
                        {/each}
                    </div>
                </Card.Content>
            </Card.Root>

            <!-- States -->
            <Card.Root>
                <Card.Header>
                    <Card.Title>Button States</Card.Title>
                    <Card.Description>Interactive states</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div class="flex flex-wrap gap-4">
                        <Button>Default</Button>
                        <Button disabled>Disabled</Button>
                        <Button>
                            <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            Loading
                        </Button>
                    </div>
                </Card.Content>
            </Card.Root>
        </section>

        <Separator />

        <!-- Layout Patterns -->
        <section>
            <h2 class="text-2xl font-semibold mb-6">Layout Patterns</h2>
            <div class="grid md:grid-cols-2 gap-6">
                <Card.Root>
                    <Card.Header>
                        <Card.Title>Split Layout</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <div class="grid grid-cols-2 gap-4 h-40">
                            <div class="bg-muted rounded-lg flex items-center justify-center">
                                Sidebar
                            </div>
                            <div class="bg-muted rounded-lg flex items-center justify-center">
                                Main Content
                            </div>
                        </div>
                    </Card.Content>
                </Card.Root>

                <Card.Root>
                    <Card.Header>
                        <Card.Title>Stack Layout</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <div class="space-y-4 h-40">
                            <div class="bg-muted rounded-lg h-1/3 flex items-center justify-center">
                                Header
                            </div>
                            <div class="bg-muted rounded-lg h-2/3 flex items-center justify-center">
                                Content
                            </div>
                        </div>
                    </Card.Content>
                </Card.Root>
            </div>
        </section>

        <!-- Code Examples -->
        <section>
            <h2 class="text-2xl font-semibold mb-6">Code Examples</h2>
            <Card.Root>
                <Card.Header>
                    <Card.Title>Installation</Card.Title>
                </Card.Header>
                <Card.Content>
                    <div class="relative">
                        <pre class="bg-muted p-4 rounded-lg overflow-x-auto"><code>npm install @bedrud/ui
# or
pnpm add @bedrud/ui</code></pre>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            class="absolute right-2 top-2"
                            onclick={() => copyCode('npm install @bedrud/ui')}
                        >
                            {#if copySuccess}
                                <CheckCircle2 class="h-4 w-4" />
                            {:else}
                                <Copy class="h-4 w-4" />
                            {/if}
                        </Button>
                    </div>
                </Card.Content>
            </Card.Root>
        </section>

        <Separator />

        <!-- Implementation Guidelines -->
        <section>
            <h2 class="text-2xl font-semibold mb-6">Implementation Guidelines</h2>
            <div class="grid md:grid-cols-2 gap-6">
                <Card.Root>
                    <Card.Header>
                        <Card.Title>Usage Guidelines</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <ul class="list-disc pl-5 space-y-2 text-muted-foreground">
                            <li>Use primary buttons for main actions</li>
                            <li>Use secondary buttons for alternative actions</li>
                            <li>Use destructive buttons for delete actions</li>
                            <li>Keep consistent styling throughout the app</li>
                        </ul>
                    </Card.Content>
                </Card.Root>

                <Card.Root>
                    <Card.Header>
                        <Card.Title>Accessibility</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <ul class="list-disc pl-5 space-y-2 text-muted-foreground">
                            <li>Proper focus styles for keyboard navigation</li>
                            <li>Adequate contrast ratios</li>
                            <li>Minimum touch target size of 44×44px</li>
                            <li>Use aria-labels for icon buttons</li>
                        </ul>
                    </Card.Content>
                </Card.Root>
            </div>
        </section>
    </main>
</div>
