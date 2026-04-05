import { type ComponentType, type ReactNode, useMemo, useState } from 'react'
import { ConnectionQuality, Track, type Participant } from 'livekit-client'
import {
  Mic, MicOff, Video, Pin, PinOff, ShieldCheck, ShieldOff,
  MessageSquareOff, EarOff, UserX, Ban, MoreVertical,
  Volume2, VolumeX, ScreenShareOff, Activity, Loader2,
  Megaphone, Camera,
} from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMeetingContext } from '@/components/meeting/MeetingContext'
import {
  useParticipantOverridesStore,
  selectIsMuted,
  selectVolume,
} from '#/lib/participant-overrides.store'
import { api } from '#/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParticipantMeta {
  accesses?: string[]
}

function parseMeta(raw: string | undefined): ParticipantMeta {
  try { return JSON.parse(raw ?? '{}') } catch { return {} }
}

interface ConnectionInfo {
  quality: 'excellent' | 'good' | 'poor' | 'unknown'
  serverMuted?: boolean
  ip?: string
}

interface ParticipantInfoResponse {
  muted?: boolean
  ip?: string
}

export interface ParticipantMenuContentProps {
  participant: Participant
  isPinned?: boolean
  onTogglePin?: () => void
  // Injected primitive components so this content can render in both ContextMenu and DropdownMenu
  Item: ComponentType<{
    onClick?: () => void
    disabled?: boolean
    className?: string
    style?: React.CSSProperties
    children: ReactNode
  }>
  Separator: ComponentType<{ className?: string; style?: React.CSSProperties }>
  Label: ComponentType<{ className?: string; style?: React.CSSProperties; children: ReactNode }>
  onClose?: () => void
}

// ─── Shared menu content ──────────────────────────────────────────────────────

