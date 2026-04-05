import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NoiseSuppressionMode = 'none' | 'browser' | 'rnnoise' | 'krisp'

export interface AudioPreferences {
  noiseSuppressionMode: NoiseSuppressionMode
  echoCancellation: boolean
  autoGainControl: boolean
}

interface AudioPreferencesStore extends AudioPreferences {
  setMode: (mode: NoiseSuppressionMode) => void
  setEchoCancellation: (v: boolean) => void
  setAutoGainControl: (v: boolean) => void
  merge: (partial: Partial<AudioPreferences>) => void
}

export const useAudioPreferencesStore = create<AudioPreferencesStore>()(
  persist(
    (set) => ({
      noiseSuppressionMode: 'browser',
      echoCancellation: true,
      autoGainControl: true,
      setMode: (noiseSuppressionMode) => set({ noiseSuppressionMode }),
      setEchoCancellation: (echoCancellation) => set({ echoCancellation }),
      setAutoGainControl: (autoGainControl) => set({ autoGainControl }),
      merge: (partial) => set(partial),
    }),
    { name: 'audio-preferences' },
  ),
)
