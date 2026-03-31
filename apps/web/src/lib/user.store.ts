import { create } from 'zustand'

export interface User {
  id: string
  email: string
  name: string
  provider: string
  isAdmin: boolean
  avatarUrl?: string
}

interface UserStore {
  user: User | null
  setUser: (user: User) => void
  clear: () => void
}

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}))