export function ParticipantMenuContent({
  participant,
  isPinned,
  onTogglePin,
  Item,
  Separator,
  Label,
  onClose,
}: ParticipantMenuContentProps) {
  const { roomId, adminId, isAdmin, isModerator } = useMeetingContext()
  const identity = participant.identity
  const isSelf = participant.isLocal
  const canModerate = isAdmin || isModerator

  // Metadata parsing — same pattern as ParticipantsList.tsx
  const meta = useMemo(() => parseMeta(participant.metadata), [participant.metadata])
  const participantAccesses = meta.accesses ?? []
  const isRoomAdmin = identity === adminId
  const isMod = !isRoomAdmin && participantAccesses.includes('moderator')

  // Client-side audio overrides
  const isMuted = useParticipantOverridesStore(selectIsMuted(identity))
  const volume = useParticipantOverridesStore(selectVolume(identity))
  const toggleMute = useParticipantOverridesStore((s) => s.toggleMute)
  const setVolume = useParticipantOverridesStore((s) => s.setVolume)

  // Loading state keyed by action name
  const [loading, setLoading] = useState<string | null>(null)

  // Connection stats panel
  const [statsOpen, setStatsOpen] = useState(false)
  const [connInfo, setConnInfo] = useState<ConnectionInfo | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const hasScreenShare = !!participant.getTrackPublication(Track.Source.ScreenShare)

  async function act(key: string, path: string) {
    setLoading(key)
    try {
      await api.post(path)
      onClose?.()
    } finally {
      setLoading(null)
    }
  }

  async function handleToggleStats() {
    if (statsOpen) {
      setStatsOpen(false)
      return
    }
    setStatsOpen(true)

    // Map LiveKit ConnectionQuality enum to display string
    let quality: ConnectionInfo['quality'] = 'unknown'
    if (participant.connectionQuality === ConnectionQuality.Excellent) quality = 'excellent'
    else if (participant.connectionQuality === ConnectionQuality.Good) quality = 'good'
    else if (participant.connectionQuality === ConnectionQuality.Poor) quality = 'poor'

    const info: ConnectionInfo = { quality }

    // Admin: fetch server-side info including IP
    if (isAdmin) {
      setStatsLoading(true)
      try {
        const data = await api.get<ParticipantInfoResponse>(`/api/room/${roomId}/participant/${identity}/info`)
        info.serverMuted = data?.muted
        info.ip = data?.ip
      } catch {
        // ignore, just show what we have
      } finally {
        setStatsLoading(false)
      }
    }

    setConnInfo(info)
  }

  const qualityColor: Record<ConnectionInfo['quality'], string> = {
    excellent: '#34d399',
    good: '#fbbf24',
    poor: '#f87171',
    unknown: 'rgba(255,255,255,0.3)',
  }

  const labelStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    padding: '4px 8px 2px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  }
  const itemStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.75)', fontSize: 13 }
  const sepStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.07)' }

  return (
    <>
      {/* ── Section 1: Local audio (remote only) ─────────────────────────── */}
      {!isSelf && (
        <>
          <Label style={labelStyle}>Local Audio</Label>

          {/* Mute toggle */}
          <Item onClick={() => toggleMute(identity)} style={itemStyle}>
            {isMuted
              ? <VolumeX size={13} style={{ marginRight: 8, flexShrink: 0 }} />
              : <Volume2 size={13} style={{ marginRight: 8, flexShrink: 0 }} />
            }
            {isMuted ? 'Unmute (local)' : 'Mute (local)'}
          </Item>

          {/* Volume slider — prevent menu close on interaction */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '6px 10px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <VolumeX size={12} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(identity, Number(e.target.value) / 100)}
              style={{
                flex: 1,
                accentColor: '#6366f1',
                height: 3,
                cursor: 'pointer',
              }}
            />
            <Volume2 size={12} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          </div>
          <Separator style={sepStyle} />
        </>
      )}

      {/* ── Section 2: Pin / Unpin ──────────────────────────────────────── */}
      {onTogglePin && (
        <>
          <Item onClick={onTogglePin} style={itemStyle}>
            {isPinned
              ? <PinOff size={13} style={{ marginRight: 8 }} />
              : <Pin size={13} style={{ marginRight: 8 }} />
            }
            {isPinned ? 'Unpin' : 'Pin'}
          </Item>
          <Separator style={sepStyle} />
        </>
      )}

      {/* ── Section 3: Moderation ──────────────────────────────────────── */}
      {canModerate && !isSelf && !isRoomAdmin && (
        <>
          <Label style={labelStyle}>Moderate</Label>

          <Item
            disabled={loading === 'srvmute'}
            onClick={() => act('srvmute', `/api/room/${roomId}/mute/${identity}`)}
            style={itemStyle}
          >
            {loading === 'srvmute'
              ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              : <MicOff size={13} style={{ marginRight: 8 }} />
            }
            Mute Audio
          </Item>

          <Item
            disabled={loading === 'videooff'}
            onClick={() => act('videooff', `/api/room/${roomId}/video/${identity}/off`)}
            style={itemStyle}
          >
            {loading === 'videooff'
              ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              : <Video size={13} style={{ marginRight: 8 }} />
            }
            Disable Camera
          </Item>

          <Item
            disabled={loading === 'chatblock'}
            onClick={() => act('chatblock', `/api/room/${roomId}/chat/${identity}/block`)}
            style={itemStyle}
          >
            {loading === 'chatblock'
              ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              : <MessageSquareOff size={13} style={{ marginRight: 8 }} />
            }
            Block Chat
          </Item>

          <Item
            disabled={loading === 'deafen'}
            onClick={() => act('deafen', `/api/room/${roomId}/deafen/${identity}`)}
            style={itemStyle}
          >
            {loading === 'deafen'
              ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              : <EarOff size={13} style={{ marginRight: 8 }} />
            }
            Deafen
          </Item>

          <Item
            disabled={loading === 'askunmute'}
            onClick={() => act('askunmute', `/api/room/${roomId}/ask/${identity}/unmute`)}
            style={itemStyle}
          >
            {loading === 'askunmute'
              ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              : <Mic size={13} style={{ marginRight: 8 }} />
            }
            Ask to Unmute
          </Item>

          <Item
            disabled={loading === 'askcamera'}
            onClick={() => act('askcamera', `/api/room/${roomId}/ask/${identity}/camera`)}
            style={itemStyle}
          >
            {loading === 'askcamera'
              ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              : <Camera size={13} style={{ marginRight: 8 }} />
            }
            Ask Camera On
          </Item>

          <Item
            disabled={loading === 'spotlight'}
            onClick={() => act('spotlight', `/api/room/${roomId}/spotlight/${identity}`)}
            style={itemStyle}
          >
            {loading === 'spotlight'
              ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              : <Megaphone size={13} style={{ marginRight: 8 }} />
            }
            Spotlight for All
          </Item>

          {hasScreenShare && (
            <Item
              disabled={loading === 'stopscreen'}
              onClick={() => act('stopscreen', `/api/room/${roomId}/screenshare/${identity}/stop`)}
              style={itemStyle}
            >
              {loading === 'stopscreen'
                ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                : <ScreenShareOff size={13} style={{ marginRight: 8 }} />
              }
              Stop Screen Share
            </Item>
          )}

          <Separator style={sepStyle} />
        </>
      )}

      {/* ── Section 4: Role management (admin only, non-self, non-room-admin) */}
      {isAdmin && !isSelf && !isRoomAdmin && (
        <>
          <Label style={labelStyle}>Role</Label>

          {isMod ? (
            <Item
              disabled={loading === 'demote'}
              onClick={() => act('demote', `/api/room/${roomId}/demote/${identity}`)}
              style={itemStyle}
            >
              {loading === 'demote'
                ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                : <ShieldOff size={13} style={{ marginRight: 8 }} />
              }
              Demote from Moderator
            </Item>
          ) : (
            <Item
              disabled={loading === 'promote'}
              onClick={() => act('promote', `/api/room/${roomId}/promote/${identity}`)}
              style={itemStyle}
            >
              {loading === 'promote'
                ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                : <ShieldCheck size={13} style={{ marginRight: 8 }} />
              }
              Promote to Moderator
            </Item>
          )}

          <Separator style={sepStyle} />
        </>
      )}

      {/* ── Section 5: Kick / Ban (admin only, non-self, non-room-admin) ─── */}
      {isAdmin && !isSelf && !isRoomAdmin && (
        <>
          <Item
            disabled={loading === 'kick'}
            onClick={() => act('kick', `/api/room/${roomId}/kick/${identity}`)}
            style={{ color: '#f87171', fontSize: 13 }}
          >
            {loading === 'kick'
              ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              : <UserX size={13} style={{ marginRight: 8 }} />
            }
            Kick
          </Item>

          <Item
            disabled={loading === 'ban'}
            onClick={() => act('ban', `/api/room/${roomId}/ban/${identity}`)}
            style={{ color: '#f87171', fontSize: 13 }}
          >
            {loading === 'ban'
              ? <Loader2 size={13} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
              : <Ban size={13} style={{ marginRight: 8 }} />
            }
            Ban
          </Item>

          <Separator style={sepStyle} />
        </>
      )}

      {/* ── Section 6: Connection stats (always shown, togglable inline) ── */}
      <div
        role="menuitem"
        tabIndex={0}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); handleToggleStats() }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleStats() }}
        style={{
          display: 'flex', alignItems: 'center',
          padding: '6px 8px',
          borderRadius: 4,
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13,
          userSelect: 'none',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <Activity size={13} style={{ marginRight: 8 }} />
        {statsOpen ? 'Hide Stats' : 'Connection Stats'}
      </div>

      {statsOpen && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            margin: '4px 8px',
            padding: '8px 10px',
            borderRadius: 7,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.55)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {statsLoading ? (
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</span>
          ) : connInfo ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Quality</span>
                <span style={{ color: qualityColor[connInfo.quality], fontWeight: 600 }}>
                  {connInfo.quality}
                </span>
              </div>
              {connInfo.serverMuted !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Server muted</span>
                  <span style={{ color: connInfo.serverMuted ? '#f87171' : '#34d399' }}>
                    {connInfo.serverMuted ? 'yes' : 'no'}
                  </span>
                </div>
              )}
              {connInfo.ip && isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>IP</span>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>
                    {connInfo.ip}
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </>
  )
}

// ─── Dark menu style ──────────────────────────────────────────────────────────

const darkMenuStyle: React.CSSProperties = {
  background: 'rgba(15,15,28,0.98)',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(16px)',
  minWidth: 220,
}

// ─── ContextMenu surface (right-click / long-press) ───────────────────────────

interface SurfaceProps {
  participant: Participant
  isPinned?: boolean
  onTogglePin?: () => void
  children: ReactNode
}

export function ParticipantContextMenu({ participant, isPinned, onTogglePin, children }: SurfaceProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent style={darkMenuStyle}>
        <ParticipantMenuContent
          participant={participant}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
          Item={({ onClick, disabled, className, style, children: c }) => (
            <ContextMenuItem onClick={onClick} disabled={disabled} className={className} style={style}>
              {c}
            </ContextMenuItem>
          )}
          Separator={({ className, style }) => (
            <ContextMenuSeparator className={className} style={style} />
          )}
          Label={({ className, style, children: c }) => (
            <ContextMenuLabel className={className} style={style}>{c}</ContextMenuLabel>
          )}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ─── 3-dot dropdown button ────────────────────────────────────────────────────

interface ButtonProps {
  participant: Participant
  isPinned?: boolean
  onTogglePin?: () => void
}

export function ParticipantMenuButton({ participant, isPinned, onTogglePin }: ButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Participant options"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
          }}
        >
          <MoreVertical size={12} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" style={darkMenuStyle}>
        <ParticipantMenuContent
          participant={participant}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
          onClose={() => setOpen(false)}
          Item={({ onClick, disabled, className, style, children: c }) => (
            <DropdownMenuItem onClick={onClick} disabled={disabled} className={className} style={style}>
              {c}
            </DropdownMenuItem>
          )}
          Separator={({ className, style }) => (
            <DropdownMenuSeparator className={className} style={style} />
          )}
          Label={({ className, style, children: c }) => (
            <div
              className={className}
              style={{
                padding: '4px 8px 2px',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                ...style,
              }}
            >
              {c}
            </div>
          )}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
