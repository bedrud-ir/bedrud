<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Separator } from "$lib/components/ui/separator";
    import { Check, Copy } from "lucide-svelte";
    import DesignSystemLayout from "../../DesignSystemLayout.svelte";

    // For the copy code functionality
    let copySuccess = $state(false);

    function copyCode(code: string) {
        navigator.clipboard.writeText(code);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }

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
</script>

<svelte:head>
    <title>Button - Bedrud Design System</title>
</svelte:head>

<DesignSystemLayout class="space-y-8">
    <!-- Component Header -->
    <div>
        <h1 class="text-3xl font-bold tracking-tight">Button</h1>
        <p class="text-muted-foreground mt-2">
            Buttons allow users to trigger an action or event with a single
            click.
        </p>
    </div>

    <Separator />

    <!-- Usage examples -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold">Variants</h2>
        <p class="text-muted-foreground mb-4">
            Different button styles for different contexts and hierarchies.
        </p>

        <Card.Root>
            <Card.Header>
                <Card.Title>Button Variants</Card.Title>
                <Card.Description>
                    Choose the appropriate variant based on the action's
                    importance.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="flex flex-wrap gap-4">
                    {#each buttonExamples as button}
                        <Button variant={button.variant}>{button.label}</Button>
                    {/each}
                </div>
            </Card.Content>
            <Card.Footer class="flex justify-between items-center border-t p-4">
                <div class="text-sm text-muted-foreground">
                    The default variant should be used for primary actions.
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    class="flex items-center gap-1"
                    onclick={() =>
                        copyCode(
                            `<Button variant="default">Default</Button>\n<Button variant="destructive">Destructive</Button>\n<Button variant="outline">Outline</Button>\n<Button variant="secondary">Secondary</Button>\n<Button variant="ghost">Ghost</Button>\n<Button variant="link">Link</Button>`,
                        )}
                >
                    {#if copySuccess}
                        <Check class="h-3.5 w-3.5 mr-1" />
                        Copied
                    {:else}
                        <Copy class="h-3.5 w-3.5 mr-1" />
                        Copy code
                    {/if}
                </Button>
            </Card.Footer>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Button Sizes</Card.Title>
                <Card.Description>
                    Different size options to fit your interface needs.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="flex flex-wrap items-center gap-4">
                    {#each buttonSizes as button}
                        <Button size={button.size} variant="default">
                            {button.content || button.label}
                        </Button>
                    {/each}
                </div>
            </Card.Content>
            <Card.Footer class="flex justify-between items-center border-t p-4">
                <div class="text-sm text-muted-foreground">
                    Use consistent button sizes within the same view.
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    class="flex items-center gap-1"
                    onclick={() =>
                        copyCode(
                            `<Button size="default">Default</Button>\n<Button size="sm">Small</Button>\n<Button size="lg">Large</Button>\n<Button size="icon">✓</Button>`,
                        )}
                >
                    {#if copySuccess}
                        <Check class="h-3.5 w-3.5 mr-1" />
                        Copied
                    {:else}
                        <Copy class="h-3.5 w-3.5 mr-1" />
                        Copy code
                    {/if}
                </Button>
            </Card.Footer>
        </Card.Root>
    </section>

    <Separator />

    <!-- States -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold">States</h2>
        <Card.Root>
            <Card.Header>
                <Card.Title>Button States</Card.Title>
                <Card.Description>
                    Buttons can be disabled or show loading states.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="flex flex-wrap gap-4">
                    <Button>Default</Button>
                    <Button disabled>Disabled</Button>
                    <Button class="pointer-events-none">
                        <div
                            class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        ></div>
                        Loading
                    </Button>
                </div>
            </Card.Content>
            <Card.Footer class="flex justify-between items-center border-t p-4">
                <div class="text-sm text-muted-foreground">
                    Use disabled state for actions that aren't currently
                    available.
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    class="flex items-center gap-1"
                    onclick={() =>
                        copyCode(
                            `<Button>Default</Button>\n<Button disabled>Disabled</Button>\n<Button>\n  <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>\n  Loading\n</Button>`,
                        )}
                >
                    {#if copySuccess}
                        <Check class="h-3.5 w-3.5 mr-1" />
                        Copied
                    {:else}
                        <Copy class="h-3.5 w-3.5 mr-1" />
                        Copy code
                    {/if}
                </Button>
            </Card.Footer>
        </Card.Root>
    </section>

    <Separator />

    <!-- Implementation -->
    <section class="space-y-6">
        <h2 class="text-2xl font-semibold">Implementation</h2>

        <Card.Root>
            <Card.Header>
                <Card.Title>Usage Guidelines</Card.Title>
            </Card.Header>
            <Card.Content>
                <ul class="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li>
                        Use <strong>primary buttons</strong> for the main action
                        on a page
                    </li>
                    <li>
                        Use <strong>secondary buttons</strong> for alternative actions
                    </li>
                    <li>
                        Use <strong>destructive buttons</strong> for actions that
                        delete or remove data
                    </li>
                    <li>
                        Use <strong>outline or ghost buttons</strong> for less important
                        actions
                    </li>
                    <li>
                        Always provide a label that clearly indicates the
                        button's action
                    </li>
                    <li>
                        Use consistent button styling throughout your
                        application
                    </li>
                </ul>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>Accessibility</Card.Title>
            </Card.Header>
            <Card.Content>
                <ul class="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li>
                        Buttons have appropriate focus styles for keyboard
                        navigation
                    </li>
                    <li>
                        Use proper contrast ratios between button
                        background/text for all variants
                    </li>
                    <li>
                        Ensure buttons have adequate touch target size (at least
                        44×44px)
                    </li>
                    <li>Use <code>aria-label</code> for icon-only buttons</li>
                </ul>
            </Card.Content>
        </Card.Root>
    </section>
</DesignSystemLayout>
