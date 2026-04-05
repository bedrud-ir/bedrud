import { useTracks, useParticipants, useIsSpeaking } from '@livekit/components-react'
import { Track, type Participant } from 'livekit-client'
import { ScreenShareTile } from './ScreenShareTile'
import { ParticipantTile } from './ParticipantTile'

interface FocusLayoutProps {
  pinnedIdentities: Set<string>
  onTogglePin: (identity: string) => void
}

// Strip tile dimensions (16:9)
const STRIP_W = 168
const STRIP_H = 94

// Separate component so useIsSpeaking can be called per participant
function StripTile({ participant, index, onTogglePin }: {
  participant: Participant
  index: number
  onTogglePin: () => void
}) {
  const isSpeaking = useIsSpeaking(participant)

  return (
    <div
      style={{
        width: STRIP_W,
        height: STRIP_H,
        flexShrink: 0,
        borderRadius: 8,
        overflow: 'hidden',
        border: isSpeaking
          ? '1.5px solid rgba(99,102,241,0.75)'
          : '1.5px solid rgba(255,255,255,0.07)',
        boxShadow: isSpeaking ? '0 0 14px rgba(99,102,241,0.3)' : 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <ParticipantTile
        participant={participant}
        totalCount={6}
        index={index}
        isPinned={false}
        onTogglePin={onTogglePin}
      />
    </div>
  )
}

export function FocusLayout({ pinnedIdentities, onTogglePin }: FocusLayoutProps) {
  const screenShareTracks = useTracks([Track.Source.ScreenShare])
  const participants = useParticipants()

  const pinnedParticipants = participants.filter((p) => pinnedIdentities.has(p.identity))
  const stripParticipants  = participants.filter((p) => !pinnedIdentities.has(p.identity))

  const mainCount = screenShareTracks.length + pinnedParticipants.length
  const gridCols  = Math.min(mainCount, 3)
  const hasStrip  = stripParticipants.length > 0

  // Strip outer height including its own padding
  const STRIP_OUTER = STRIP_H + 18

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      paddingTop: 56,
      paddingBottom: 88,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      zIndex: 0,
    }}>

      {/* ── Main focus area ─────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridAutoRows: '1fr',
        gap: 5,
        padding: '5px 5px 0',
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
            isPinned
            onTogglePin={() => onTogglePin(p.identity)}
          />
        ))}
      </div>

      {/* ── Bottom filmstrip ─────────────────────────────────────── */}
      {hasStrip && (
        <div style={{
          height: STRIP_OUTER,
          flexShrink: 0,
          position: 'relative',
          // Glass panel separating strip from main area
          background: 'rgba(8,8,18,0.7)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          marginTop: 5,
        }}>

          {/* Scrollable row */}
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 10px',
              overflowX: 'auto',
              // Hide scrollbar cross-browser
              scrollbarWidth: 'none',
            }}
            // Webkit scrollbar hidden via className below
            className="strip-scroll"
          >
            {stripParticipants.map((p, i) => (
              <StripTile
                key={p.identity}
                participant={p}
                index={i}
                onTogglePin={() => onTogglePin(p.identity)}
              />
            ))}

            {/* Right padding sentinel so last tile isn't occluded by fade */}
            <div style={{ width: 32, flexShrink: 0 }} />
          </div>

          {/* Right-edge fade — hints at horizontal scroll */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 64,
            height: '100%',
            background: 'linear-gradient(to right, transparent, rgba(8,8,18,0.85))',
            pointerEvents: 'none',
          }} />

          {/* Participant count badge */}
          <div style={{
            position: 'absolute',
            top: 8,
            right: 14,
            background: 'rgba(99,102,241,0.18)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 6,
            padding: '2px 7px',
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(165,180,252,0.8)',
            pointerEvents: 'none',
          }}>
            {stripParticipants.length}
          </div>
        </div>
      )}
    </div>
  )
}
