import '@livekit/components-styles/components'
import { LiveKitRoom, RoomAudioRenderer, useTracks } from '@livekit/components-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { AudioCaptureOptions } from 'livekit-client'
import { Track } from 'livekit-client'
import { PhoneOff, Wifi } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '#/lib/api'
import { useAudioPreferencesStore } from '#/lib/audio-preferences.store'
import { useAuthStore } from '#/lib/auth.store'
import { useRecentRoomsStore } from '#/lib/recent-rooms.store'
import { usePinnedParticipants } from '#/lib/usePinnedParticipants'
import { AskActionBanner } from '@/components/meeting/AskActionBanner'
import { AudioProcessorManager } from '@/components/meeting/AudioProcessorManager'
import { BeforeUnloadLock } from '@/components/meeting/BeforeUnloadLock'
import { FocusLayout } from '@/components/meeting/FocusLayout'
import { KickDetector } from '@/components/meeting/KickDetector'
import { MeetingProvider, useMeetingChatContext } from '@/components/meeting/MeetingContext'
import { MeetingHeader } from '@/components/meeting/MeetingHeader'
import { MeetingPanels } from '@/components/meeting/MeetingPanels'
import { MeetingSoundEffects } from '@/components/meeting/MeetingSoundEffects'
import { ParticipantGrid } from '@/components/meeting/ParticipantGrid'

interface JoinResponse {
  id: string
  name: string
  token: string
  livekitHost: string
  adminId: string
}

export const Route = createFileRoute('/m/$meetId')({
  component: MeetingPage,
})

