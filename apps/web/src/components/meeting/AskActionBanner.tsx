import { Mic, Video, X } from 'lucide-react'
import { useState } from 'react'
import { useMeetingChatContext, useMeetingRoomContext } from '@/components/meeting/MeetingContext'

/** Shows a banner when a moderator asks the user to unmute or enable camera. */
export function AskActionBanner() {
  const { systemMessages } = useMeetingChatContext()
  const { currentUserId } = useMeetingRoomContext()
  const [dismissed, setDismissed] = useState<number>(0)

  const lastAsk = [...systemMessages]
    .reverse()
    .find((m) => (m.event === 'ask_unmute' || m.event === 'ask_camera') && m.target === currentUserId)

  if (!lastAsk || lastAsk.ts <= dismissed) return null

  const isUnmute = lastAsk.event === 'ask_unmute'

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        background: 'rgba(15,15,30,0.95)',
        border: '1px solid rgba(99,102,241,0.4)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(16px)',
        maxWidth: 'min(340px, calc(100vw - 32px))',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isUnmute ? <Mic size={15} style={{ color: '#a5b4fc' }} /> : <Video size={15} style={{ color: '#a5b4fc' }} />}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, flex: 1 }}>
        {isUnmute ? 'A moderator is asking you to unmute.' : 'A moderator is asking you to turn on your camera.'}
      </span>
      <button
        onClick={() => setDismissed(lastAsk.ts)}
        style={{
          background: 'none',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.3)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
