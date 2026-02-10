import { writable } from 'svelte/store';

export interface LogEntry {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    context?: string;
}

function createDebugStore() {
    const { subscribe, update } = writable<LogEntry[]>([]);

    const store = {
        subscribe,
        log: (message: string, level: LogEntry['level'] = 'info', context: string = 'app') => {
            console[level](`[${context}] ${message}`);
            update(logs => [...logs, { timestamp: new Date(), level, message, context }].slice(-100));
        },
        info: (message: string, context?: string) => store.log(message, 'info', context),
        warn: (message: string, context?: string) => store.log(message, 'warn', context),
        error: (message: string, context?: string) => store.log(message, 'error', context),
        debug: (message: string, context?: string) => store.log(message, 'debug', context),
        clear: () => update(() => [])
    };

    return store;
}

export const debugStore = createDebugStore();