function MeetingPage() {
  const { meetId } = Route.useParams()
  const navigate = useNavigate()
  const tokens = useAuthStore((s) => s.tokens)

  // Defer auth-state decisions to client-side to avoid SSR flash.
  // On the server localStorage is unavailable, so tokens is always null — initializing
  // guestName from tokens directly would cause the guest dialog to flash during SSR
  // hydration. Instead we start in a "not yet mounted" state and resolve in an effect.
  const [mounted, setMounted] = useState(false)
  const [joinData, setJoinData] = useState<JoinResponse | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  // null = waiting to decide, '' = authenticated (skip dialog), string = confirmed guest name
  const [guestName, setGuestName] = useState<string | null>(null)
  const [guestInput, setGuestInput] = useState('')
  const [wasKicked, setWasKicked] = useState(false)

  // Set initial guestName only after mount (client-side), where tokens are available.
  useEffect(() => {
    setGuestName(tokens ? '' : null)
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens])

  // Audio preferences — derive MediaTrackConstraints from stored settings
  const noiseMode = useAudioPreferencesStore((s) => s.noiseSuppressionMode)
  const echoCancellation = useAudioPreferencesStore((s) => s.echoCancellation)
  const autoGainControl = useAudioPreferencesStore((s) => s.autoGainControl)
  const mergeAudioPrefs = useAudioPreferencesStore((s) => s.merge)

  // Echo cancellation is always honoured from user preferences.
  // Noise suppression is only enabled for browser mode to avoid double-processing
  // with LiveKit audio processors (RNNoise/Krisp).
  const audioConstraints: AudioCaptureOptions | boolean =
    noiseMode === 'browser'
      ? { noiseSuppression: true, echoCancellation, autoGainControl }
      : { noiseSuppression: false, echoCancellation, autoGainControl: false }

  // One-shot preferences sync from backend. useRef guard ensures this runs exactly
  // once even if joinData is replaced (e.g. reconnect), so a mid-session local
  // change is never overwritten by a stale backend fetch.
  const prefsFetchedRef = useRef(false)
  useEffect(() => {
    if (!joinData || !tokens || prefsFetchedRef.current) return
    prefsFetchedRef.current = true
    api
      .get<{ preferencesJson: string }>('/api/auth/preferences')
      .then((r) => {
        if (!r.preferencesJson) return
        try {
          const parsed = JSON.parse(r.preferencesJson)
          if (parsed?.audio) mergeAudioPrefs(parsed.audio)
        } catch {
          /* use local defaults */
        }
      })
      .catch(() => {
        /* use local defaults on network failure */
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinData, mergeAudioPrefs, tokens])

  const addRecent = useRecentRoomsStore((s) => s.add)

  useEffect(() => {
    if (joinData) return
    if (tokens) {
      // Authenticated: join directly
      api
        .post<JoinResponse>('/api/room/join', { roomName: meetId })
        .then((data) => {
          addRecent(meetId)
          setJoinData(data)
        })
        .catch((err: Error) => setJoinError(err.message))
    } else if (guestName !== null && guestName !== '') {
      // Guest with confirmed name
      api
        .post<JoinResponse>('/api/room/guest-join', { roomName: meetId, guestName })
        .then((data) => {
          addRecent(meetId)
          setJoinData(data)
        })
        .catch((err: Error) => setJoinError(err.message))
    }
  }, [meetId, tokens, guestName, joinData, addRecent])

  // Still on server or waiting for client mount — show neutral spinner to avoid SSR flash
  if (!mounted) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#07070f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px solid rgba(99,102,241,0.3)',
            borderTopColor: '#6366f1',
            animation: 'meet-connecting-spin 0.9s linear infinite',
          }}
        />
      </div>
    )
  }

  // Show guest name dialog for unauthenticated users
  if (!tokens && guestName === null) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#07070f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '32px 28px',
            width: 'min(340px, calc(100vw - 32px))',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div>
            <p style={{ color: 'white', fontSize: 17, fontWeight: 600, margin: 0 }}>Join as guest</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '6px 0 0' }}>
              Enter your name to join <span style={{ color: '#a5b4fc' }}>{meetId}</span>
            </p>
          </div>
          <input
            value={guestInput}
            onChange={(e) => setGuestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && guestInput.trim()) setGuestName(guestInput.trim())
            }}
            placeholder="Your name"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 9,
              padding: '10px 14px',
              color: 'white',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              disabled={!guestInput.trim()}
              onClick={() => setGuestName(guestInput.trim())}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 9,
                border: 'none',
                background: guestInput.trim() ? '#6366f1' : 'rgba(99,102,241,0.3)',
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
                cursor: guestInput.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Join
            </button>
            <button
              onClick={() => navigate({ to: '/auth/login', search: { redirect: `/m/${meetId}` } })}
              style={{
                padding: '10px 14px',
                borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (joinError) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#07070f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Wifi size={22} style={{ color: '#f87171' }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Failed to join room</p>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, maxWidth: 320, textAlign: 'center' }}>{joinError}</p>
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          style={{
            marginTop: 8,
            padding: '8px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'rgba(99,102,241,0.2)',
            color: '#a5b4fc',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  if (!joinData) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#07070f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px solid rgba(99,102,241,0.3)',
            borderTopColor: '#6366f1',
            animation: 'meet-connecting-spin 0.9s linear infinite',
          }}
        />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Joining room…</p>
      </div>
    )
  }

  const { id, token, livekitHost: wsUrl, name: roomName, adminId } = joinData

  if (wasKicked) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#07070f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PhoneOff size={22} style={{ color: '#f87171' }} />
        </div>
        <p style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>You were removed</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>A moderator removed you from this room.</p>
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          style={{
            marginTop: 8,
            padding: '8px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'rgba(99,102,241,0.2)',
            color: '#a5b4fc',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <LiveKitRoom token={token} serverUrl={wsUrl} connect audio={audioConstraints} video={false}>
      <RoomAudioRenderer />
      {/* LiveKitRoom renders as display:contents — this div is the actual viewport container */}
      <div className="fixed inset-0 overflow-hidden" style={{ background: '#07070f' }}>
        <MeetingProvider roomId={id} roomName={roomName} adminId={adminId ?? ''}>
          <BeforeUnloadLock />
          <KickDetector onKicked={() => setWasKicked(true)} />
          <AskActionBanner />
          <AudioProcessorManager />
          <MeetingSoundEffects />
          {/* Ambient depth gradients */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div
              style={{
                position: 'absolute',
                width: 900,
                height: 900,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 65%)',
                top: '-300px',
                left: '-300px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 700,
                height: 700,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 65%)',
                bottom: '-200px',
                right: '-150px',
              }}
            />
          </div>

          <MeetingLayout />

          {/* Vignettes for header/controls legibility */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 z-10"
            style={{
              height: 'calc(96px + env(safe-area-inset-top, 0px))',
              background: 'linear-gradient(to bottom, rgba(7,7,15,0.65) 0%, transparent 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-10"
            style={{
              height: 'calc(128px + env(safe-area-inset-bottom, 0px))',
              background: 'linear-gradient(to top, rgba(7,7,15,0.6) 0%, transparent 100%)',
            }}
          />

          <MeetingHeader meetId={meetId} />

          {/* Side panels */}
          <MeetingPanels navigate={() => navigate({ to: '/dashboard' })} />
        </MeetingProvider>
      </div>
    </LiveKitRoom>
  )
}

// ── Layout switcher (inside LiveKitRoom context) ───────────────
function MeetingLayout() {
  const { pinned, toggle, clear } = usePinnedParticipants()
  const { systemMessages } = useMeetingChatContext()
  const screenShareTracks = useTracks([Track.Source.ScreenShare])
  const isFocusMode = screenShareTracks.length > 0 || pinned.size > 0

  // Auto-pin on spotlight system message
  const lastSpotlightTsRef = useRef(0)
  useEffect(() => {
    const last = [...systemMessages].reverse().find((m) => m.event === 'spotlight')
    if (!last || last.ts <= lastSpotlightTsRef.current) return
    lastSpotlightTsRef.current = last.ts
    if (!pinned.has(last.target)) toggle(last.target)
  }, [systemMessages, pinned, toggle])

  useEffect(() => () => clear(), [clear])

  if (isFocusMode) {
    return <FocusLayout pinnedIdentities={pinned} onTogglePin={toggle} />
  }
  return <ParticipantGrid pinnedIdentities={pinned} onTogglePin={toggle} />
}
