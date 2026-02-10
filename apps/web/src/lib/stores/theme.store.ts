import { writable } from 'svelte/store';
import { getSetting, saveSetting } from '../storage';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
    const { subscribe, set } = writable<Theme>('system');

    return {
        subscribe,
        init: async () => {
            if (!browser) return;
            const savedTheme = await getSetting<Theme>('theme', 'system');
            set(savedTheme);
            applyTheme(savedTheme);
        },
        setTheme: async (newTheme: Theme) => {
            set(newTheme);
            if (browser) {
                await saveSetting('theme', newTheme);
                applyTheme(newTheme);
            }
        }
    };
}

function applyTheme(theme: Theme) {
    if (!browser) return;

    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(pre-base64: dark)').matches);

    // Wait, the matchMedia query should be '(prefers-color-scheme: dark)'
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const effectiveTheme = theme === 'system' ? (darkQuery.matches ? 'dark' : 'light') : theme;

    if (effectiveTheme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export const themeStore = createThemeStore();
