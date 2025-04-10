import { writable } from 'svelte/store';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

const STORAGE_KEY = 'auth_data';

function getStoredAuth(): AuthTokens | null {
    try {
        const sessionAuth = sessionStorage.getItem(STORAGE_KEY);
        if (sessionAuth) return JSON.parse(sessionAuth);
        
        const localAuth = localStorage.getItem(STORAGE_KEY);
        if (localAuth) return JSON.parse(localAuth);
        
        return null;
    } catch {
        return null;
    }
}

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthTokens | null>(getStoredAuth());

    return {
        subscribe,
        setTokens: (tokens: AuthTokens, remember: boolean = false) => {
            if (tokens) {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
                if (remember) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
                }
            }
            set(tokens);
        },
        updateAccessToken: (accessToken: string) => {
            update(tokens => {
                if (!tokens) return null;
                const newTokens = { ...tokens, accessToken };
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens));
                if (localStorage.getItem(STORAGE_KEY)) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens));
                }
                return newTokens;
            });
        },
        clear: () => {
            sessionStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_KEY);
            set(null);
        }
    };
}

export const authStore = createAuthStore();
