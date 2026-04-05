import { create } from 'zustand'

interface ParticipantOverridesState {
  // volume override: 0.0–1.0. Absent = use default (1.0)
  volumes: Map<string, number>
  // identities that are client-muted (volume forced to 0)
  muted: Set<string>
  setVolume: (identity: string, vol: number) => void
  toggleMute: (identity: string) => void
  isMuted: (identity: string) => boolean
  getVolume: (identity: string) => number
}

export const useParticipantOverridesStore = create<ParticipantOverridesState>((set, get) => ({
  volumes: new Map(),
  muted: new Set(),

  setVolume: (identity, vol) =>
    set((s) => {
      const volumes = new Map(s.volumes)
      volumes.set(identity, Math.max(0, Math.min(1, vol)))
      return { volumes }
    }),

  toggleMute: (identity) =>
    set((s) => {
      const muted = new Set(s.muted)
      if (muted.has(identity)) muted.delete(identity)
      else muted.add(identity)
      return { muted }
    }),

  isMuted: (identity) => get().muted.has(identity),

  getVolume: (identity) => {
    const { muted, volumes } = get()
    if (muted.has(identity)) return 0
    return volumes.get(identity) ?? 1
  },
}))
