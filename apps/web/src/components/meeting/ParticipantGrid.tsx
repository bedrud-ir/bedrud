import { useParticipants } from '@livekit/components-react'
import { Video } from 'lucide-react'
import { ParticipantTile } from './ParticipantTile'

interface ParticipantGridProps {
  pinnedIdentities: Set<string>
  onTogglePin: (identity: string) => void
}

function gridCols(count: number): string {
  if (count === 1) return 'grid-cols-1'
  if (count <= 4) return 'grid-cols-1 sm:grid-cols-2'
  if (count <= 9) return 'grid-cols-2 sm:grid-cols-3'
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
}

const gridArea: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))',
  paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
  zIndex: 0,
}

export function ParticipantGrid({ pinnedIdentities, onTogglePin }: ParticipantGridProps) {
  const participants = useParticipants()

  if (participants.length === 0) {
    return (
      <div style={gridArea} className="flex flex-col items-center justify-center gap-5">
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'color-mix(in oklab, var(--primary) 10%, transparent)',
            border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Video size={32} style={{ color: 'color-mix(in oklab, var(--primary) 55%, transparent)' }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Waiting for others to join…</p>
      </div>
    )
  }

  return (
    <div style={gridArea}>
      <div
        className={gridCols(participants.length)}
        style={{
          display: 'grid',
          height: '100%',
          width: '100%',
          gridAutoRows: '1fr',
          gap: participants.length === 1 ? 0 : 3,
          padding: participants.length === 1 ? 0 : 3,
        }}
      >
        {participants.map((p, i) => (
          <ParticipantTile
            key={p.identity}
            participant={p}
            totalCount={participants.length}
            index={i}
            isPinned={pinnedIdentities.has(p.identity)}
            onTogglePin={() => onTogglePin(p.identity)}
          />
        ))}
      </div>
    </div>
  )
}
