import { useState } from 'react'
import type { Participant } from 'livekit-client'
import { useParticipants } from '@livekit/components-react'
import { Video } from 'lucide-react'
import { ParticipantTile } from './ParticipantTile'
import { SpotlightView } from './SpotlightView'

function gridCols(count: number): string {
  if (count === 1) return 'grid-cols-1'
  if (count <= 4) return 'grid-cols-2'
  if (count <= 9) return 'grid-cols-3'
  return 'grid-cols-4'
}

// Fills the viewport minus the floating header (56px) and controls (88px).
// absolute inset-0 gives it a definite height so grid-auto-rows: 1fr works.
const gridArea: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  paddingTop: 56,
  paddingBottom: 88,
  zIndex: 0,
}

export function ParticipantGrid() {
  const participants = useParticipants()
  const [spotlighted, setSpotlighted] = useState<Participant | null>(null)

  if (spotlighted) {
    return (
      <div style={gridArea}>
        <SpotlightView participant={spotlighted} onClose={() => setSpotlighted(null)} />
      </div>
    )
  }

  if (participants.length === 0) {
    return (
      <div style={gridArea} className="flex flex-col items-center justify-center gap-5">
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Video size={32} style={{ color: 'rgba(99,102,241,0.55)' }} />
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
            onSpotlight={setSpotlighted}
          />
        ))}
      </div>
    </div>
  )
}
