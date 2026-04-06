import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NoiseSuppressionMode = 'none' | 'browser' | 'rnnoise' | 'krisp'

export interface AudioPreferences {
  noiseSuppressionMode: NoiseSuppressionMode
  echoCancellation: boolean
  autoGainControl: boolean
  inputGain: number // 0–300 (percent), default 100 = unity
  noiseGate: number // 0–100 (percent), default 0 = off
}

interface AudioPreferencesStore extends AudioPreferences {
  setMode: (mode: NoiseSuppressionMode) => void
  setEchoCancellation: (v: boolean) => void
  setAutoGainControl: (v: boolean) => void
  setInputGain: (v: number) => void
  setNoiseGate: (v: number) => void
  merge: (partial: Partial<AudioPreferences>) => void
}

export const useAudioPreferencesStore = create<AudioPreferencesStore>()(
  persist(
    (set) => ({
      noiseSuppressionMode: 'browser',
      echoCancellation: true,
      autoGainControl: true,
      inputGain: 100,
      noiseGate: 0,
      setMode: (noiseSuppressionMode) => set({ noiseSuppressionMode }),
      setEchoCancellation: (echoCancellation) => set({ echoCancellation }),
      setAutoGainControl: (autoGainControl) => set({ autoGainControl }),
      setInputGain: (inputGain) => set({ inputGain: Math.max(0, Math.min(300, inputGain)) }),
      setNoiseGate: (noiseGate) => set({ noiseGate: Math.max(0, Math.min(100, noiseGate)) }),
      merge: (partial) =>
        set({
          ...(partial.noiseSuppressionMode !== undefined && { noiseSuppressionMode: partial.noiseSuppressionMode }),
          ...(partial.echoCancellation !== undefined && { echoCancellation: partial.echoCancellation }),
          ...(partial.autoGainControl !== undefined && { autoGainControl: partial.autoGainControl }),
          ...(partial.inputGain !== undefined && { inputGain: Math.max(0, Math.min(300, partial.inputGain)) }),
          ...(partial.noiseGate !== undefined && { noiseGate: Math.max(0, Math.min(100, partial.noiseGate)) }),
        }),
    }),
    { name: 'audio-preferences' },
  ),
)
