import { writable } from 'svelte/store';

export interface User {
    id: string;
    email: string;
    name: string;
    pictureUrl?: string;
    isAdmin?: boolean;
}

const STORAGE_KEY = 'user_data';

function getStoredUser(): User | null {
    try {
        const sessionUser = sessionStorage.getItem(STORAGE_KEY);
        if (sessionUser) return JSON.parse(sessionUser);
        
        const localUser = localStorage.getItem(STORAGE_KEY);
        if (localUser) return JSON.parse(localUser);
        
        return null;
    } catch {
        return null;
    }
}

function createUserStore() {
    const { subscribe, set, update } = writable<User | null>(getStoredUser());

    return {
        subscribe,
        set: (value: User | null, remember: boolean = false) => {
            if (value) {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
                if (remember) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
                }
            } else {
                sessionStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STORAGE_KEY);
            }
            set(value);
        },
        update,
        clear: () => {
            sessionStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_KEY);
            set(null);
        }
    };
}

export const userStore = createUserStore();
