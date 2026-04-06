import type { TrackReference, TrackReferenceOrPlaceholder } from '@livekit/components-react'
import { useParticipantInfo, VideoTrack } from '@livekit/components-react'
import { Monitor } from 'lucide-react'

interface ScreenShareTileProps {
  trackRef: TrackReferenceOrPlaceholder
}

export function ScreenShareTile({ trackRef }: ScreenShareTileProps) {
  const { name, identity } = useParticipantInfo({ participant: trackRef.participant })
  const displayName = name ?? identity ?? '?'

  // Placeholders have no publication yet — nothing to render
  if (!trackRef.publication) return null

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#030308',
        borderRadius: 12,
        border: '1px solid rgba(99,102,241,0.35)',
        overflow: 'hidden',
      }}
    >
      <VideoTrack
        trackRef={trackRef as TrackReference}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          borderRadius: 7,
          padding: '4px 10px',
        }}
      >
        <Monitor size={12} style={{ color: '#a5b4fc', flexShrink: 0 }} />
        <span style={{ color: 'white', fontSize: 12, fontWeight: 500 }}>{displayName} is presenting</span>
      </div>
    </div>
  )
}
