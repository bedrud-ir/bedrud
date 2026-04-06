import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useParticipants,
  useRoomContext,
  useTracks,
} from '@livekit/components-react'
import { ConnectionState, DisconnectReason, RoomEvent, Track } from 'livekit-client'
import type { AudioCaptureOptions } from 'livekit-client'
import { useAuthStore } from '#/lib/auth.store'
import { api } from '#/lib/api'
import { ParticipantGrid } from '@/components/meeting/ParticipantGrid'
import { ControlsBar } from '@/components/meeting/ControlsBar'
import { ChatPanel } from '@/components/meeting/ChatPanel'
import { ParticipantsList } from '@/components/meeting/ParticipantsList'
import { MeetingProvider, useMeetingContext } from '@/components/meeting/MeetingContext'
import { FocusLayout } from '@/components/meeting/FocusLayout'
import { usePinnedParticipants } from '#/lib/usePinnedParticipants'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PhoneOff, LogOut, Radio, Users, Wifi, Mic, Video, X, MessageSquare } from 'lucide-react'
import { useAudioPreferencesStore } from '#/lib/audio-preferences.store'
import { useRecentRoomsStore } from '#/lib/recent-rooms.store'
import { AudioProcessorManager } from '@/components/meeting/AudioProcessorManager'
import { MeetingSoundEffects } from '@/components/meeting/MeetingSoundEffects'

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
  }, [])

  // Audio preferences — derive MediaTrackConstraints from stored settings
  const noiseMode          = useAudioPreferencesStore((s) => s.noiseSuppressionMode)
  const echoCancellation   = useAudioPreferencesStore((s) => s.echoCancellation)
  const autoGainControl    = useAudioPreferencesStore((s) => s.autoGainControl)
  const mergeAudioPrefs    = useAudioPreferencesStore((s) => s.merge)

  // When using a LiveKit audio processor (rnnoise/krisp), disable browser-level
  // noise processing to avoid double-processing artifacts.
  const audioConstraints: AudioCaptureOptions | boolean =
    noiseMode === 'browser'
      ? { noiseSuppression: true, echoCancellation, autoGainControl }
      : { noiseSuppression: false, echoCancellation: false, autoGainControl: false }

  // One-shot preferences sync from backend. useRef guard ensures this runs exactly
  // once even if joinData is replaced (e.g. reconnect), so a mid-session local
  // change is never overwritten by a stale backend fetch.
  const prefsFetchedRef = useRef(false)
  useEffect(() => {
    if (!joinData || !tokens || prefsFetchedRef.current) return
    prefsFetchedRef.current = true
    api.get<{ preferencesJson: string }>('/api/auth/preferences')
      .then((r) => {
        if (!r.preferencesJson) return
        try {
          const parsed = JSON.parse(r.preferencesJson)
          if (parsed?.audio) mergeAudioPrefs(parsed.audio)
        } catch { /* use local defaults */ }
      })
      .catch(() => { /* use local defaults on network failure */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinData])

  const addRecent = useRecentRoomsStore((s) => s.add)

  useEffect(() => {
    if (joinData) return
    if (tokens) {
      // Authenticated: join directly
      api.post<JoinResponse>('/api/room/join', { roomName: meetId })
        .then((data) => { addRecent(meetId); setJoinData(data) })
        .catch((err: Error) => setJoinError(err.message))
    } else if (guestName !== null && guestName !== '') {
      // Guest with confirmed name
      api.post<JoinResponse>('/api/room/guest-join', { roomName: meetId, guestName })
        .then((data) => { addRecent(meetId); setJoinData(data) })
        .catch((err: Error) => setJoinError(err.message))
    }
  }, [meetId, tokens, guestName, joinData, addRecent])

  // Still on server or waiting for client mount — show neutral spinner to avoid SSR flash
  if (!mounted) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#07070f',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '2px solid rgba(99,102,241,0.3)',
          borderTopColor: '#6366f1',
          animation: 'meet-connecting-spin 0.9s linear infinite',
        }} />
      </div>
    )
  }

  // Show guest name dialog for unauthenticated users
  if (!tokens && guestName === null) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#07070f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '32px 28px',
          width: 'min(340px, calc(100vw - 32px))',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div>
            <p style={{ color: 'white', fontSize: 17, fontWeight: 600, margin: 0 }}>Join as guest</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '6px 0 0' }}>
              Enter your name to join <span style={{ color: '#a5b4fc' }}>{meetId}</span>
            </p>
          </div>
          <input
            autoFocus
            value={guestInput}
            onChange={(e) => setGuestInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && guestInput.trim()) setGuestName(guestInput.trim()) }}
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
                flex: 1, padding: '10px 0', borderRadius: 9, border: 'none',
                background: guestInput.trim() ? '#6366f1' : 'rgba(99,102,241,0.3)',
                color: 'white', fontSize: 14, fontWeight: 500,
                cursor: guestInput.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Join
            </button>
            <button
              onClick={() => navigate({ to: '/auth/login', search: { redirect: `/m/${meetId}` } })}
              style={{
                padding: '10px 14px', borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'rgba(255,255,255,0.5)',
                fontSize: 13, cursor: 'pointer',
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
      <div style={{
        position: 'fixed', inset: 0,
        background: '#07070f',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wifi size={22} style={{ color: '#f87171' }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
          Failed to join room
        </p>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, maxWidth: 320, textAlign: 'center' }}>
          {joinError}
        </p>
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          style={{
            marginTop: 8, padding: '8px 20px', borderRadius: 10, border: 'none',
            background: 'rgba(99,102,241,0.2)', color: '#a5b4fc',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  if (!joinData) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#07070f',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '2px solid rgba(99,102,241,0.3)',
          borderTopColor: '#6366f1',
          animation: 'meet-connecting-spin 0.9s linear infinite',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Joining room…</p>
      </div>
    )
  }

  const { id, token, livekitHost: wsUrl, name: roomName, adminId } = joinData

  if (wasKicked) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#07070f',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PhoneOff size={22} style={{ color: '#f87171' }} />
        </div>
        <p style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>You were removed</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>A moderator removed you from this room.</p>
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          style={{
            marginTop: 8, padding: '8px 20px', borderRadius: 10, border: 'none',
            background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 13, cursor: 'pointer',
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
        <KickDetector onKicked={() => setWasKicked(true)} />
        <AskActionBanner />
        <AudioProcessorManager />
        <MeetingSoundEffects />
        {/* Ambient depth gradients */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div style={{
            position: 'absolute', width: 900, height: 900, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 65%)',
            top: '-300px', left: '-300px',
          }} />
          <div style={{
            position: 'absolute', width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 65%)',
            bottom: '-200px', right: '-150px',
          }} />
        </div>

        <MeetingLayout />

        {/* Vignettes for header/controls legibility */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10"
          style={{ height: 'calc(96px + env(safe-area-inset-top, 0px))', background: 'linear-gradient(to bottom, rgba(7,7,15,0.65) 0%, transparent 100%)' }} />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10"
          style={{ height: 'calc(128px + env(safe-area-inset-bottom, 0px))', background: 'linear-gradient(to top, rgba(7,7,15,0.6) 0%, transparent 100%)' }} />

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
  const { systemMessages } = useMeetingContext()
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

// ── Panels + Controls (separate so they can share state cleanly) ──

function MeetingPanels({ navigate }: { navigate: () => void }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [participantsOpen, setParticipantsOpen] = useState(false)

  const toggleChat = () => { setChatOpen((o) => !o); setParticipantsOpen(false) }
  const toggleParticipants = () => { setParticipantsOpen((o) => !o); setChatOpen(false) }

  return (
    <>
      {/* Top-left: Participants button */}
      <ParticipantsToggle isOpen={participantsOpen} onToggle={toggleParticipants} />

      {/* Top-right: Chat button */}
      <ChatToggle isOpen={chatOpen} onToggle={toggleChat} />

      {participantsOpen && !chatOpen && (
        <ParticipantsList onClose={() => setParticipantsOpen(false)} />
      )}
      {chatOpen && (
        <ChatPanel onClose={() => setChatOpen(false)} />
      )}
      <ChatToastNotifier chatOpen={chatOpen} />
      <MeetingControls onNavigate={navigate} />
    </>
  )
}

/* ── Top-left: Participants toggle button ─────────────────────── */

function ParticipantsToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const participants = useParticipants()
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'absolute', top: 'calc(14px + env(safe-area-inset-top, 0px))', left: 'calc(14px + env(safe-area-inset-left, 0px))', zIndex: 25,
        display: 'flex', alignItems: 'center', gap: 6,
        background: isOpen ? 'rgba(99,102,241,0.25)' : 'rgba(12,12,22,0.7)',
        border: `1px solid ${isOpen ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10, padding: '7px 12px',
        color: isOpen ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.15s',
      }}
      aria-label={isOpen ? 'Close participants' : 'Show participants'}
    >
      <Users size={14} />
      <span>{participants.length}</span>
    </button>
  )
}

/* ── Top-right: Chat toggle button ────────────────────────────── */

function ChatToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { unreadCount } = useMeetingContext()
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'absolute', top: 'calc(14px + env(safe-area-inset-top, 0px))', right: 'calc(14px + env(safe-area-inset-right, 0px))', zIndex: 25,
        width: 38, height: 38,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isOpen ? 'rgba(99,102,241,0.25)' : 'rgba(12,12,22,0.7)',
        border: `1px solid ${isOpen ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10, cursor: 'pointer',
        color: isOpen ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.15s',
      }}
      aria-label={isOpen ? 'Close chat' : `Open chat${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <MessageSquare size={16} />
      {unreadCount > 0 && !isOpen && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          minWidth: 16, height: 16, borderRadius: 8,
          background: '#6366f1', color: 'white',
          fontSize: 9, fontWeight: 700, lineHeight: '16px',
          textAlign: 'center', padding: '0 4px',
          pointerEvents: 'none',
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

// ── Chat toast notifier ───────────────────────────────────────

interface ChatToast {
  id: number
  sender: string
  message: string
}

function ChatToastNotifier({ chatOpen }: { chatOpen: boolean }) {
  const { chatMessages } = useMeetingContext()
  const seenRef = useRef(chatMessages.length)
  const [toasts, setToasts] = useState<ChatToast[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    // On first mount, mark all existing messages as seen without toasting
    seenRef.current = chatMessages.length
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chatMessages.length <= seenRef.current) return
    const newMsgs = chatMessages.slice(seenRef.current)
    seenRef.current = chatMessages.length
    if (chatOpen) return  // panel is open — user can see the messages

    newMsgs.forEach((msg) => {
      const id = nextId.current++
      const sender = msg.from?.name ?? msg.from?.identity ?? 'Someone'
      setToasts((t) => [...t.slice(-3), { id, sender, message: msg.message }])
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
      }, 4500)
    })
  }, [chatMessages, chatOpen])

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(68px + env(safe-area-inset-top, 0px))',
      right: 'calc(16px + env(safe-area-inset-right, 0px))',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="chat-toast"
          style={{
            background: 'rgba(15,15,28,0.96)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: 14,
            padding: '13px 16px',
            maxWidth: 'min(340px, calc(100vw - 32px))',
            boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>
            {toast.sender}
          </span>
          <span style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.75)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
          }}>
            {toast.message}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────

function MeetingHeader({ meetId }: { meetId: string }) {
  const state = useConnectionState()
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, 10_000)
    return () => clearInterval(id)
  }, [])

  const isConnected = state === ConnectionState.Connected

  return (
    <header
      className="absolute left-0 right-0 top-0 z-20 flex items-center justify-center px-4"
      style={{ pointerEvents: 'none', height: 'calc(56px + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center gap-2.5" style={{ pointerEvents: 'auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(99,102,241,0.18)',
          border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: 7, padding: '3px 9px',
        }}>
          <Radio size={11} style={{ color: '#818cf8' }} />
          <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'monospace' }}>{meetId}</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'monospace' }}>{time}</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>·</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: isConnected ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
          border: `1px solid ${isConnected ? 'rgba(34,197,94,0.25)' : 'rgba(234,179,8,0.25)'}`,
          borderRadius: 7, padding: '3px 9px',
        }}>
          {isConnected ? (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          ) : (
            <svg className="meet-connecting" width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4" fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="6 4" />
            </svg>
          )}
          <span style={{ color: isConnected ? '#86efac' : '#fde047', fontSize: 11, fontWeight: 500 }}>
            {isConnected ? 'Connected' : state}
          </span>
        </div>
      </div>
    </header>
  )
}

// ── Controls wrapper ──────────────────────────────────────────

function MeetingControls({ onNavigate }: { onNavigate: () => void }) {
  const { isCreator, roomId } = useMeetingContext()
  const room = useRoomContext()
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  function handleLeaveRequest() {
    if (isCreator) setEndDialogOpen(true)
    else onNavigate()
  }

  async function handleEndMeeting() {
    setIsEnding(true)
    try { await api.delete(`/api/room/${roomId}`) } catch { /* already closed */ }
    room.disconnect()
    onNavigate()
  }

  function handleLeaveMeeting() {
    room.disconnect()
    onNavigate()
  }

  return (
    <>
      <ControlsBar onLeave={handleLeaveRequest} />
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent className="sm:max-w-sm" style={{ background: '#0f0f1e', border: '1px solid rgba(255,255,255,0.08)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'white' }}>Leave meeting?</DialogTitle>
            <DialogDescription style={{ color: 'rgba(255,255,255,0.45)' }}>
              You created this meeting. End it for everyone, or just slip out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full gap-2"
              style={{ background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none' }}
              onClick={handleEndMeeting}
              disabled={isEnding}
            >
              <PhoneOff className="h-4 w-4" />
              End Meeting for Everyone
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
              onClick={handleLeaveMeeting}
            >
              <LogOut className="h-4 w-4" />
              Leave Meeting
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onClick={() => setEndDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Ask-action notification banner ────────────────────────────
function AskActionBanner() {
  const { systemMessages, currentUserId } = useMeetingContext()
  const [dismissed, setDismissed] = useState<number>(0)

  const lastAsk = [...systemMessages]
    .reverse()
    .find((m) => (m.event === 'ask_unmute' || m.event === 'ask_camera') && m.target === currentUserId)

  if (!lastAsk || lastAsk.ts <= dismissed) return null

  const isUnmute = lastAsk.event === 'ask_unmute'

  return (
    <div
      role="alert"
      style={{
        position: 'fixed', bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))', left: '50%', transform: 'translateX(-50%)',
        zIndex: 60,
        background: 'rgba(15,15,30,0.95)',
        border: '1px solid rgba(99,102,241,0.4)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(16px)',
        maxWidth: 'min(340px, calc(100vw - 32px))',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isUnmute
          ? <Mic size={15} style={{ color: '#a5b4fc' }} />
          : <Video size={15} style={{ color: '#a5b4fc' }} />
        }
      </div>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, flex: 1 }}>
        {isUnmute ? 'A moderator is asking you to unmute.' : 'A moderator is asking you to turn on your camera.'}
      </span>
      <button
        onClick={() => setDismissed(lastAsk.ts)}
        style={{
          background: 'none', border: 'none', padding: 4, cursor: 'pointer',
          color: 'rgba(255,255,255,0.3)', flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ── Kick detector ─────────────────────────────────────────────
function KickDetector({ onKicked }: { onKicked: () => void }) {
  const room = useRoomContext()

  useEffect(() => {
    const handler = (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        onKicked()
      }
    }
    room.on(RoomEvent.Disconnected, handler)
    return () => { room.off(RoomEvent.Disconnected, handler) }
  }, [room, onKicked])

  return null
}
