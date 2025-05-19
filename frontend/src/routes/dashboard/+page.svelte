<script lang="ts">
    import { onMount } from "svelte";
    import {
        createRoomAPI,
        listRoomsAPI,
        type UserRoomResponse,
    } from "$lib/api/room";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { fade } from "svelte/transition";
    import { CheckCircle2, AlertCircle } from "lucide-svelte";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";

    import { userStore } from "$lib/stores/user.store";

    let loading = $state(true);
    let rooms = $state<UserRoomResponse[]>([]);
    let error = $state<string | null>(null);

    let newMeetingName = $state("");
    let creatingMeeting = $state(false);
    let createMeetingError = $state<string | null>(null);

    let userName = $state("there"); // Default greeting

    onMount(() => {
        const unsubscribe = userStore.subscribe((user) => {
            if (user?.name) {
                userName = user.name;
            }
        });
        fetchRooms();

        return () => unsubscribe();
    });

    async function fetchRooms() {
        loading = true;
        error = null;
        try {
            const response = await listRoomsAPI();
            rooms = response;
        } catch (e: any) {
            console.error("Failed to fetch rooms:", e);
            error = e.message || "Failed to load meetings. Please try again.";
        } finally {
            loading = false;
        }
    }

    async function createMeeting() {
        if (!newMeetingName.trim() || creatingMeeting) {
            return;
        }

        creatingMeeting = true;
        createMeetingError = null;

        try {
            const newRoom = await createRoomAPI({ name: newMeetingName });
            newMeetingName = ""; // Clear input on success
            // Optionally, redirect to the new room or just refresh the list
            fetchRooms(); // Refresh list to show the new room
        } catch (e: any) {
            console.error("Failed to create meeting:", e);
            createMeetingError =
                e.message || "Failed to create meeting. Please try again.";
        } finally {
            creatingMeeting = false;
        }
    }

    function getStatusIndicator(isActive: boolean) {
        return isActive
            ? { icon: CheckCircle2, color: "text-green-500", text: "Active" }
            : { icon: AlertCircle, color: "text-yellow-500", text: "Inactive" };
    }
</script>

<svelte:head>
    <title>Dashboard - Bedrud</title>
</svelte:head>

<main
    class="min-h-screen bg-background transition-colors duration-200 flex flex-col"
>
    <!-- Header (can be a separate component later) -->
    <header
        class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur"
    >
        <div class="container flex h-14 items-center justify-between">
            <span class="text-xl font-bold">Bedrud Dashboard</span>
            <!-- Dark mode toggle could go here if needed -->
        </div>
    </header>

    <div class="container py-8 space-y-12">
        <section class="max-w-3xl mx-auto text-center mb-8">
            <h1 class="text-3xl font-bold tracking-tight">Hi {userName}!</h1>
            <p class="text-muted-foreground">
                Welcome to your Bedrud dashboard.
            </p>
        </section>

        <!-- Create Meeting Section -->
        <section class="max-w-3xl mx-auto space-y-4">
            <h2 class="text-2xl font-semibold tracking-tight text-center">
                Create a New Meeting
            </h2>
            <Card.Root>
                <Card.Content class="py-6 px-6 space-y-4">
                    <div class="space-y-2">
                        <Label for="meeting-name">Meeting Name</Label>
                        <Input
                            id="meeting-name"
                            placeholder="e.g. Team Standup"
                            bind:value={newMeetingName}
                            disabled={creatingMeeting}
                            onkeypress={(e) => {
                                if (e.key === "Enter" && !creatingMeeting) {
                                    e.preventDefault();
                                    createMeeting();
                                }
                            }}
                        />
                    </div>
                    {#if createMeetingError}
                        <p class="text-sm text-destructive">
                            {createMeetingError}
                        </p>
                    {/if}
                    <Button
                        class="w-full"
                        onclick={createMeeting}
                        disabled={creatingMeeting || !newMeetingName.trim()}
                    >
                        {#if creatingMeeting}
                            <div
                                class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                            ></div>
                        {/if}
                        Create Meeting
                    </Button>
                </Card.Content>
            </Card.Root>
        </section>

        <Separator />

        <!-- Your Meetings List -->
        <section class="max-w-3xl mx-auto space-y-6">
            <h1 class="text-3xl font-bold tracking-tight text-center">
                Your Meetings
            </h1>
            <p class="text-muted-foreground text-center">
                Browse your upcoming and past meetings.
            </p>

            <Separator />

            {#if loading}
                <p class="text-center text-muted-foreground">
                    Loading meetings...
                </p>
            {:else if error}
                <div class="text-center text-destructive">
                    <p>
                        {error}
                    </p>
                    <Button variant="outline" class="mt-4" onclick={fetchRooms}>
                        Retry
                    </Button>
                </div>
            {:else if rooms.length === 0}
                <p
                    class="text-center text-muted-foreground"
                    in:fade={{ duration: 200 }}
                >
                    You don't have any meetings yet.
                </p>
            {:else}
                <div class="grid gap-4" in:fade={{ duration: 200 }}>
                    {#each rooms as room (room.id)}
                        <Card.Root>
                            <Card.Header
                                class="flex flex-row items-center justify-between space-y-0 pb-2"
                            >
                                <Card.Title class="text-lg font-semibold"
                                    >{room.name}</Card.Title
                                >
                                <div
                                    class="flex items-center text-sm {getStatusIndicator(
                                        room.isActive,
                                    ).color}"
                                >
                                    <svelte:component
                                        this={getStatusIndicator(room.isActive)
                                            .icon}
                                        class="mr-1 h-4 w-4"
                                    />
                                    {getStatusIndicator(room.isActive).text}
                                </div>
                            </Card.Header>
                            <Card.Content>
                                <p class="text-sm text-muted-foreground">
                                    {room.relationship === "creator"
                                        ? "Created by you"
                                        : `Participant`}
                                </p>
                            </Card.Content>
                            <Card.Footer class="flex justify-end pt-0">
                                {#if room.isActive}
                                    <Button href={`/m/${room.name}`}
                                        >Enter Meeting</Button
                                    >
                                {:else}
                                    <Button variant="secondary" disabled
                                        >Meeting Ended</Button
                                    >
                                {/if}
                            </Card.Footer>
                        </Card.Root>
                    {/each}
                </div>
            {/if}
        </section>

        <!-- Footer (can be a separate component later) -->
        <footer
            class="w-full p-6 flex justify-center items-center border-t text-sm text-muted-foreground"
        >
            Bedrud © {new Date().getFullYear()}
        </footer>
    </div>
    <!-- Close container -->
</main>
