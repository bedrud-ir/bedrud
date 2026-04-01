import { useMemo, useState } from 'react'
import { useParticipants } from '@livekit/components-react'
import { X, Mic, MicOff, Video, VideoOff, MoreVertical, UserX, Ban, Users } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMeetingContext } from '@/components/meeting/MeetingContext'
import { api } from '#/lib/api'

interface Props {
  onClose: () => void
}

interface ParticipantMeta {
  accesses?: string[]
}

function parseMeta(raw: string | undefined): ParticipantMeta {
  try { return JSON.parse(raw ?? '{}') } catch { return {} }
}

const PALETTES = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)',
  'linear-gradient(135deg,#f43f5e,#fb923c)',
]
function getPalette(name: string) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return PALETTES[Math.abs(hash) % PALETTES.length]
}

const panel: React.CSSProperties = {
  position: 'absolute', right: 0, top: 0, bottom: 0,
  width: 288, zIndex: 30,
  display: 'flex', flexDirection: 'column',
  background: 'rgba(10,10,22,0.94)',
  backdropFilter: 'blur(24px)',
  borderLeft: '1px solid rgba(255,255,255,0.07)',
}

export function ParticipantsList({ onClose }: Props) {
  const participants = useParticipants()
  const { adminId, roomId, isAdmin, isModerator } = useMeetingContext()
  const canModerate = isAdmin || isModerator
  const [loadingIdentity, setLoadingIdentity] = useState<string | null>(null)

  async function handleMute(identity: string) {
    setLoadingIdentity(identity)
    try { await api.post(`/api/room/${roomId}/mute/${identity}`) } finally { setLoadingIdentity(null) }
  }

  async function handleKick(identity: string) {
    setLoadingIdentity(identity)
    try { await api.post(`/api/room/${roomId}/kick/${identity}`) } finally { setLoadingIdentity(null) }
  }

  async function handleBan(identity: string) {
    setLoadingIdentity(identity)
    try { await api.post(`/api/room/${roomId}/ban/${identity}`) } finally { setLoadingIdentity(null) }
  }

  return (
    <aside className="meet-panel" style={panel}>
      {/* Header */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Users size={14} style={{ color: 'rgba(165,180,252,0.7)' }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>
            Participants
          </span>
          <span style={{
            background: 'rgba(99,102,241,0.18)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: 'rgba(165,180,252,0.8)',
            borderRadius: 6, padding: '1px 6px',
            fontSize: 11, fontWeight: 600,
          }}>
            {participants.length}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          aria-label="Close participants"
        >
          <X size={15} />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {participants.map((p) => (
          <ParticipantRow
            key={p.identity}
            p={p}
            adminId={adminId}
            canModerate={canModerate}
            isAdmin={isAdmin}
            loading={loadingIdentity === p.identity}
            onMute={handleMute}
            onKick={handleKick}
            onBan={handleBan}
          />
        ))}
      </div>
    </aside>
  )
}

interface RowProps {
  p: ReturnType<typeof useParticipants>[number]
  adminId: string
  canModerate: boolean
  isAdmin: boolean
  loading: boolean
  onMute: (id: string) => void
  onKick: (id: string) => void
  onBan: (id: string) => void
}

function ParticipantRow({ p, adminId, canModerate, isAdmin, loading, onMute, onKick, onBan }: RowProps) {
  const displayName = p.name ?? p.identity
  const initial = displayName.charAt(0).toUpperCase()
  const gradient = useMemo(() => getPalette(displayName), [displayName])

  const meta = useMemo(() => parseMeta(p.metadata), [p.metadata])
  const participantAccesses = meta.accesses ?? []
  const isRoomAdmin = p.identity === adminId
  const isMod = !isRoomAdmin && participantAccesses.includes('moderator')
  const isGuest = !isRoomAdmin && !isMod && participantAccesses.includes('guest')

  return (
    <div
      className="group"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 8px', borderRadius: 10,
        transition: 'background 0.12s',
        cursor: 'default',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: gradient, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: 'white',
      }}>
        {initial}
      </div>

      {/* Name + badges */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </span>
          {p.isLocal && (
            <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, flexShrink: 0 }}>you</span>
          )}
        </div>

        {(isRoomAdmin || isMod || isGuest) && (
          <div style={{ display: 'flex', gap: 4 }}>
            {isRoomAdmin && (
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                color: '#a5b4fc',
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 4, padding: '1px 5px',
              }}>Admin</span>
            )}
            {isMod && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: '#6ee7b7',
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 4, padding: '1px 5px',
              }}>Mod</span>
            )}
            {isGuest && (
              <span style={{
                fontSize: 10, fontWeight: 500,
                color: 'rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4, padding: '1px 5px',
              }}>Guest</span>
            )}
          </div>
        )}
      </div>

      {/* Status icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {p.isMicrophoneEnabled
          ? <Mic size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
          : <MicOff size={13} style={{ color: '#f87171' }} />
        }
        {p.isCameraEnabled
          ? <Video size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
          : <VideoOff size={13} style={{ color: 'rgba(255,255,255,0.18)' }} />
        }

        {canModerate && !p.isLocal && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={loading}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'transparent', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                  opacity: 0, transition: 'opacity 0.15s',
                }}
                className="group-hover:!opacity-100"
                aria-label={`Moderate ${displayName}`}
              >
                <MoreVertical size={13} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              style={{
                background: 'rgba(15,15,28,0.98)', border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <DropdownMenuItem
                onClick={() => onMute(p.identity)}
                style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}
              >
                <MicOff size={13} style={{ marginRight: 8 }} />
                Mute Audio
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.07)' }} />
              <DropdownMenuItem
                onClick={() => onKick(p.identity)}
                style={{ color: '#f87171', fontSize: 13 }}
              >
                <UserX size={13} style={{ marginRight: 8 }} />
                Kick
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => onBan(p.identity)}
                  style={{ color: '#f87171', fontSize: 13 }}
                >
                  <Ban size={13} style={{ marginRight: 8 }} />
                  Ban
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
