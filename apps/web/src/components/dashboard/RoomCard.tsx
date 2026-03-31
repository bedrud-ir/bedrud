import { Copy, Check, Users, Lock, Globe } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Room {
  id: string
  name: string
  isPublic: boolean
  maxParticipants: number
  isActive: boolean
  settings: {
    allowChat: boolean
    allowVideo: boolean
    allowAudio: boolean
  }
}

interface Props {
  room: Room
  onJoin: () => void
}

export function RoomCard({ room, onJoin }: Props) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    void navigator.clipboard.writeText(`${window.location.origin}/m/${room.name}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold truncate">{room.name}</CardTitle>
          <Badge variant={room.isPublic ? 'secondary' : 'outline'} className="shrink-0 text-xs">
            {room.isPublic ? (
              <><Globe className="mr-1 h-3 w-3" />Public</>
            ) : (
              <><Lock className="mr-1 h-3 w-3" />Private</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>Max {room.maxParticipants} participants</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {room.settings.allowChat && <Badge variant="outline" className="text-xs">Chat</Badge>}
          {room.settings.allowAudio && <Badge variant="outline" className="text-xs">Audio</Badge>}
          {room.settings.allowVideo && <Badge variant="outline" className="text-xs">Video</Badge>}
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-2">
        <Button className="flex-1" onClick={onJoin}>Join</Button>
        <Button variant="outline" size="icon" onClick={copyLink} aria-label="Copy meeting link">
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  )
}
