import { useConnectionState, useLocalParticipant } from '@livekit/components-react'
import type { LocalAudioTrack } from 'livekit-client'
import { ConnectionState, Track } from 'livekit-client'
import { useEffect } from 'react'
import { useAudioPreferencesStore } from '#/lib/audio-preferences.store'
import { audioProcessorService } from '#/lib/audio-processor.service'

/**
 * Null-rendering component that manages the AudioProcessor lifecycle inside
 * the meeting room. Must be placed inside <LiveKitRoom> so hooks work.
 *
 * - Attaches the processor once the room reaches Connected state
 * - Switches processor when the user changes mode mid-meeting
 * - Detaches and cleans up on unmount
 */
export function AudioProcessorManager() {
  const { localParticipant } = useLocalParticipant()
  const connectionState = useConnectionState()
  const mode = useAudioPreferencesStore((s) => s.noiseSuppressionMode)

  // Attach on connect
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return
    const pub = localParticipant?.getTrackPublication(Track.Source.Microphone)
    const track = pub?.track
    if (track) {
      audioProcessorService.attach(track as LocalAudioTrack, mode)
    }
    // We intentionally only run this when connection state changes to Connected,
    // not on every mode change — mode changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState, localParticipant, mode])

  // Switch processor when mode changes mid-meeting
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return
    audioProcessorService.switchMode(mode)
  }, [mode, connectionState])

  // Cleanup on unmount
  useEffect(
    () => () => {
      audioProcessorService.detach()
    },
    [],
  )

  return null
}
