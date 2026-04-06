import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'
import { useEffect, useRef } from 'react'
import { playChat, playJoin, playLeave, playMutedBeep } from '#/lib/meeting-sounds'
import { useMeetingContext } from './MeetingContext'

/**
 * Invisible component that plays notification sounds for meeting events:
 * - Participant joins / leaves
 * - New chat message (from others)
 * - Talking while muted (monitors mic input independently)
 */
export function MeetingSoundEffects() {
  const room = useRoomContext()
  const { chatMessages } = useMeetingContext()

  // ── Join / Leave sounds ──────────────────────────────────────
  // Use RoomEvent directly for accurate join/leave detection rather
  // than diffing the participants array (which can change for other reasons).
  const mountedRef = useRef(false)

  useEffect(() => {
    // Skip sounds during initial mount — we don't want a blast of join sounds
    // for everyone already in the room.
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
  }, [])

  useEffect(() => {
    const onConnect = () => {
      if (mountedRef.current) playJoin()
    }
    const onDisconnect = () => {
      if (mountedRef.current) playLeave()
    }

    room.on(RoomEvent.ParticipantConnected, onConnect)
    room.on(RoomEvent.ParticipantDisconnected, onDisconnect)
    return () => {
      room.off(RoomEvent.ParticipantConnected, onConnect)
      room.off(RoomEvent.ParticipantDisconnected, onDisconnect)
    }
  }, [room])

  // ── Chat message sound ───────────────────────────────────────
  const chatLenRef = useRef(chatMessages.length)

  useEffect(() => {
    const prev = chatLenRef.current
    chatLenRef.current = chatMessages.length
    if (chatMessages.length <= prev) return

    // Only play sound for messages from others
    const latest = chatMessages[chatMessages.length - 1]
    const localIdentity = room.localParticipant.identity
    if (latest?.from?.identity !== localIdentity) {
      playChat()
    }
  }, [chatMessages, room.localParticipant.identity])

  // ── Muted-mic detection ──────────────────────────────────────
  // When the user is muted, open a separate mic stream and watch for
  // speech. If detected, play a short beep so they know they're muted.
  useMutedMicMonitor()

  return null
}

// ── Hook: monitor mic input while muted ────────────────────────

const SPEECH_THRESHOLD = 0.035 // RMS amplitude — tuned to ignore background noise
const DEBOUNCE_MS = 3000 // Don't spam beeps — wait at least 3s between alerts

function useMutedMicMonitor() {
  const { isSelfDeafened } = useMeetingContext()
  // useLocalParticipant is a reactive hook — re-renders when mic state changes.
  // room.localParticipant.isMicrophoneEnabled is a plain property that does NOT
  // trigger React re-renders, which caused the monitor to stay active after unmuting.
  const { isMicrophoneEnabled } = useLocalParticipant()

  useEffect(() => {
    // Only monitor when mic is disabled and user is NOT deafened
    // (deafened users intentionally silenced everything — don't nag them).
    if (isMicrophoneEnabled || isSelfDeafened) return

    let cancelled = false
    let stream: MediaStream | null = null
    let animFrame = 0
    let lastBeepAt = 0
    let ac: AudioContext | null = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch {
        return // no mic permission — nothing we can do
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      ac = new AudioContext()
      const source = ac.createMediaStreamSource(stream)
      const analyser = ac.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      const data = new Float32Array(analyser.fftSize)

      function tick() {
        if (cancelled) return
        analyser.getFloatTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
        const rms = Math.sqrt(sum / data.length)

        if (rms > SPEECH_THRESHOLD && Date.now() - lastBeepAt > DEBOUNCE_MS) {
          lastBeepAt = Date.now()
          playMutedBeep()
        }
        animFrame = requestAnimationFrame(tick)
      }
      tick()
    }

    start()
    return () => {
      cancelled = true
      cancelAnimationFrame(animFrame)
      stream?.getTracks().forEach((t) => t.stop())
      ac?.close()
    }
  }, [isMicrophoneEnabled, isSelfDeafened])
}
