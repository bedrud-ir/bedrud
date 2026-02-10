<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Video, VideoOff, ChevronUp } from "lucide-svelte";
    import { Room, Track } from "livekit-client";

    let {
        enabled,
        room,
        devices,
        onToggle,
        onDeviceSelect,
        onOpen,
    }: {
        enabled: boolean;
        room: Room | null;
        devices: MediaDeviceInfo[];
        onToggle: () => void;
        onDeviceSelect: (deviceId: string) => void;
        onOpen: () => void;
    } = $props();

    const currentCamLabel = $derived(
        room?.localParticipant?.getTrackPublication(Track.Source.Camera)?.track
            ?.mediaStreamTrack.label,
    );
</script>

<div class="flex items-center">
    <Button
        variant={enabled ? "outline" : "destructive"}
        size="icon"
        onclick={onToggle}
        class="rounded-r-none border-r-0"
    >
        {#if enabled}
            <Video class="h-4 w-4" />
        {:else}
            <VideoOff class="h-4 w-4" />
        {/if}
    </Button>

    <DropdownMenu.Root onOpenChange={(open) => open && onOpen()}>
        <DropdownMenu.Trigger>
            {#snippet child({ props })}
                <Button
                    {...props}
                    variant={enabled ? "outline" : "destructive"}
                    size="icon"
                    class="h-10 w-6 p-0 rounded-l-none border-l-[1px] border-l-white/10"
                >
                    <ChevronUp class="h-3 w-3" />
                </Button>
            {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="center" side="top" class="w-56">
            <DropdownMenu.Group>
                <DropdownMenu.Label>Select Camera</DropdownMenu.Label>
                {#each devices as device}
                    <DropdownMenu.Item
                        onclick={() => onDeviceSelect(device.deviceId)}
                        class="flex items-center justify-between"
                    >
                        <span class="truncate">
                            {device.label ||
                                `Camera ${device.deviceId.substring(0, 5)}`}
                        </span>
                        {#if currentCamLabel === device.label}
                            <div class="w-2 h-2 rounded-full bg-primary"></div>
                        {/if}
                    </DropdownMenu.Item>
                {:else}
                    <div
                        class="px-2 py-1.5 text-xs text-muted-foreground italic"
                    >
                        No cameras found
                    </div>
                {/each}
            </DropdownMenu.Group>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
</div>
