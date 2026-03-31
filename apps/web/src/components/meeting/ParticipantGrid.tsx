import { useState } from 'react'
import type { Participant } from 'livekit-client'
import { useParticipants } from '@livekit/components-react'
import { ParticipantTile } from './ParticipantTile'
import { SpotlightView } from './SpotlightView'
import { cn } from '#/lib/utils'

function gridColsClass(count: number): string {
  if (count === 1) return 'grid-cols-1'
  if (count <= 2) return 'grid-cols-2'
  if (count <= 4) return 'grid-cols-2'
  if (count <= 6) return 'grid-cols-3'
  return 'grid-cols-4'
}

export function ParticipantGrid() {
  const participants = useParticipants()
  const [spotlighted, setSpotlighted] = useState<Participant | null>(null)

  if (spotlighted) {
    return (
      <SpotlightView
        participant={spotlighted}
        onClose={() => setSpotlighted(null)}
      />
    )
  }

  return (
    <div
      className={cn(
        'grid flex-1 gap-3 overflow-auto p-4',
        'auto-rows-fr',
        gridColsClass(participants.length)
      )}
    >
      {participants.map((participant) => (
        <ParticipantTile
          key={participant.identity}
          participant={participant}
          onSpotlight={setSpotlighted}
        />
      ))}
      {participants.length === 0 && (
        <div className="col-span-full flex items-center justify-center text-muted-foreground text-sm">
          Waiting for others to join…
        </div>
      )}
    </div>
  )
}
