import { create } from 'zustand'

export interface AuthTokens {
  accessToken: string
  refreshToken: string | null
}

const REMEMBER_KEY = 'auth_remember'

interface AuthStore {
  tokens: AuthTokens | null
  initialized: boolean
  setTokens: (tokens: AuthTokens, remember?: boolean) => void
  updateAccessToken: (accessToken: string) => void
  clear: () => void
  initialize: () => Promise<void>
}

const BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? ''

export const useAuthStore = create<AuthStore>()((set, get) => ({
  tokens: null,
  initialized: false,

  setTokens: (tokens, remember = true) => {
    set({ tokens })
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
    set({ tokens: null })
    localStorage.removeItem(REMEMBER_KEY)
    sessionStorage.removeItem(REMEMBER_KEY)
  },

  /**
   * Attempt to restore a session on page load by calling the refresh endpoint.
   * The server identifies the user via the HTTP-only refresh_token cookie
   * (sent automatically with `credentials: 'include'`).  If the cookie is
   * absent or the refresh token has expired, the user stays logged out.
   */
  initialize: async () => {
    if (get().initialized) return

    // Only attempt refresh if the user previously chose "remember me"
    const wasRemembered =
      Boolean(localStorage.getItem(REMEMBER_KEY)) ||
      Boolean(sessionStorage.getItem(REMEMBER_KEY))

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
        const data = (await res.json()) as {
          access_token: string
          refresh_token: string
        }
        get().setTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        })
      } else {
        // Refresh failed — clear the remember flag so we don't retry every
        // navigation until the user explicitly logs in again.
        get().clear()
      }
    } catch {
      // Network error — leave the remember flag intact so we can retry on
      // the next page load.  The user stays logged out for this session.
    }

    set({ initialized: true })
  },
}))
