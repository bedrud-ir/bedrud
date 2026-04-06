import { type ComponentType, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ConnectionQuality, Track, type Participant } from 'livekit-client'
import type { LocalAudioTrack, RemoteAudioTrack } from 'livekit-client'
import {
  MicOff, EarOff, ShieldCheck, ShieldOff,
  UserX, Ban, MoreVertical, Volume2, VolumeX,
  Activity, Loader2,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMeetingContext } from '@/components/meeting/MeetingContext'
import {
  useParticipantOverridesStore,
  selectIsMuted,
  selectVolume,
} from '#/lib/participant-overrides.store'
import { useAudioPreferencesStore } from '#/lib/audio-preferences.store'
import { api } from '#/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParticipantMeta {
  accesses?: string[]
  deafened?: boolean
}

function parseMeta(raw: string | undefined): ParticipantMeta {
  try { return JSON.parse(raw ?? '{}') } catch { return {} }
}

interface StatsData {
  quality: 'excellent' | 'good' | 'poor' | 'unknown'
  codec?: string       // e.g. "OPUS"
  ping?: number        // ms (RTT from WebRTC candidate-pair stats)
  bandwidth?: number   // kbps (available incoming/outgoing bitrate)
  ip?: string          // admin-only, from backend
}

const QUAL_COLOR: Record<StatsData['quality'], string> = {
  excellent: '#34d399',
  good: '#fbbf24',
  poor: '#f87171',
  unknown: 'rgba(255,255,255,0.3)',
}

