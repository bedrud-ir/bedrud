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
   * Also calls applyConstraints() on the underlying MediaStreamTrack so that
   * browser-level noise processing is disabled when a LiveKit processor is
   * active. The LiveKit `audio` prop on <LiveKitRoom> only applies constraints
   * at connection time — it does not retroactively re-negotiate a live track.
   */
  async switchMode(mode: NoiseSuppressionMode): Promise<void> {
    if (!this.track) return
    if (mode === this.currentMode) return

    // Remove existing processor
    if (this.currentMode !== 'none' && this.currentMode !== 'browser') {
      try {
        await this.track.stopProcessor()
      } catch (err) {
        console.warn('[AudioProcessorService] stopProcessor failed:', err)
      }
    }

    this.currentMode = mode

    // Apply WebRTC-level constraints to match the new mode.
    // When a LiveKit processor handles noise suppression, we disable browser
    // processing to prevent double-processing artifacts.
    const mediaTrack = this.track.mediaStreamTrack
    if (mediaTrack) {
      const browserActive = mode === 'browser'
      mediaTrack
        .applyConstraints({
          noiseSuppression: browserActive,
          echoCancellation: browserActive,
          autoGainControl: browserActive,
        })
        .catch((err) => {
          // Non-fatal: some browsers ignore applyConstraints after track creation
          console.warn('[AudioProcessorService] applyConstraints failed:', err)
        })
    }

    if (mode === 'rnnoise') {
      await this.track.setProcessor(new RNNoiseProcessor())
    } else if (mode === 'krisp') {
      await this.track.setProcessor(KrispNoiseFilter())
    }
    // 'none' and 'browser': WebRTC constraints handle it; no LiveKit processor needed
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
