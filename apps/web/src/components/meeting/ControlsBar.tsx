import { useLocalParticipant } from '@livekit/components-react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '#/lib/utils'

interface Props {
  onToggleChat: () => void
  onToggleParticipants: () => void
  onLeave: () => void
  chatOpen: boolean
  participantsOpen: boolean
}

export function ControlsBar({ onToggleChat, onToggleParticipants, onLeave, chatOpen, participantsOpen }: Props) {
  const { localParticipant } = useLocalParticipant()
  const micEnabled = localParticipant?.isMicrophoneEnabled ?? false
  const camEnabled = localParticipant?.isCameraEnabled ?? false

  function toggleMic() {
    localParticipant?.setMicrophoneEnabled(!micEnabled)
  }

  function toggleCam() {
    localParticipant?.setCameraEnabled(!camEnabled)
  }

  return (
    <footer className="flex h-16 shrink-0 items-center justify-between border-t bg-background/95 px-4 backdrop-blur">
      {/* Left: time */}
      <div className="flex-1 text-xs text-muted-foreground hidden sm:block">
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Center: primary controls */}
      <div className="flex flex-1 items-center justify-center gap-2">
        <Button
          variant={micEnabled ? 'outline' : 'destructive'}
          size="icon"
          onClick={toggleMic}
          aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          title={micEnabled ? 'Mute' : 'Unmute'}
        >
          {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>

        <Button
          variant={camEnabled ? 'outline' : 'destructive'}
          size="icon"
          onClick={toggleCam}
          aria-label={camEnabled ? 'Disable camera' : 'Enable camera'}
          title={camEnabled ? 'Disable video' : 'Enable video'}
        >
          {camEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>

        <Button
          variant="destructive"
          className="gap-1.5 px-4"
          onClick={onLeave}
          aria-label="Leave meeting"
        >
          <PhoneOff className="h-4 w-4" />
          Leave
        </Button>
      </div>

      {/* Right: sidebar toggles */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleChat}
          aria-label="Toggle chat"
          className={cn(chatOpen && 'bg-accent text-accent-foreground')}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleParticipants}
          aria-label="Toggle participants list"
          className={cn(participantsOpen && 'bg-accent text-accent-foreground')}
        >
          <Users className="h-4 w-4" />
        </Button>
      </div>
    </footer>
  )
}
