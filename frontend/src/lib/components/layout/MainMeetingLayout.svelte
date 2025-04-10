<script lang="ts">
    import {
        Settings,
        Mic,
        MicOff,
        Video,
        VideoOff,
        PhoneOff,
        MessageSquare,
        Users,
    } from "lucide-svelte";

    // Props for the component
    export let darkMode = false;
    export let micEnabled = true;
    export let cameraEnabled = true;
    export let participantCount = 0;
    export let meetingId: string;
    export let title = "Meet";
    export let connecting = false;
    export let connectionError: string | null = null;

    // Event dispatchers
    export let onToggleDarkMode = () => (darkMode = !darkMode);
    export let onToggleMic = () => {};
    export let onToggleCamera = () => {};
    export let onLeave = () => {};
    export let onSettings = () => {};
    export let onChat = () => {};
    export let onParticipants = () => {};
    export let onRetry = () => {};
</script>

<div class="flex flex-col h-[100vh]">
    <!-- Header -->
    <header
        class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-between items-center"
    >
        <div class="flex items-center space-x-4">
            <h1 class="text-xl font-medium">{title}</h1>
            <div class="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            <span class="text-sm text-gray-500 dark:text-gray-400"
                >{participantCount} participants</span
            >
        </div>

        <div class="flex items-center space-x-2">
            <button
                class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onclick={onSettings}
            >
                <Settings class="h-5 w-5" />
            </button>
        </div>
    </header>

    <!-- Main content -->
    <div class="flex-1 p-4">
        <div class="pl-2 flex flex-col">
            {#if connecting}
                <div class="flex items-center justify-center flex-grow">
                    <div class="text-center">
                        <div class="loading mb-4">Connecting...</div>
                        <p>Setting up your video call</p>
                    </div>
                </div>
            {:else if connectionError}
                <div class="flex items-center justify-center flex-grow">
                    <div class="text-center bg-red-50 p-6 rounded-lg">
                        <h3 class="text-xl text-red-700 mb-2">
                            Connection Error
                        </h3>
                        <p class="mb-4">{connectionError}</p>
                        <button
                            onclick={onRetry}
                            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            {:else}
                <div class="flex flex-col flex-grow">
                    <!-- Slot for video content -->
                    <slot />
                </div>
            {/if}
        </div>
    </div>

    <!-- Controls Bar -->
    <footer
        class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 px-6 py-4"
    >
        <div class="flex justify-between items-center">
            <div class="flex-1 flex justify-start">
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleTimeString()} • Meeting ID: {meetingId}
                </div>
            </div>

            <div class="flex-1 flex justify-center space-x-2">
                <button
                    class="p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    onclick={onToggleMic}
                >
                    {#if micEnabled}
                        <Mic class="h-6 w-6" />
                    {:else}
                        <MicOff class="h-6 w-6" />
                    {/if}
                </button>
                <button
                    class="p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    onclick={onToggleCamera}
                >
                    {#if cameraEnabled}
                        <Video class="h-6 w-6" />
                    {:else}
                        <VideoOff class="h-6 w-6" />
                    {/if}
                </button>
                <button
                    class="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                    onclick={onLeave}
                >
                    <PhoneOff class="h-6 w-6" />
                </button>
            </div>

            <div class="flex-1 flex justify-end space-x-2">
                <button
                    class="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    onclick={onChat}
                >
                    <MessageSquare class="h-5 w-5" />
                </button>
                <button
                    class="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    onclick={onParticipants}
                >
                    <Users class="h-5 w-5" />
                </button>
            </div>
        </div>
    </footer>
</div>

<style>
    .loading {
        display: inline-block;
        width: 50px;
        height: 50px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #3b82f6;
        animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    :global(html.dark) {
        background-color: #1a1a1a;
        color: white;
    }
</style>
