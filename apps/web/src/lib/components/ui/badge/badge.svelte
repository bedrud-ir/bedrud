<script lang="ts" module>
    import type { HTMLAttributes } from "svelte/elements";
    import { tv, type VariantProps } from "tailwind-variants";

    export const badgeVariants = tv({
        base: "focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground hover:bg-primary/80 border-transparent",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent",
                outline: "text-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    });

    export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

    export type BadgeProps = HTMLAttributes<HTMLDivElement> & {
        variant?: BadgeVariant;
    };
</script>

<script lang="ts">
    import { cn } from "$lib/utils.js";

    let {
        class: className,
        variant = "default",
        children,
        ...rest
    }: BadgeProps = $props();
</script>

<div class={cn(badgeVariants({ variant }), className)} {...rest}>
    {@render children?.()}
</div>
