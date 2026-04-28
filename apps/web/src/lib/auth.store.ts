import { create } from 'zustand'

export interface AuthTokens {
  accessToken: string
  refreshToken: string | null
}

const REMEMBER_KEY = 'auth_remember'
const ACCESS_TOKEN_KEY = 'auth_at'

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
    if (remember === 'ephemeral') {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
      return
    }
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, '1')
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    } else {
      sessionStorage.setItem(REMEMBER_KEY, '1')
      sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    }
  },

  updateAccessToken: (accessToken) => {
    const current = get().tokens
    if (!current) return
    set({ tokens: { ...current, accessToken } })
    const storage = localStorage.getItem(REMEMBER_KEY) ? localStorage : sessionStorage
    storage.setItem(ACCESS_TOKEN_KEY, accessToken)
  },

  clear: () => {
    set({ tokens: null, initialized: false })
    _init.promise = null
    localStorage.removeItem(REMEMBER_KEY)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REMEMBER_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
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

      // Try cookie-based refresh first (primary path).
      try {
        const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })

        if (res.ok) {
          const data = (await res.json()) as { access_token: string; refresh_token: string }
          get().setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })
          set({ initialized: true })
          return
        }
      } catch {
        // Network error — fall through to persisted token
      }

      // Fallback: use the persisted access token. It may still be valid
      // (24h TTL) even if the refresh cookie was lost.
      const storage = localStorage.getItem(REMEMBER_KEY) ? localStorage : sessionStorage
      const persistedAT = storage.getItem(ACCESS_TOKEN_KEY)
      if (persistedAT) {
        // Validate by calling /api/auth/me
        try {
          const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${persistedAT}` },
            credentials: 'include',
          })
          if (meRes.ok) {
            get().setTokens({ accessToken: persistedAT, refreshToken: null })
            set({ initialized: true })
            return
          }
        } catch {
          // Token expired — fall through to clear
        }
      }

      // Both paths failed — clear session
      get().clear()
      set({ initialized: true })
      _init.promise = null
    })()

    return _init.promise
  },
}))
