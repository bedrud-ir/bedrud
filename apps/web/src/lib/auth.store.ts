import { create } from 'zustand'

export interface AuthTokens {
  accessToken: string
  refreshToken: string | null
}

interface AuthStore {
  tokens: AuthTokens | null
  setTokens: (tokens: AuthTokens, remember?: boolean) => void
  updateAccessToken: (accessToken: string) => void
  clear: () => void
}

function loadTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem('auth_data') ?? sessionStorage.getItem('auth_data')
    if (!raw) return null
    return JSON.parse(raw).state?.tokens ?? null
  } catch {
    return null
  }
}

function saveTokens(tokens: AuthTokens, remember: boolean) {
  const payload = JSON.stringify({ state: { tokens }, version: 0 })
  if (remember) {
    localStorage.setItem('auth_data', payload)
    sessionStorage.removeItem('auth_data')
  } else {
    sessionStorage.setItem('auth_data', payload)
    localStorage.removeItem('auth_data')
  }
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  tokens: loadTokens(),

  setTokens: (tokens, remember = false) => {
    set({ tokens })
    saveTokens(tokens, remember)
  },

  updateAccessToken: (accessToken) => {
    const current = get().tokens
    if (!current) return
    const updated = { ...current, accessToken }
    set({ tokens: updated })
    // Preserve the original remember choice by checking which storage currently holds the token
    const inLocalStorage = Boolean(localStorage.getItem('auth_data'))
    saveTokens(updated, inLocalStorage)
  },

  clear: () => {
    set({ tokens: null })
    localStorage.removeItem('auth_data')
    sessionStorage.removeItem('auth_data')
  },
}))
