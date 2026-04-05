import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react'
import { ConnectionState, DisconnectReason, RoomEvent } from 'livekit-client'
import { useAuthStore } from '#/lib/auth.store'
import { api } from '#/lib/api'
import { ParticipantGrid } from '@/components/meeting/ParticipantGrid'
import { ControlsBar } from '@/components/meeting/ControlsBar'
import { ChatPanel } from '@/components/meeting/ChatPanel'
import { ParticipantsList } from '@/components/meeting/ParticipantsList'
import { MeetingProvider, useMeetingContext } from '@/components/meeting/MeetingContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PhoneOff, LogOut, Radio, Users, Wifi } from 'lucide-react'

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

  const [joinData, setJoinData] = useState<JoinResponse | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  // null = waiting to decide, '' = showing dialog, string = confirmed guest name
  const [guestName, setGuestName] = useState<string | null>(tokens ? '' : null)
  const [guestInput, setGuestInput] = useState('')
  const [wasKicked, setWasKicked] = useState(false)

  useEffect(() => {
    if (joinData) return
    if (tokens) {
      // Authenticated: join directly
      api.post<JoinResponse>('/api/room/join', { roomName: meetId })
        .then(setJoinData)
        .catch((err: Error) => setJoinError(err.message))
    } else if (guestName !== null && guestName !== '') {
      // Guest with confirmed name
      api.post<JoinResponse>('/api/room/guest-join', { roomName: meetId, guestName })
        .then(setJoinData)
        .catch((err: Error) => setJoinError(err.message))
    }
  }, [meetId, tokens, guestName, joinData])

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
          width: 340,
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
              onClick={() => navigate({ to: '/auth' })}
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
    <LiveKitRoom token={token} serverUrl={wsUrl} connect audio video={false}>
      <RoomAudioRenderer />
      {/* LiveKitRoom renders as display:contents — this div is the actual viewport container */}
      <div className="fixed inset-0 overflow-hidden" style={{ background: '#07070f' }}>
      <MeetingProvider roomId={id} roomName={roomName} adminId={adminId ?? ''}>
        <KickDetector onKicked={() => setWasKicked(true)} />
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

        <ParticipantGrid />

        {/* Vignettes for header/controls legibility */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-24"
          style={{ background: 'linear-gradient(to bottom, rgba(7,7,15,0.65) 0%, transparent 100%)' }} />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32"
          style={{ background: 'linear-gradient(to top, rgba(7,7,15,0.6) 0%, transparent 100%)' }} />

        <MeetingHeader meetId={meetId} />

        {/* Side panels */}
        <MeetingPanels navigate={() => navigate({ to: '/dashboard' })} />
      </MeetingProvider>
      </div>
    </LiveKitRoom>
  )
}

// ── Panels + Controls (separate so they can share state cleanly) ──

function MeetingPanels({ navigate }: { navigate: () => void }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [participantsOpen, setParticipantsOpen] = useState(true)

  return (
    <>
      {participantsOpen && !chatOpen && (
        <ParticipantsList onClose={() => setParticipantsOpen(false)} />
      )}
      {chatOpen && (
        <ChatPanel onClose={() => setChatOpen(false)} />
      )}
      <MeetingControls
        chatOpen={chatOpen}
        participantsOpen={participantsOpen}
        onToggleChat={() => { setChatOpen((o) => !o); setParticipantsOpen(false) }}
        onToggleParticipants={() => { setParticipantsOpen((o) => !o); setChatOpen(false) }}
        onNavigate={navigate}
      />
    </>
  )
}

// ── Header ────────────────────────────────────────────────────

function MeetingHeader({ meetId }: { meetId: string }) {
  const state = useConnectionState()
  const participants = useParticipants()
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
      className="absolute left-0 right-0 top-0 z-20 flex h-14 items-center justify-between px-4"
      style={{ pointerEvents: 'none' }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{participants.length}</span>
        </div>
      </div>

      <div className="flex items-center gap-3" style={{ pointerEvents: 'auto' }}>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'monospace' }}>{time}</span>
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

interface MeetingControlsProps {
  chatOpen: boolean
  participantsOpen: boolean
  onToggleChat: () => void
  onToggleParticipants: () => void
  onNavigate: () => void
}

function MeetingControls({ chatOpen, participantsOpen, onToggleChat, onToggleParticipants, onNavigate }: MeetingControlsProps) {
  const { isCreator, roomId, unreadCount } = useMeetingContext()
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
      <ControlsBar
        onToggleChat={onToggleChat}
        onToggleParticipants={onToggleParticipants}
        onLeave={handleLeaveRequest}
        chatOpen={chatOpen}
        participantsOpen={participantsOpen}
        unreadCount={unreadCount}
      />
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
