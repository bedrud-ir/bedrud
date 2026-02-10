<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Room } from "livekit-client";
    import { type Message } from "$lib/models/chat";
    import { Button } from "$lib/components/ui/button";
    import {
        Send,
        X,
        Info,
        Crown,
        Image as ImageIcon,
        Loader2,
        Download,
    } from "lucide-svelte";
    import { debugStore } from "$lib/stores/debug.store";

    let {
        room,
        messages,
        onClose,
        adminId,
    }: {
        room: Room;
        messages: Message[];
        onClose: () => void;
        adminId?: string;
    } = $props();

    let newMessage = $state("");
    let isUploading = $state(false);
    let fileInput: HTMLInputElement;
    let scrollContainer: HTMLDivElement;

    // Image states
    let pendingImage = $state<string | null>(null);
    let previewImage = $state<string | null>(null);

    const encoder = new TextEncoder();

    const log = (m: string, type: "info" | "error" | "warn" = "info") => {
        debugStore.log(m, type, "CHAT");
        console.log(`[CHAT] ${m}`);
    };

    function scrollToBottom() {
        if (scrollContainer) {
            setTimeout(() => {
                scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                });
            }, 50);
        }
    }

    $effect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    });

    async function sendMessage() {
        if (!newMessage.trim() || !room) return;

        const msg: Message = {
            sender: room.localParticipant.identity,
            text: newMessage.trim(),
            timestamp: Date.now(),
            isLocal: true,
        };

        try {
            log(`Publishing message: ${msg.text}`);
            const data = encoder.encode(
                JSON.stringify({
                    type: "chat",
                    text: msg.text,
                    timestamp: msg.timestamp,
                }),
            );

            await room.localParticipant.publishData(data, {
                reliable: true,
            });

            log("Message published successfully");
            messages.push(msg);
            newMessage = "";
            scrollToBottom();
        } catch (error: any) {
            log(`Failed to send message: ${error.message}`, "error");
            console.error("Failed to send message:", error);
        }
    }

    async function handleFileSelect(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const base64 = await processImage(file);
            if (base64) pendingImage = base64;
        }
    }

    async function handlePaste(e: ClipboardEvent) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                    e.preventDefault();
                    const base64 = await processImage(file);
                    if (base64) pendingImage = base64;
                    break;
                }
            }
        }
    }

    async function processImage(file: File): Promise<string | null> {
        if (!file.type.startsWith("image/")) {
            log("Invalid file type", "error");
            return null;
        }

        try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const originalBase64 = await base64Promise;
            const img = new Image();
            img.src = originalBase64;
            await new Promise((resolve) => (img.onload = resolve));

            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1200; // Increased quality for lightbox
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);

            return canvas.toDataURL("image/jpeg", 0.8);
        } catch (error) {
            log("Error processing image", "error");
            return null;
        }
    }

    async function confirmSendImage() {
        if (!pendingImage || !room) return;

        isUploading = true;
        try {
            const msg: Message = {
                sender: room.localParticipant.identity,
                imageUrl: pendingImage,
                timestamp: Date.now(),
                isLocal: true,
            };

            const data = encoder.encode(
                JSON.stringify({
                    type: "chat",
                    imageUrl: msg.imageUrl,
                    timestamp: msg.timestamp,
                }),
            );

            await room.localParticipant.publishData(data, {
                reliable: true,
            });

            messages.push(msg);
            log("Image sent successfully");
            pendingImage = null;
            scrollToBottom();
        } catch (error: any) {
            log(`Failed to send image: ${error.message}`, "error");
        } finally {
            isUploading = false;
            if (fileInput) fileInput.value = "";
        }
    }

    function downloadImage(url: string) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `bedrud-image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function isSafeUrl(url: string | undefined): boolean {
        if (!url) return false;
        // Only allow data URLs for images to prevent XSS/SSRF via external URLs if they were injected
        return (
            url.startsWith("data:image/jpeg;") ||
            url.startsWith("data:image/png;") ||
            url.startsWith("data:image/webp;") ||
            url.startsWith("data:image/gif;")
        );
    }

    onMount(() => {
        log("Chat component mounted");
        scrollToBottom();
    });

    onDestroy(() => {
        log("Chat component destroying");
    });

    function getGroupStyles(index: number) {
        const current = messages[index];
        const prev = messages[index - 1];
        const next = messages[index + 1];

        const isFirst =
            !prev ||
            prev.sender !== current.sender ||
            current.timestamp - prev.timestamp > 60000;
        const isLast =
            !next ||
            next.sender !== current.sender ||
            next.timestamp - current.timestamp > 60000;

        if (current.isLocal) {
            if (isFirst && isLast) return "rounded-[20px]";
            if (isFirst) return "rounded-[20px] rounded-br-[4px]";
            if (isLast) return "rounded-[20px] rounded-tr-[4px]";
            return "rounded-[20px] rounded-br-[4px] rounded-tr-[4px]";
        } else {
            if (isFirst && isLast) return "rounded-[20px]";
            if (isFirst) return "rounded-[20px] rounded-bl-[4px]";
            if (isLast) return "rounded-[20px] rounded-tl-[4px]";
            return "rounded-[20px] rounded-bl-[4px] rounded-tl-[4px]";
        }
    }

    function getParticipantAvatar(identity: string) {
        let p: any = null;
        if (room.localParticipant.identity === identity) {
            p = room.localParticipant;
        } else {
            p = room.remoteParticipants.get(identity);
        }

        if (p?.metadata) {
            try {
                const meta = JSON.parse(p.metadata);
                return meta.avatar || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    function getParticipantName(identity: string) {
        if (room.localParticipant.identity === identity) {
            return room.localParticipant.name || "You";
        }
        const p = room.remoteParticipants.get(identity);
        return p?.name || identity;
    }

    function formatMessage(text: string) {
        if (!text) return [];
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part) => {
            if (part.match(urlRegex)) {
                return { type: "link", content: part };
            }
            return { type: "text", content: part };
        });
    }
</script>

<div
    class="flex flex-col h-full bg-background border-l border-border w-full shadow-2xl overflow-hidden font-sans"
>
    <div
        class="h-16 px-6 flex items-center justify-between border-b border-border"
    >
        <h2 class="text-foreground text-[18px] font-medium">
            In-call messages
        </h2>
        <Button
            variant="ghost"
            size="icon"
            onclick={onClose}
            class="text-muted-foreground hover:bg-accent rounded-full h-10 w-10"
        >
            <X class="h-5 w-5" />
        </Button>
    </div>

    <div
        bind:this={scrollContainer}
        class="flex-1 overflow-y-auto px-6 py-2 space-y-1 scrollbar-custom bg-background"
    >
        <div
            class="bg-muted/50 p-4 rounded-xl mb-6 flex gap-3 items-start border border-border"
        >
            <Info class="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p class="text-[13px] text-muted-foreground leading-normal">
                Messages can only be seen by people in the call and are deleted
                when the call ends.
            </p>
        </div>

        {#each messages as msg, i}
            {@const prev = messages[i - 1]}
            {@const isFirstInGroup =
                !prev ||
                prev.sender !== msg.sender ||
                msg.timestamp - prev.timestamp > 60000}

            {#if i === 0 || msg.timestamp - messages[i - 1].timestamp > 300000}
                <div class="w-full text-center pt-8 pb-4">
                    <span
                        class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
            {/if}

            <div
                class="flex flex-col w-full"
                class:items-end={msg.isLocal}
                class:mt-6={isFirstInGroup && i > 0}
            >
                {#if !msg.isLocal && isFirstInGroup}
                    <div class="flex items-center gap-2 mb-1 ml-10">
                        <span class="text-[12px] font-medium text-foreground"
                            >{getParticipantName(msg.sender)}</span
                        >
                        <span class="text-[10px] text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                {/if}

                <div
                    class="flex items-end gap-2 w-full"
                    class:flex-row-reverse={msg.isLocal}
                >
                    {#if !msg.isLocal}
                        <div class="w-8 h-8 shrink-0 flex-none ml-0 relative">
                            {#if isFirstInGroup}
                                <div
                                    class="w-full h-full rounded-xl bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase overflow-hidden"
                                >
                                    {#if getParticipantAvatar(msg.sender)}
                                        <img
                                            src={getParticipantAvatar(
                                                msg.sender,
                                            )}
                                            alt=""
                                            class="w-full h-full object-cover"
                                        />
                                    {:else}
                                        {getParticipantName(msg.sender).charAt(
                                            0,
                                        )}
                                    {/if}
                                </div>
                                {#if adminId === msg.sender}
                                    <div
                                        class="absolute -top-2 -right-1 bg-yellow-400 rounded-full p-0.5 border border-white shadow-sm"
                                    >
                                        <Crown
                                            class="h-2 w-2 text-white fill-white"
                                        />
                                    </div>
                                {/if}
                            {/if}
                        </div>
                    {/if}

                    <div
                        class="max-w-[85%] w-fit px-4 py-2 text-[14px] leading-relaxed transition-all break-words shadow-sm {getGroupStyles(
                            i,
                        )}"
                        class:bg-blue-600={msg.isLocal}
                        class:text-white={msg.isLocal}
                        class:dark:bg-blue-700={msg.isLocal}
                        class:dark:text-blue-50={msg.isLocal}
                        class:bg-muted={!msg.isLocal}
                        class:text-foreground={!msg.isLocal}
                        dir="auto"
                    >
                        {#if msg.imageUrl}
                            {#if isSafeUrl(msg.imageUrl)}
                                <button
                                    type="button"
                                    class="relative group block p-0 border-none bg-transparent text-left overflow-hidden rounded-lg outline-none"
                                    onclick={() =>
                                        (previewImage = msg.imageUrl || null)}
                                    aria-label="View full size image"
                                >
                                    <img
                                        src={msg.imageUrl}
                                        alt="Shared in chat"
                                        class="max-w-full h-auto cursor-pointer hover:opacity-90"
                                    />
                                </button>
                            {:else}
                                <div class="italic text-red-500 text-xs py-1">
                                    Blocked unsafe content
                                </div>
                            {/if}
                        {/if}
                        {#if msg.text}
                            <div class={msg.imageUrl ? "mt-2" : ""}>
                                {#each formatMessage(msg.text) as part}
                                    {#if part.type === "link"}
                                        <a
                                            href={part.content}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="underline underline-offset-2 break-all font-medium transition-colors"
                                            class:text-blue-100={msg.isLocal}
                                            class:hover:text-white={msg.isLocal}
                                            class:text-blue-600={!msg.isLocal}
                                            class:dark:text-blue-400={!msg.isLocal}
                                            class:hover:text-blue-800={!msg.isLocal}
                                            class:dark:hover:text-blue-300={!msg.isLocal}
                                        >
                                            {part.content}
                                        </a>
                                    {:else}
                                        {part.content}
                                    {/if}
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Pending Image Preview -->
    {#if pendingImage}
        <div class="px-4 py-3 border-t border-border bg-muted/30">
            <div
                class="relative w-24 h-24 rounded-lg overflow-hidden border border-border shadow-sm"
            >
                <img
                    src={pendingImage}
                    alt="Pending"
                    class="w-full h-full object-cover"
                />
                <button
                    onclick={() => (pendingImage = null)}
                    class="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                >
                    <X class="h-3 w-3" />
                </button>
            </div>
            <div class="mt-3 flex gap-2">
                <Button
                    size="sm"
                    class="h-8 px-4 text-[12px] bg-[#1a73e8] hover:bg-[#185abc] text-white rounded-full transition-all"
                    onclick={confirmSendImage}
                    disabled={isUploading}
                >
                    {#if isUploading}
                        <Loader2 class="h-3 w-3 animate-spin mr-1.5" />
                    {/if}
                    Send Photo
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 px-4 text-[12px] text-muted-foreground hover:bg-accent rounded-full"
                    onclick={() => (pendingImage = null)}
                    disabled={isUploading}
                >
                    Cancel
                </Button>
            </div>
        </div>
    {/if}

    <div class="p-4 bg-background border-t border-border">
        <form
            onsubmit={(e) => {
                e.preventDefault();
                sendMessage();
            }}
            class="flex items-center bg-muted rounded-[28px] h-12 pl-5 pr-2 focus-within:ring-1 focus-within:ring-ring"
        >
            <input
                bind:value={newMessage}
                onpaste={handlePaste}
                placeholder="Send a message"
                class="flex-1 bg-transparent border-none outline-none text-foreground text-[14px] placeholder:text-muted-foreground"
                autocomplete="off"
            />

            <input
                type="file"
                accept="image/*"
                class="hidden"
                bind:this={fileInput}
                onchange={handleFileSelect}
            />

            <button
                type="button"
                onclick={() => fileInput?.click()}
                disabled={isUploading}
                class="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-full"
                title="Send photo"
            >
                {#if isUploading}
                    <Loader2 class="h-5 w-5 animate-spin" />
                {:else}
                    <ImageIcon class="h-5 w-5" />
                {/if}
            </button>

            <button
                type="submit"
                disabled={!newMessage.trim() || isUploading}
                class="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-full"
            >
                <Send class="h-5 w-5" />
            </button>
        </form>
    </div>
</div>

<!-- Lightbox Modal -->
{#if previewImage}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
        onclick={() => (previewImage = null)}
    >
        <div class="absolute top-6 right-6 flex gap-4">
            <button
                onclick={(e) => {
                    e.stopPropagation();
                    downloadImage(previewImage!);
                }}
                class="text-white/70 hover:text-white transition-colors p-2"
                title="Download"
            >
                <Download class="h-6 w-6" />
            </button>
            <button
                onclick={() => (previewImage = null)}
                class="text-white/70 hover:text-white transition-colors p-2"
                title="Close"
            >
                <X class="h-6 w-6" />
            </button>
        </div>

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <img
            src={previewImage}
            alt="Preview"
            class="max-w-[95%] max-h-[95%] object-contain rounded-lg shadow-2xl select-none"
            onclick={(e) => e.stopPropagation()}
        />
    </div>
{/if}

<style>
    .scrollbar-custom::-webkit-scrollbar-track {
        background: transparent;
    }
    .scrollbar-custom::-webkit-scrollbar-thumb {
        background-color: hsl(var(--muted-foreground) / 0.2);
        border-radius: 9999px;
        border: 2px solid transparent;
        background-clip: padding-box;
    }
    .scrollbar-custom::-webkit-scrollbar-thumb:hover {
        background-color: hsl(var(--muted-foreground) / 0.4);
    }
</style>
