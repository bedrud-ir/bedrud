<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';
  import { Palette, Layers, Grid, Shapes, Box } from 'lucide-svelte';
    import DesignSystemLayout from './DesignSystemLayout.svelte';
</script>

<svelte:head>
  <title>Bedrud Design System</title>
</svelte:head>

<DesignSystemLayout class="space-y-8">
  <!-- Hero section -->
  <section class="pb-8">
    <h1 class="text-4xl font-bold tracking-tight mb-3">Bedrud Design System</h1>
    <p class="text-xl text-muted-foreground max-w-2xl">
      A comprehensive collection of UI components and guidelines for building consistent, accessible, and responsive interfaces.
    </p>
  </section>
  
  <Separator />
  
  <!-- Design principles -->
  <section class="py-6">
    <h2 class="text-2xl font-semibold mb-6">Design Principles</h2>
    
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card.Root>
        <Card.Header class="space-y-1">
          <div class="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
            <Palette class="h-5 w-5 text-primary" />
          </div>
          <Card.Title>Minimal & Focused</Card.Title>
        </Card.Header>
        <Card.Content>
          <p class="text-muted-foreground">
            Every element serves a clear purpose, reducing visual clutter and cognitive load.
          </p>
        </Card.Content>
      </Card.Root>
      
      <Card.Root>
        <Card.Header class="space-y-1">
          <div class="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
            <Layers class="h-5 w-5 text-primary" />
          </div>
          <Card.Title>Consistent Hierarchy</Card.Title>
        </Card.Header>
        <Card.Content>
          <p class="text-muted-foreground">
            Visual hierarchy guides users through content with intentional typography and spacing.
          </p>
        </Card.Content>
      </Card.Root>
      
      <Card.Root>
        <Card.Header class="space-y-1">
          <div class="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-2">
            <Grid class="h-5 w-5 text-primary" />
          </div>
          <Card.Title>Responsive & Adaptive</Card.Title>
        </Card.Header>
        <Card.Content>
          <p class="text-muted-foreground">
            Interfaces that work seamlessly across all device sizes and orientations.
          </p>
        </Card.Content>
      </Card.Root>
    </div>
  </section>
  
  <Separator />
  
  <!-- Component categories -->
  <section class="py-6">
    <h2 class="text-2xl font-semibold mb-6">Component Categories</h2>
    
    <div class="grid sm:grid-cols-2 gap-6">
      <a href="/design-system/foundations/colors">
        <Card.Root class="h-full transition-all hover:border-primary">
          <Card.Header>
            <Card.Title>Foundations</Card.Title>
            <Card.Description>Colors, typography, spacing and other core design elements</Card.Description>
          </Card.Header>
          <Card.Content class="pt-4">
            <div class="flex space-x-2">
              <div class="h-8 w-8 rounded-full bg-primary"></div>
              <div class="h-8 w-8 rounded-full bg-secondary"></div>
              <div class="h-8 w-8 rounded-full bg-accent"></div>
              <div class="h-8 w-8 rounded-full bg-muted"></div>
            </div>
          </Card.Content>
        </Card.Root>
      </a>
      
      <a href="/design-system/components/button">
        <Card.Root class="h-full transition-all hover:border-primary">
          <Card.Header>
            <Card.Title>Components</Card.Title>
            <Card.Description>Reusable interface elements for building UIs</Card.Description>
          </Card.Header>
          <Card.Content class="flex flex-wrap gap-2 pt-4">
            <Button size="sm" variant="default">Default</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Button size="sm" variant="outline">Outline</Button>
          </Card.Content>
        </Card.Root>
      </a>
      
      <a href="/design-system/patterns/meeting" class="sm:col-span-2">
        <Card.Root class="transition-all hover:border-primary">
          <Card.Header>
            <Card.Title>Patterns</Card.Title>
            <Card.Description>Common UI patterns and layout solutions</Card.Description>
          </Card.Header>
          <Card.Content class="pt-4">
            <div class="bg-muted rounded-md p-4 border aspect-video max-h-[200px] flex items-center justify-center">
              <p class="text-muted-foreground">Meeting UI Pattern Preview</p>
            </div>
          </Card.Content>
        </Card.Root>
      </a>
    </div>
  </section>
  
  <Separator />
  
  <!-- Getting started -->
  <section class="py-6">
    <h2 class="text-2xl font-semibold mb-4">Getting Started</h2>
    <p class="mb-6 text-muted-foreground">
      Navigate through the categories in the sidebar to explore components, design foundations, and UI patterns.
    </p>
    
    <div class="flex flex-wrap gap-4">
      <Button href="/design-system/foundations/colors">Explore Foundations</Button>
      <Button href="/design-system/components/button" variant="outline">View Components</Button>
    </div>
  </section>
</DesignSystemLayout>
