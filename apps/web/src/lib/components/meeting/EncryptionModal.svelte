<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        ShieldCheck,
        ShieldAlert,
        X as CloseIcon,
        Info,
        Lock,
        EyeOff,
        Radio,
    } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let {
        isOpen,
        isEncrypted,
        isAdmin,
        onClose,
        onToggleE2EE,
    }: {
        isOpen: boolean;
        isEncrypted: boolean;
        isAdmin: boolean;
        onClose: () => void;
        onToggleE2EE: (enabled: boolean) => void;
    } = $props();
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
        transition:fade={{ duration: 200 }}
    >
        <div
            class="bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden w-full max-w-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800"
            transition:scale={{ duration: 300, start: 0.95 }}
            role="dialog"
            aria-modal="true"
        >
            <!-- Header -->
            <div class="relative p-8 pb-4">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        {#if isEncrypted}
                            <div
                                class="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"
                            >
                                <ShieldCheck class="h-6 w-6 text-emerald-500" />
                            </div>
                            <h2
                                class="text-2xl font-black text-gray-900 dark:text-white"
                            >
                                Secure Call
                            </h2>
                        {:else}
                            <div
                                class="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20"
                            >
                                <ShieldAlert class="h-6 w-6 text-amber-500" />
                            </div>
                            <h2
                                class="text-2xl font-black text-gray-900 dark:text-white"
                            >
                                Security Notice
                            </h2>
                        {/if}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        class="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        onclick={onClose}
                    >
                        <CloseIcon class="h-5 w-5 text-gray-400" />
                    </Button>
                </div>
            </div>

            <!-- Content -->
            <div class="p-8 pt-0 space-y-8">
                <div
                    class="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50"
                >
                    <p
                        class="text-gray-600 dark:text-gray-400 leading-relaxed text-lg"
                    >
                        {#if isEncrypted}
                            This call is protected with <strong
                                >End-to-End Encryption (E2EE)</strong
                            >. Only people in this meeting can hear or see
                            what's happening. Even Bedrud servers cannot access
                            your media.
                        {:else}
                            This call is currently <strong
                                >not end-to-end encrypted</strong
                            >. While your connection to our server is secure
                            (TLS), the server has access to the media for
                            features like recording or processing.
                        {/if}
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        class="p-6 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30"
                    >
                        <div class="flex items-center gap-3 mb-3">
                            <Lock class="h-5 w-5 text-indigo-500" />
                            <h3
                                class="font-bold text-gray-900 dark:text-white italic"
                            >
                                Encrypted (E2EE)
                            </h3>
                        </div>
                        <ul
                            class="text-sm space-y-2 text-gray-600 dark:text-gray-400"
                        >
                            <li>• Zero-knowledge security</li>
                            <li>• Keys only stored on devices</li>
                            <li>
                                • <span class="text-red-500 font-medium"
                                    >No recording allowed</span
                                >
                            </li>
                        </ul>
                    </div>

                    <div
                        class="p-6 rounded-[2rem] bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30"
                    >
                        <div class="flex items-center gap-3 mb-3">
                            <Radio class="h-5 w-5 text-emerald-500" />
                            <h3
                                class="font-bold text-gray-900 dark:text-white italic"
                            >
                                Standard (TLS)
                            </h3>
                        </div>
                        <ul
                            class="text-sm space-y-2 text-gray-600 dark:text-gray-400"
                        >
                            <li>• Industry standard security</li>
                            <li>• Supports recording & bots</li>
                            <li>• Optimal for large meetings</li>
                        </ul>
                    </div>
                </div>

                <div class="flex flex-col gap-4">
                    {#if isAdmin}
                        <Button
                            variant={isEncrypted ? "outline" : "default"}
                            class="w-full h-14 rounded-2xl font-bold text-base transition-all active:scale-95 {isEncrypted
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200'}"
                            onclick={() => onToggleE2EE(!isEncrypted)}
                        >
                            {isEncrypted
                                ? "Disable E2EE for All"
                                : "Enable End-to-End Encryption for All"}
                        </Button>
                    {/if}

                    <p
                        class="text-center text-[11px] text-gray-400 uppercase tracking-widest font-black"
                    >
                        Powered by LiveKit WebRTC
                    </p>
                </div>
            </div>
        </div>
    </div>
{/if}
