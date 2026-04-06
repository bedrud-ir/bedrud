import { create } from 'zustand'

interface ParticipantOverridesState {
  volumes: Map<string, number>
  muted: Set<string>
  setVolume: (identity: string, vol: number) => void
  toggleMute: (identity: string) => void
}

export const useParticipantOverridesStore = create<ParticipantOverridesState>((set) => ({
  volumes: new Map(),
  muted: new Set(),

  setVolume: (identity, vol) =>
    set((s) => {
      const volumes = new Map(s.volumes)
      volumes.set(identity, Math.max(0, Math.min(2, vol)))
      return { volumes }
    }),

  toggleMute: (identity) =>
    set((s) => {
      const muted = new Set(s.muted)
      if (muted.has(identity)) muted.delete(identity)
      else muted.add(identity)
      return { muted }
    }),
}))

// Selector factories — use these in components so they re-render on changes:
// const isMuted = useParticipantOverridesStore(selectIsMuted(identity))
// const volume = useParticipantOverridesStore(selectVolume(identity))
export const selectIsMuted = (identity: string) => (s: ParticipantOverridesState) => s.muted.has(identity)

export const selectVolume = (identity: string) => (s: ParticipantOverridesState) => {
  if (s.muted.has(identity)) return 0
  return s.volumes.get(identity) ?? 1
}
