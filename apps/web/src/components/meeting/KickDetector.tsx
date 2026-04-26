import { useRoomContext } from '@livekit/components-react'
import { DisconnectReason, RoomEvent } from 'livekit-client'
import { useEffect } from 'react'

interface KickDetectorProps {
  onKicked: () => void
}

/** Listens for a PARTIAL_REMOVED disconnect reason and calls onKicked. */
export function KickDetector({ onKicked }: KickDetectorProps) {
  const room = useRoomContext()

  useEffect(() => {
    const handler = (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        onKicked()
      }
    }
    room.on(RoomEvent.Disconnected, handler)
    return () => {
      room.off(RoomEvent.Disconnected, handler)
    }
  }, [room, onKicked])

  return null
}
