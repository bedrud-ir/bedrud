import type { Participant } from 'livekit-client'
import { Track } from 'livekit-client'
import { useParticipantInfo, useIsSpeaking, VideoTrack } from '@livekit/components-react'
import { MicOff, Maximize2 } from 'lucide-react'
import { cn } from '#/lib/utils'

interface Props {
  participant: Participant
  onSpotlight?: (p: Participant) => void
}

export function ParticipantTile({ participant, onSpotlight }: Props) {
  const { name, identity } = useParticipantInfo({ participant })
  const isSpeaking = useIsSpeaking(participant)
  const cameraTrack = participant.getTrackPublication(Track.Source.Camera)
  const hasCameraVideo = Boolean(cameraTrack?.isSubscribed && !cameraTrack.isMuted)
  const displayName = name ?? identity ?? ''

  return (
    <div
      className={cn(
        'group relative flex items-center justify-center overflow-hidden rounded-xl bg-muted transition-all',
        isSpeaking && 'ring-2 ring-primary ring-offset-1',
        participant.isLocal && 'ring-1 ring-primary/40'
      )}
    >
      {hasCameraVideo && cameraTrack ? (
        <VideoTrack
          trackRef={{ participant, source: Track.Source.Camera, publication: cameraTrack }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/20 text-xl font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {isSpeaking && (
            <span className="animate-pulse text-xs text-primary">Speaking…</span>
          )}
        </div>
      )}

      {/* Name + mute badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
        <span className="max-w-[120px] truncate">{displayName}</span>
        {!participant.isMicrophoneEnabled && (
          <MicOff className="h-3 w-3 shrink-0 text-red-400" aria-label="Muted" />
        )}
      </div>

      {/* Spotlight button */}
      {onSpotlight && (
        <button
          onClick={() => onSpotlight(participant)}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 focus:opacity-100"
          aria-label={`Spotlight ${displayName}`}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
