import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme })
        if (typeof document === 'undefined') return
        // Only apply if the class isn't already correct (avoids fighting
        // a view-transition that already toggled the class directly).
        const resolved = resolveTheme(theme)
        const isDark = document.documentElement.classList.contains('dark')
        if ((resolved === 'dark') !== isDark) applyTheme(theme)
      },
    }),
    { name: 'theme' },
  ),
)

/** Resolves 'system' to the actual OS preference. Returns 'light' on SSR. */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

/** Applies the correct class to <html>. Safe to call outside React. No-op on SSR. */
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(theme)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}
