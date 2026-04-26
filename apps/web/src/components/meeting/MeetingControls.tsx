import { useRoomContext } from '@livekit/components-react'
import { LogOut, PhoneOff } from 'lucide-react'
import { useState } from 'react'
import { api } from '#/lib/api'
import { ControlsBar } from '@/components/meeting/ControlsBar'
import { useMeetingRoomContext } from '@/components/meeting/MeetingContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MeetingControlsProps {
  onNavigate: () => void
}

/** Renders the bottom controls bar and the end-meeting dialog for creators. */
export function MeetingControls({ onNavigate }: MeetingControlsProps) {
  const { isCreator, roomId } = useMeetingRoomContext()
  const room = useRoomContext()
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  function handleLeaveRequest() {
    if (isCreator) setEndDialogOpen(true)
    else onNavigate()
  }

  async function handleEndMeeting() {
    setIsEnding(true)
    try {
      await api.delete(`/api/room/${roomId}`)
    } catch {
      /* already closed */
    }
    room.disconnect()
    onNavigate()
  }

  function handleLeaveMeeting() {
    room.disconnect()
    onNavigate()
  }

  return (
    <>
      <ControlsBar onLeave={handleLeaveRequest} />
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent
          className="sm:max-w-sm"
          style={{ background: '#0f0f1e', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'white' }}>Leave meeting?</DialogTitle>
            <DialogDescription style={{ color: 'rgba(255,255,255,0.45)' }}>
              You created this meeting. End it for everyone, or just slip out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full gap-2"
              style={{ background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none' }}
              onClick={handleEndMeeting}
              disabled={isEnding}
            >
              <PhoneOff className="h-4 w-4" />
              End Meeting for Everyone
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
              }}
              onClick={handleLeaveMeeting}
            >
              <LogOut className="h-4 w-4" />
              Leave Meeting
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onClick={() => setEndDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
