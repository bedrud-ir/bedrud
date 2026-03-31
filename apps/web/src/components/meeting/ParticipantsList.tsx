import { useParticipants } from '@livekit/components-react'
import { X, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Props {
  onClose: () => void
}

export function ParticipantsList({ onClose }: Props) {
  const participants = useParticipants()

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l bg-background">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <span className="font-semibold text-sm">
          Participants ({participants.length})
        </span>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close participants">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {participants.map((p) => {
            const displayName = p.name ?? p.identity
            const initials = displayName.charAt(0).toUpperCase()
            return (
              <div
                key={p.identity}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-medium">
                  {displayName}
                  {p.isLocal && (
                    <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  {p.isMicrophoneEnabled ? (
                    <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <MicOff className="h-3.5 w-3.5 text-red-400" />
                  )}
                  {p.isCameraEnabled ? (
                    <Video className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <VideoOff className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}
