import { useEffect, useRef, useState } from 'react'
import { useMeetingChatContext } from '@/components/meeting/MeetingContext'

interface ChatToast {
  id: number
  sender: string
  message: string
}

interface ChatToastNotifierProps {
  chatOpen: boolean
}

/** Shows floating toast notifications for new chat messages when the chat panel is closed. */
export function ChatToastNotifier({ chatOpen }: ChatToastNotifierProps) {
  const { chatMessages } = useMeetingChatContext()
  const seenRef = useRef(chatMessages.length)
  const [toasts, setToasts] = useState<ChatToast[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    // On first mount, mark all existing messages as seen without toasting
    seenRef.current = chatMessages.length
  }, [chatMessages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chatMessages.length <= seenRef.current) return
    const newMsgs = chatMessages.slice(seenRef.current)
    seenRef.current = chatMessages.length
    if (chatOpen) return // panel is open — user can see the messages

    newMsgs.forEach((msg) => {
      const id = nextId.current++
      const sender = msg.senderName || 'Someone'
      setToasts((t) => [...t.slice(-3), { id, sender, message: msg.message }])
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
      }, 4500)
    })
  }, [chatMessages, chatOpen])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(68px + env(safe-area-inset-top, 0px))',
        right: 'calc(16px + env(safe-area-inset-right, 0px))',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="chat-toast"
          style={{
            background: 'rgba(15,15,28,0.96)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: 14,
            padding: '13px 16px',
            maxWidth: 'min(340px, calc(100vw - 32px))',
            boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>{toast.sender}</span>
          <span
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.75)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
            }}
          >
            {toast.message}
          </span>
        </div>
      ))}
    </div>
  )
}
