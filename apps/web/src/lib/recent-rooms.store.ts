import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecentRoom {
  name: string
  joinedAt: number
}

interface RecentRoomsState {
  rooms: RecentRoom[]
  add: (name: string) => void
  remove: (name: string) => void
  clear: () => void
}

const MAX_RECENT = 20

export const useRecentRoomsStore = create<RecentRoomsState>()(
  persist(
    (set) => ({
      rooms: [],
      add: (name) =>
        set((s) => ({
          rooms: [
            { name, joinedAt: Date.now() },
            ...s.rooms.filter((r) => r.name !== name),
          ].slice(0, MAX_RECENT),
        })),
      remove: (name) =>
        set((s) => ({ rooms: s.rooms.filter((r) => r.name !== name) })),
      clear: () => set({ rooms: [] }),
    }),
    { name: 'bedrud-recent-rooms' },
  ),
)
