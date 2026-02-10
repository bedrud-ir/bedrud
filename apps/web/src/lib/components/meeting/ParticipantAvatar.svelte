<script lang="ts">
    import { Participant } from "livekit-client";

    let {
        participant,
        audioLevel = 0,
        recentlyTalking = false,
        isMobile = false,
        displayName = "",
        threshold = 0.001,
    }: {
        participant: Participant;
        audioLevel?: number;
        recentlyTalking?: boolean;
        isMobile?: boolean;
        displayName?: string;
        threshold?: number;
    } = $props();

    function getAvatar() {
        if (participant?.metadata) {
            try {
                const meta = JSON.parse(participant.metadata);
                return meta.avatar || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    let avatar = $derived(getAvatar());
</script>

<div class="relative">
    <!-- Ultra Sensitivity Sound Wave / Single Massive Ring -->
    {#if recentlyTalking}
        <div
            class="absolute inset-0 rounded-full bg-blue-500/15 pointer-events-none"
            style="
                transform: scale({1 + audioLevel * 4.2});
                transition: transform {audioLevel > threshold
                ? '0.05s'
                : '1.5s'} ease-out, opacity 2.2s ease-out;
                opacity: {audioLevel > threshold ? 0.9 : 0};
            "
        ></div>
    {/if}

    <div
        class="relative rounded-full overflow-hidden transition-all duration-75
               {isMobile
            ? 'w-24 h-24 border bg-gray-800'
            : 'w-32 h-32 md:w-40 md:h-40 border-4 bg-gray-800 shadow-2xl'}"
        style="
            border-color: {recentlyTalking
            ? 'rgba(37, 99, 235, 1)'
            : 'rgba(55, 65, 81, 0.4)'};
            border-width: {recentlyTalking
            ? isMobile
                ? `${1.5 + audioLevel * 3}px`
                : `${3 + audioLevel * 5}px`
            : ''};
            box-shadow: {recentlyTalking
            ? `0 0 ${25 + audioLevel * 150}px rgba(37, 99, 235, ${0.4 + audioLevel * 0.6})`
            : 'none'};
            transform: scale({1 + audioLevel * 0.04});
        "
    >
        {#if avatar}
            <img src={avatar} alt="" class="w-full h-full object-cover" />
        {:else}
            <div
                class="w-full h-full flex items-center justify-center text-white font-black {isMobile
                    ? 'bg-gray-700 text-3xl font-medium'
                    : 'bg-gradient-to-br from-primary to-indigo-700 text-5xl'}"
            >
                {displayName.charAt(0).toUpperCase()}
            </div>
        {/if}
    </div>
</div>
