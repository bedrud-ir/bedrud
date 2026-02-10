/**
 * LiveKit Logger Configuration
 *
 * This module configures LiveKit logging and suppresses noisy internal messages.
 * Import and call initLiveKitLogging() early in your application to ensure proper filtering.
 */

import { setLogLevel, LogLevel } from "livekit-client";
import { debugStore } from "$lib/stores/debug.store";

// Messages to suppress from console output
const SUPPRESSED_MESSAGES = [
    "skipping empty frame",
    "re-acquired MediaStreamTrack",
    "restarting track with constraints",
    "room event connectionQualityChanged",
    "Track already unmuted",
];

let isInitialized = false;
let originalConsoleLog: typeof console.log | null = null;

/**
 * Initialize LiveKit log suppression.
 * Call this once at app startup before connecting to a room.
 */
export function initLiveKitLogging() {
    if (isInitialized) return;
    isInitialized = true;

    // Set LiveKit log level to warn (suppress debug/info)
    setLogLevel(LogLevel.warn);

    // Override console.log to filter noisy messages
    originalConsoleLog = console.log;
    console.log = (...args: unknown[]) => {
        if (shouldSuppressLog(args)) {
            return;
        }
        originalConsoleLog!.apply(console, args);
    };

    debugStore.debug("LiveKit logging initialized with suppression", "livekit");
}

/**
 * Restore original console.log behavior.
 */
export function restoreLiveKitLogging() {
    if (originalConsoleLog) {
        console.log = originalConsoleLog;
        originalConsoleLog = null;
        isInitialized = false;
        debugStore.debug("LiveKit logging restored to default", "livekit");
    }
}

/**
 * Check if a log message should be suppressed.
 */
function shouldSuppressLog(args: unknown[]): boolean {
    const firstArg = args[0];

    // Check string messages
    if (typeof firstArg === "string") {
        return SUPPRESSED_MESSAGES.some((msg) => firstArg.includes(msg));
    }

    // Check object messages (LiveKit often logs objects)
    if (typeof firstArg === "object" && firstArg !== null) {
        try {
            const msgStr = JSON.stringify(firstArg);
            return SUPPRESSED_MESSAGES.some((msg) => msgStr.includes(msg));
        } catch {
            // JSON.stringify can fail, ignore
            return false;
        }
    }

    return false;
}

/**
 * Add a message pattern to suppress.
 */
export function addSuppressedMessage(pattern: string) {
    if (!SUPPRESSED_MESSAGES.includes(pattern)) {
        SUPPRESSED_MESSAGES.push(pattern);
        debugStore.debug(`Added suppressed message pattern: ${pattern}`, "livekit");
    }
}

/**
 * Log a message through the debug store with LiveKit context.
 */
export function logLiveKit(
    message: string,
    level: "info" | "warn" | "error" | "debug" = "info"
) {
    debugStore.log(message, level, "livekit");
}
