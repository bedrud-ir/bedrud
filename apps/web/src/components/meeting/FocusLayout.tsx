import { useTracks, useParticipants } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { ScreenShareTile } from './ScreenShareTile'
import { ParticipantTile } from './ParticipantTile'

interface FocusLayoutProps {
  pinnedIdentities: Set<string>
  onTogglePin: (identity: string) => void
}

export function FocusLayout({ pinnedIdentities, onTogglePin }: FocusLayoutProps) {
  const screenShareTracks = useTracks([Track.Source.ScreenShare])
  const participants = useParticipants()

  const pinnedParticipants = participants.filter((p) => pinnedIdentities.has(p.identity))
  const stripParticipants  = participants.filter((p) => !pinnedIdentities.has(p.identity))

  const mainCount = screenShareTracks.length + pinnedParticipants.length
  const gridCols  = Math.min(mainCount, 3)

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      paddingTop: 56,
      paddingBottom: 88,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      zIndex: 0,
    }}>
      {/* ── Main focus area ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridAutoRows: '1fr',
        gap: 4,
        padding: '4px 4px 0',
        minHeight: 0,
      }}>
        {screenShareTracks.map((track) => (
          <ScreenShareTile
            key={`${track.participant.identity}-screen`}
            trackRef={track}
          />
        ))}
        {pinnedParticipants.map((p, i) => (
          <ParticipantTile
            key={p.identity}
            participant={p}
            totalCount={mainCount}
            index={screenShareTracks.length + i}
            isPinned={true}
            onTogglePin={() => onTogglePin(p.identity)}
          />
        ))}
      </div>

      {/* ── Bottom strip: non-focused participants ── */}
      {stripParticipants.length > 0 && (
        <div style={{
          height: 100,
          flexShrink: 0,
          display: 'flex',
          gap: 4,
          padding: '0 4px 4px',
          overflowX: 'auto',
        }}>
          {stripParticipants.map((p, i) => (
            <div key={p.identity} style={{ width: 160, height: 90, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
              <ParticipantTile
                participant={p}
                totalCount={9}
                index={i}
                isPinned={false}
                onTogglePin={() => onTogglePin(p.identity)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
