import { isKrispNoiseFilterSupported, KrispNoiseFilter } from '@livekit/krisp-noise-filter'
import type { LocalAudioTrack } from 'livekit-client'
import type { NoiseSuppressionMode } from '#/lib/audio-preferences.store'
import { RNNoiseProcessor } from '#/lib/rnnoise-processor'

/**
 * Manages the lifecycle of a LiveKit audio processor (Krisp or RNNoise).
 *
 * Used as a module-level singleton so both ControlsBar (quick toggle) and
 * AudioProcessorManager (meeting room) share the same processor state.
 */
export class AudioProcessorService {
  private track: LocalAudioTrack | null = null
  private currentMode: NoiseSuppressionMode = 'none'

  /** Attach to a track and apply the given mode. Called on room connect. */
  async attach(track: LocalAudioTrack, mode: NoiseSuppressionMode): Promise<void> {
    this.track = track
    this.currentMode = 'none'
    await this.switchMode(mode)
  }

  /**
   * Switch to a new noise suppression mode.
   * Tears down any existing processor first to avoid double-processing.
   *
   * Echo cancellation is applied independently of noise suppression mode —
   * it's a WebRTC feature that works alongside LiveKit audio processors.
   */
  async switchMode(
    mode: NoiseSuppressionMode,
    opts?: { echoCancellation?: boolean; autoGainControl?: boolean },
  ): Promise<void> {
    if (!this.track) return

    const modeChanged = mode !== this.currentMode

    // Remove existing processor when switching away from a LiveKit processor
    if (modeChanged && this.currentMode !== 'none' && this.currentMode !== 'browser') {
      try {
        await this.track.stopProcessor()
      } catch (err) {
        console.warn('[AudioProcessorService] stopProcessor failed:', err)
      }
    }

    this.currentMode = mode

    // Apply WebRTC-level constraints.
    // Noise suppression is only enabled for browser mode (to avoid double-processing
    // with LiveKit processors), but echo cancellation and AGC are independent —
    // they should honour the user's preference regardless of noise mode.
    const mediaTrack = this.track.mediaStreamTrack
    if (mediaTrack) {
      const browserNS = mode === 'browser'
      mediaTrack
        .applyConstraints({
          noiseSuppression: browserNS,
          echoCancellation: opts?.echoCancellation ?? true,
          autoGainControl: opts?.autoGainControl ?? mode === 'browser',
        })
        .catch((err) => {
          console.warn('[AudioProcessorService] applyConstraints failed:', err)
        })
    }

    if (modeChanged) {
      if (mode === 'rnnoise') {
        await this.track.setProcessor(new RNNoiseProcessor())
      } else if (mode === 'krisp') {
        await this.track.setProcessor(KrispNoiseFilter())
      }
    }
  }

  /**
   * Update echo cancellation on the live track without changing the noise mode.
   */
  async setEchoCancellation(enabled: boolean): Promise<void> {
    if (!this.track) return
    const mediaTrack = this.track.mediaStreamTrack
    if (mediaTrack) {
      mediaTrack.applyConstraints({ echoCancellation: enabled }).catch((err) => {
        console.warn('[AudioProcessorService] setEchoCancellation failed:', err)
      })
    }
  }

  /** Detach from the track. Called on room disconnect / unmount. */
  async detach(): Promise<void> {
    if (this.track && this.currentMode !== 'none' && this.currentMode !== 'browser') {
      try {
        await this.track.stopProcessor()
      } catch (err) {
        console.warn('[AudioProcessorService] detach stopProcessor failed:', err)
      }
    }
    this.track = null
    this.currentMode = 'none'
  }

  static isKrispSupported(): boolean {
    return isKrispNoiseFilterSupported()
  }
}

export const audioProcessorService = new AudioProcessorService()
