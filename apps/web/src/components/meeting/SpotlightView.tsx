import type { Participant } from 'livekit-client'
import { Track } from 'livekit-client'
import { useParticipantInfo, VideoTrack } from '@livekit/components-react'
import { MicOff, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  participant: Participant
  onClose: () => void
}

export function SpotlightView({ participant, onClose }: Props) {
  const { name, identity } = useParticipantInfo({ participant })
  const cameraTrack = participant.getTrackPublication(Track.Source.Camera)
  const hasCameraVideo = Boolean(cameraTrack?.isSubscribed && !cameraTrack.isMuted && cameraTrack)
  const displayName = name ?? identity

  return (
    <div className="relative flex flex-1 items-center justify-center bg-black/90 p-6">
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-muted shadow-2xl"
        style={{ aspectRatio: '16/9' }}
      >
        {hasCameraVideo && cameraTrack ? (
          <VideoTrack
            trackRef={{ participant, source: Track.Source.Camera, publication: cameraTrack }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted-foreground/20 text-4xl font-semibold">
              {displayName?.charAt(0).toUpperCase()}
            </div>
            <span className="text-lg">{displayName}</span>
          </div>
        )}

        {/* Name badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
          <span>{displayName}</span>
          {!participant.isMicrophoneEnabled && <MicOff className="h-4 w-4 text-red-400" />}
        </div>

        {/* Exit button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
          aria-label="Exit spotlight"
        >
          <Minimize2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