const LABEL_STYLE: React.CSSProperties = {
  color: 'rgba(255,255,255,0.3)',
  fontSize: 10,
  padding: '4px 8px 2px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}
const ITEM_STYLE: React.CSSProperties = { color: 'rgba(255,255,255,0.75)', fontSize: 13 }
const SEP_STYLE: React.CSSProperties = { background: 'rgba(255,255,255,0.07)' }

// ─── Injected primitive props (render-prop pattern) ───────────────────────────

export interface ParticipantMenuContentProps {
  participant: Participant
  isPinned?: boolean
  onTogglePin?: () => void
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

// ─── WebRTC stats collector ────────────────────────────────────────────────────

async function collectWebRTCStats(participant: Participant): Promise<Partial<StatsData>> {
  const audioPub = participant.getTrackPublication(Track.Source.Microphone)
  if (!audioPub?.track) return {}

  let report: RTCStatsReport | undefined
  try {
    if (participant.isLocal) {
      report = await (audioPub.track as LocalAudioTrack).sender?.getStats()
    } else {
      report = await (audioPub.track as RemoteAudioTrack).receiver?.getStats()
    }
  } catch { return {} }

  if (!report) return {}

  let codec: string | undefined
  let ping: number | undefined
  let bandwidth: number | undefined

  report.forEach((entry) => {
    const s = entry as Record<string, unknown>
    // First codec entry wins
    if (s.type === 'codec' && !codec) {
      const mime = s.mimeType as string | undefined
      codec = mime?.replace(/^(audio|video)\//i, '').toUpperCase()
    }
    // Active nominated candidate pair
    if (s.type === 'candidate-pair' && s.nominated === true) {
      const rtt = s.currentRoundTripTime as number | undefined
      if (rtt != null) ping = Math.round(rtt * 1000)
      const bw = (s.availableIncomingBitrate ?? s.availableOutgoingBitrate) as number | undefined
      if (bw != null) bandwidth = Math.round(bw / 1000)
    }
  })

  return { codec, ping, bandwidth }
}

// ─── Shared menu content ──────────────────────────────────────────────────────

export function ParticipantMenuContent({
  participant,
  Item,
  Separator,
  Label,
  onClose,
}: ParticipantMenuContentProps) {
  const { roomId, adminId, isAdmin, isModerator, isCreator } = useMeetingContext()
  const identity = participant.identity
  const isSelf = participant.isLocal
  const canModerate = isAdmin || isModerator || isCreator
  const canManageRole = isAdmin || isCreator
  const canViewStats = true // everyone sees stats; IP is gated separately

  // Metadata
  const meta = useMemo(() => parseMeta(participant.metadata), [participant.metadata])
  const isRoomAdmin = identity === adminId
  const isMod = !isRoomAdmin && (meta.accesses ?? []).includes('moderator')

  // Client-side audio overrides
  const isMuted = useParticipantOverridesStore(selectIsMuted(identity))
  const volume = useParticipantOverridesStore(selectVolume(identity))
  const toggleMute = useParticipantOverridesStore((s) => s.toggleMute)
  const setVolume = useParticipantOverridesStore((s) => s.setVolume)

  // Noise suppression mode (self only)
  const noiseMode = useAudioPreferencesStore((s) => s.noiseSuppressionMode)

  // Action loading state
  const [loading, setLoading] = useState<string | null>(null)

  // Stats panel
  const [statsOpen, setStatsOpen] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const ipFetchedRef = useRef(false)

  const quality = useMemo<StatsData['quality']>(() => {
    if (participant.connectionQuality === ConnectionQuality.Excellent) return 'excellent'
    if (participant.connectionQuality === ConnectionQuality.Good) return 'good'
    if (participant.connectionQuality === ConnectionQuality.Poor) return 'poor'
    return 'unknown'
  }, [participant.connectionQuality])

  // Poll WebRTC stats while panel is open; fetch IP once
  useEffect(() => {
    if (!statsOpen) return
    let cancelled = false

    async function poll() {
      setStatsLoading(true)
      while (!cancelled) {
        const webrtc = await collectWebRTCStats(participant)
        if (cancelled) break

        setStats((prev) => ({
          quality,
          codec: webrtc.codec ?? prev?.codec,
          ping: webrtc.ping ?? prev?.ping,
          bandwidth: webrtc.bandwidth ?? prev?.bandwidth,
          ip: prev?.ip,
        }))
        setStatsLoading(false)

        // Fetch IP once (admin, non-self only)
        if (!ipFetchedRef.current && (isAdmin || isCreator) && !isSelf) {
          ipFetchedRef.current = true
          try {
            const data = await api.get<{ ip?: string }>(`/api/room/${roomId}/participant/${identity}/info`)
            if (!cancelled && data?.ip) {
              setStats((prev) => prev ? { ...prev, ip: data.ip } : null)
            }
          } catch { /* not critical */ }
        }

        await new Promise<void>((r) => setTimeout(r, 1500))
      }
    }

    poll()
    return () => { cancelled = true }
  }, [statsOpen, quality, participant, isAdmin, isCreator, isSelf, roomId, identity])

  // Keep quality up-to-date even without stats open
  useEffect(() => {
    if (statsOpen) setStats((prev) => prev ? { ...prev, quality } : null)
  }, [quality, statsOpen])

  async function act(key: string, path: string) {
    setLoading(key)
    try {
      await api.post(path)
      onClose?.()
    } catch (e) {
      console.error('[ParticipantContextMenu] action failed:', e)
    } finally {
      setLoading(null)
    }
  }

  const handleToggleStats = useCallback(() => {
    setStatsOpen((o) => {
      if (!o) { setStats(null); ipFetchedRef.current = false }
      return !o
    })
  }, [])

  const showAdminBlock = canManageRole && !isSelf && !isRoomAdmin
  const showModBlock = canModerate && !isSelf && !isRoomAdmin

  return (
    <>
      {/* ── Section 1: Role management ────────────────────────── */}
      {showAdminBlock && (
        <>
          <Label style={LABEL_STYLE}>Role</Label>
          {isMod ? (
            <Item
              disabled={loading === 'demote'}
              onClick={() => act('demote', `/api/room/${roomId}/demote/${identity}`)}
              style={ITEM_STYLE}
            >
              {loading === 'demote'
                ? <Loader2 size={13} className="animate-spin" style={{ marginRight: 8, flexShrink: 0 }} />
                : <ShieldOff size={13} style={{ marginRight: 8, flexShrink: 0 }} />
              }
              Demote from Moderator
            </Item>
          ) : (
            <Item
              disabled={loading === 'promote'}
              onClick={() => act('promote', `/api/room/${roomId}/promote/${identity}`)}
              style={ITEM_STYLE}
            >
              {loading === 'promote'
                ? <Loader2 size={13} className="animate-spin" style={{ marginRight: 8, flexShrink: 0 }} />
                : <ShieldCheck size={13} style={{ marginRight: 8, flexShrink: 0 }} />
              }
              Promote to Moderator
            </Item>
          )}
          <Separator style={SEP_STYLE} />
        </>
      )}

      {/* ── Section 2: Kick / Ban ─────────────────────────────── */}
      {showAdminBlock && (
        <>
          <Item
            disabled={loading === 'kick'}
            onClick={() => act('kick', `/api/room/${roomId}/kick/${identity}`)}
            style={{ color: '#f87171', fontSize: 13 }}
          >
            {loading === 'kick'
              ? <Loader2 size={13} className="animate-spin" style={{ marginRight: 8, flexShrink: 0 }} />
              : <UserX size={13} style={{ marginRight: 8, flexShrink: 0 }} />
            }
            Kick
          </Item>
          <Item
            disabled={loading === 'ban'}
            onClick={() => act('ban', `/api/room/${roomId}/ban/${identity}`)}
            style={{ color: '#f87171', fontSize: 13 }}
          >
            {loading === 'ban'
              ? <Loader2 size={13} className="animate-spin" style={{ marginRight: 8, flexShrink: 0 }} />
              : <Ban size={13} style={{ marginRight: 8, flexShrink: 0 }} />
            }
            Ban
          </Item>
          <Separator style={SEP_STYLE} />
        </>
      )}

      {/* ── Section 3 + 4: Local audio + server controls ─────── */}
      {!isSelf && (
        <>
          <Label style={LABEL_STYLE}>Audio</Label>

          {/* 3 — Client-side mute (like Discord) */}
          <Item onClick={() => toggleMute(identity)} style={ITEM_STYLE}>
            {isMuted
              ? <VolumeX size={13} style={{ marginRight: 8, flexShrink: 0 }} />
              : <Volume2 size={13} style={{ marginRight: 8, flexShrink: 0 }} />
            }
            {isMuted ? 'Unmute (local)' : 'Mute (local)'}
          </Item>

          {/* 4 — Volume slider (client-side, like Discord) — up to 200% */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '2px 10px 6px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <VolumeX size={12} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <input
              type="range"
              min={0}
              max={200}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(identity, Number(e.target.value) / 100)}
              style={{ flex: 1, accentColor: '#6366f1', height: 3, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', minWidth: 32, textAlign: 'right', fontFamily: 'monospace' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* 5 — Server mute / deafen (admin / mod) */}
          {showModBlock && (
            <>
              <Item
                disabled={loading === 'srvmute'}
                onClick={() => act('srvmute', `/api/room/${roomId}/mute/${identity}`)}
                style={ITEM_STYLE}
              >
                {loading === 'srvmute'
                  ? <Loader2 size={13} className="animate-spin" style={{ marginRight: 8 }} />
                  : <MicOff size={13} style={{ marginRight: 8 }} />
                }
                Server Mute
              </Item>
              <Item
                disabled={loading === 'deafen'}
                onClick={() => act('deafen', `/api/room/${roomId}/deafen/${identity}`)}
                style={ITEM_STYLE}
              >
                {loading === 'deafen'
                  ? <Loader2 size={13} className="animate-spin" style={{ marginRight: 8 }} />
                  : <EarOff size={13} style={{ marginRight: 8 }} />
                }
                Deafen
              </Item>
            </>
          )}

          <Separator style={SEP_STYLE} />
        </>
      )}

      {/* ── Section 6: Connection stats ──────────────────────── */}
      {canViewStats && (
        <>
          <div
            role="menuitem"
            tabIndex={0}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); handleToggleStats() }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleStats() }}
            style={{
              display: 'flex', alignItems: 'center',
              padding: '6px 8px', borderRadius: 4,
              cursor: 'pointer', userSelect: 'none',
              color: 'rgba(255,255,255,0.6)', fontSize: 13,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            <Activity size={13} style={{ marginRight: 8, flexShrink: 0 }} />
            {statsOpen ? 'Hide Stats' : 'Connection Stats'}
          </div>

          {statsOpen && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                margin: '4px 8px 6px',
                padding: '8px 10px',
                borderRadius: 7,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column', gap: 5,
              }}
            >
              {statsLoading && !stats ? (
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Collecting…</span>
              ) : (
                <>
                  <StatRow label="Quality">
                    <span style={{ color: QUAL_COLOR[stats?.quality ?? 'unknown'], fontWeight: 600, fontSize: 11 }}>
                      {stats?.quality ?? '—'}
                    </span>
                  </StatRow>

                  {stats?.codec && (
                    <StatRow label="Codec">
                      <span style={{ fontFamily: 'monospace' }}>{stats.codec}</span>
                    </StatRow>
                  )}

                  {isSelf && (
                    <StatRow label="Noise suppression">
                      <span style={{ textTransform: 'capitalize' }}>{noiseMode}</span>
                    </StatRow>
                  )}

                  {stats?.ping != null && (
                    <StatRow label="Ping">
                      <span style={{ color: stats.ping < 80 ? '#34d399' : stats.ping < 200 ? '#fbbf24' : '#f87171', fontFamily: 'monospace' }}>
                        {stats.ping} ms
                      </span>
                    </StatRow>
                  )}

                  {stats?.bandwidth != null && (
                    <StatRow label="Bandwidth">
                      <span style={{ fontFamily: 'monospace' }}>{stats.bandwidth} kbps</span>
                    </StatRow>
                  )}

                  {(isAdmin || isCreator) && !isSelf && stats?.ip && (
                    <StatRow label="IP">
                      <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.75)' }}>
                        {stats.ip}
                      </span>
                    </StatRow>
                  )}

                  {statsLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Loader2 size={10} className="animate-spin" style={{ color: 'rgba(255,255,255,0.2)' }} />
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>updating…</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}

// ─── Tiny helper ──────────────────────────────────────────────────────────────

function StatRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{children}</span>
    </div>
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
          Separator={({ className, style }) => <ContextMenuSeparator className={className} style={style} />}
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
          Separator={({ className, style }) => <DropdownMenuSeparator className={className} style={style} />}
          Label={({ className, style, children: c }) => (
            <DropdownMenuLabel
              className={className}
              style={{
                fontSize: 10, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                color: 'rgba(255,255,255,0.3)',
                padding: '4px 8px 2px',
                ...style,
              }}
            >
              {c}
            </DropdownMenuLabel>
          )}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

