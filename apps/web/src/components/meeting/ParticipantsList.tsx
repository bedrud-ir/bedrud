import { useParticipants } from '@livekit/components-react'
import { Mic, MicOff, Users, Video, VideoOff, VolumeX, X } from 'lucide-react'
import { useMemo } from 'react'
import { getPalette } from '#/lib/participant-palette'
import { useMeetingRoomContext } from '@/components/meeting/MeetingContext'
import { ParticipantContextMenu, ParticipantMenuButton } from '@/components/meeting/ParticipantContextMenu'

interface Props {
  onClose: () => void
}

interface ParticipantMeta {
  accesses?: string[]
  deafened?: boolean
}

function parseMeta(raw: string | undefined): ParticipantMeta {
  try {
    return JSON.parse(raw ?? '{}')
  } catch {
    return {}
  }
}

const panel: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  width: 'min(288px, 100vw)',
  zIndex: 30,
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(10,10,22,0.94)',
  backdropFilter: 'blur(24px)',
  borderLeft: '1px solid rgba(255,255,255,0.07)',
  paddingTop: 'env(safe-area-inset-top, 0px)',
  paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
}

export function ParticipantsList({ onClose }: Props) {
  const participants = useParticipants()
  const { adminId } = useMeetingRoomContext()

  return (
    <aside className="meet-panel" style={panel}>
      {/* Header */}
      <div
        style={{
          height: 52,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Users size={14} style={{ color: 'color-mix(in oklab, var(--sky-300) 70%, transparent)' }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>Participants</span>
          <span
            style={{
              background: 'color-mix(in oklab, var(--primary) 18%, transparent)',
              border: '1px solid color-mix(in oklab, var(--primary) 25%, transparent)',
              color: 'color-mix(in oklab, var(--sky-300) 80%, transparent)',
              borderRadius: 6,
              padding: '1px 6px',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {participants.length}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer',
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
          <ParticipantRow key={p.identity} p={p} adminId={adminId} />
        ))}
      </div>
    </aside>
  )
}

interface RowProps {
  p: ReturnType<typeof useParticipants>[number]
  adminId: string
}

function ParticipantRow({ p, adminId }: RowProps): React.ReactElement {
  const displayName = p.name ?? p.identity
  const initial = displayName.charAt(0).toUpperCase()
  const palette = useMemo(() => getPalette(displayName), [displayName])

  const meta = useMemo(() => parseMeta(p.metadata), [p.metadata])
  const participantAccesses = meta.accesses ?? []
  const isRoomAdmin = p.identity === adminId
  const isMod = !isRoomAdmin && participantAccesses.includes('moderator')
  const isGuest = !isRoomAdmin && !isMod && participantAccesses.includes('guest')

  const row = (
    <div
      className="group"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 8px',
        borderRadius: 10,
        transition: 'background 0.12s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: palette.avatar,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: 'white',
        }}
      >
        {initial}
      </div>

      {/* Name + badges */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              color: 'rgba(255,255,255,0.82)',
              fontSize: 13,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </span>
          {p.isLocal && <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, flexShrink: 0 }}>you</span>}
        </div>

        {(isRoomAdmin || isMod || isGuest) && (
          <div style={{ display: 'flex', gap: 4 }}>
            {isRoomAdmin && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: 'var(--sky-300)',
                  background: 'color-mix(in oklab, var(--primary) 20%, transparent)',
                  border: '1px solid color-mix(in oklab, var(--primary) 30%, transparent)',
                  borderRadius: 4,
                  padding: '1px 5px',
                }}
              >
                Admin
              </span>
            )}
            {isMod && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#6ee7b7',
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 4,
                  padding: '1px 5px',
                }}
              >
                Mod
              </span>
            )}
            {isGuest && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  padding: '1px 5px',
                }}
              >
                Guest
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {meta.deafened && <VolumeX size={13} style={{ color: '#f87171' }} />}
        {p.isMicrophoneEnabled ? (
          <Mic size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
        ) : (
          <MicOff size={13} style={{ color: '#f87171' }} />
        )}
        {p.isCameraEnabled ? (
          <Video size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
        ) : (
          <VideoOff size={13} style={{ color: 'rgba(255,255,255,0.18)' }} />
        )}

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <ParticipantMenuButton participant={p} />
        </div>
      </div>
    </div>
  )

  return <ParticipantContextMenu participant={p}>{row}</ParticipantContextMenu>
}
