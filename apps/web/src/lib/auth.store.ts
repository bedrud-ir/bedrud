import { create } from 'zustand'

export interface AuthTokens {
  accessToken: string
  refreshToken: string | null
}

const REMEMBER_KEY = 'auth_remember'

interface AuthStore {
  tokens: AuthTokens | null
  initialized: boolean
  setTokens: (tokens: AuthTokens, remember?: boolean | 'ephemeral') => void
  updateAccessToken: (accessToken: string) => void
  clear: () => void
  initialize: () => Promise<void>
}

const BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? ''

const _init = { promise: null as Promise<void> | null }

export const useAuthStore = create<AuthStore>()((set, get) => ({
  tokens: null,
  initialized: false,

  setTokens: (tokens, remember = true) => {
    set({ tokens })
    if (remember === 'ephemeral') return
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, '1')
    } else {
      sessionStorage.setItem(REMEMBER_KEY, '1')
    }
  },

  updateAccessToken: (accessToken) => {
    const current = get().tokens
    if (!current) return
    set({ tokens: { ...current, accessToken } })
  },

  clear: () => {
    set({ tokens: null, initialized: false })
    _init.promise = null
    localStorage.removeItem(REMEMBER_KEY)
    sessionStorage.removeItem(REMEMBER_KEY)
  },

  initialize: async () => {
    if (get().initialized) return

    // Deduplicate: if an initialize() call is already in-flight, reuse it.
    if (_init.promise) return _init.promise

    _init.promise = (async () => {
      const wasRemembered = Boolean(localStorage.getItem(REMEMBER_KEY)) || Boolean(sessionStorage.getItem(REMEMBER_KEY))

      if (!wasRemembered) {
        set({ initialized: true })
        return
      }

      try {
        const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })

        if (res.ok) {
          const data = (await res.json()) as { access_token: string; refresh_token: string }
          get().setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })
        } else {
          get().clear()
        }
      } catch {
        // Network error — leave remember flag for retry on next page load.
      }

      set({ initialized: true })
      _init.promise = null
    })()

    return _init.promise
  },
}))
