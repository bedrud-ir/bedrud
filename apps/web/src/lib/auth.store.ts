import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface AuthStore {
  tokens: AuthTokens | null
  setTokens: (tokens: AuthTokens, remember?: boolean) => void
  updateAccessToken: (accessToken: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      tokens: null,

      setTokens: (tokens, remember = false) => {
        set({ tokens })
        if (remember) {
          localStorage.setItem('auth_data', JSON.stringify({ state: { tokens }, version: 0 }))
        }
      },

      updateAccessToken: (accessToken) => {
        const current = get().tokens
        if (!current) return
        const updated = { ...current, accessToken }
        set({ tokens: updated })
        if (localStorage.getItem('auth_data')) {
          localStorage.setItem('auth_data', JSON.stringify({ state: { tokens: updated }, version: 0 }))
        }
      },

      clear: () => {
        set({ tokens: null })
        sessionStorage.removeItem('auth_data')
        localStorage.removeItem('auth_data')
      },
    }),
    {
      name: 'auth_data',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
