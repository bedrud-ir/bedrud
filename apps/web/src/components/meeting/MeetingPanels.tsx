import { useParticipants } from '@livekit/components-react'
import { MessageSquare, Users } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { ChatToastNotifier } from '@/components/meeting/ChatToastNotifier'
import { useMeetingChatContext } from '@/components/meeting/MeetingContext'
import { MeetingControls } from '@/components/meeting/MeetingControls'

// Lazy-loaded panels: only fetched when the user opens them.
const ChatPanel = lazy(() => import('@/components/meeting/ChatPanel').then((m) => ({ default: m.ChatPanel })))
const ParticipantsList = lazy(() =>
  import('@/components/meeting/ParticipantsList').then((m) => ({ default: m.ParticipantsList })),
)

interface MeetingPanelsProps {
  navigate: () => void
}

/** Manages side panels (chat, participants), their toggle buttons, toast notifications, and controls. */
export function MeetingPanels({ navigate }: MeetingPanelsProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const [participantsOpen, setParticipantsOpen] = useState(false)

  const toggleChat = () => {
    setChatOpen((o) => !o)
    setParticipantsOpen(false)
  }
  const toggleParticipants = () => {
    setParticipantsOpen((o) => !o)
    setChatOpen(false)
  }

  return (
    <>
      {/* Top-left: Participants button */}
      <ParticipantsToggle isOpen={participantsOpen} onToggle={toggleParticipants} />

      {/* Top-right: Chat button */}
      <ChatToggle isOpen={chatOpen} onToggle={toggleChat} />

      {participantsOpen && !chatOpen && (
        <Suspense fallback={null}>
          <ParticipantsList onClose={() => setParticipantsOpen(false)} />
        </Suspense>
      )}
      {chatOpen && (
        <Suspense fallback={null}>
          <ChatPanel onClose={() => setChatOpen(false)} />
        </Suspense>
      )}
      <ChatToastNotifier chatOpen={chatOpen} />
      <MeetingControls onNavigate={navigate} />
    </>
  )
}

/* ── Top-left: Participants toggle button ─────────────────────── */

function ParticipantsToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const participants = useParticipants()
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'absolute',
        top: 'calc(14px + env(safe-area-inset-top, 0px))',
        left: 'calc(14px + env(safe-area-inset-left, 0px))',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: isOpen ? 'rgba(99,102,241,0.25)' : 'rgba(12,12,22,0.7)',
        border: `1px solid ${isOpen ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        padding: '7px 12px',
        color: isOpen ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.15s',
      }}
      aria-label={isOpen ? 'Close participants' : 'Show participants'}
    >
      <Users size={14} />
      <span>{participants.length}</span>
    </button>
  )
}

/* ── Top-right: Chat toggle button ────────────────────────────── */

function ChatToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { unreadCount } = useMeetingChatContext()
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'absolute',
        top: 'calc(14px + env(safe-area-inset-top, 0px))',
        right: 'calc(14px + env(safe-area-inset-right, 0px))',
        zIndex: 25,
        width: 38,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isOpen ? 'rgba(99,102,241,0.25)' : 'rgba(12,12,22,0.7)',
        border: `1px solid ${isOpen ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        cursor: 'pointer',
        color: isOpen ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.15s',
      }}
      aria-label={isOpen ? 'Close chat' : `Open chat${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <MessageSquare size={16} />
      {unreadCount > 0 && !isOpen && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            background: '#6366f1',
            color: 'white',
            fontSize: 9,
            fontWeight: 700,
            lineHeight: '16px',
            textAlign: 'center',
            padding: '0 4px',
            pointerEvents: 'none',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
