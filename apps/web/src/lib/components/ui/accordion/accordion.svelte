<script lang="ts">
    import { setContext } from "svelte";
    import { cn } from "$lib/utils.js";

    let {
        value = $bindable(),
        type = "single",
        class: className,
        children,
        ...restProps
    }: {
        value?: string | string[];
        type?: "single" | "multiple";
        class?: string;
        children?: import("svelte").Snippet;
        [key: string]: any;
    } = $props();

    let openItems = $state(
        type === "single"
            ? value
                ? [value as string]
                : []
            : (value as string[]) || [],
    );

    $effect(() => {
        if (type === "single") {
            value = openItems[0] || "";
        } else {
            value = openItems;
        }
    });

    setContext("accordion", {
        get openItems() {
            return openItems;
        },
        toggle(id: string) {
            if (type === "single") {
                openItems = openItems.includes(id) ? [] : [id];
            } else {
                openItems = openItems.includes(id)
                    ? openItems.filter((i) => i !== id)
                    : [...openItems, id];
            }
        },
    });
</script>

<div class={cn("grid", className)} {...restProps}>
    {@render children?.()}
</div>
