import { MessageSquare, X } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import type { ChatAttachment } from '#/components/meeting/MeetingContext'
import { useMeetingChatContext, useMeetingRoomContext } from '#/components/meeting/MeetingContext'
import { ChatInput, type ChatInputHandle } from './chat/ChatInput'
import { ChatMessageList } from './chat/ChatMessageList'

interface Props {
  onClose: () => void
}

const panel: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  width: 'min(320px, 100vw)',
  zIndex: 30,
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(10,10,22,0.94)',
  backdropFilter: 'blur(24px)',
  borderLeft: '1px solid rgba(255,255,255,0.07)',
  paddingTop: 'env(safe-area-inset-top, 0px)',
  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))',
}

export function ChatPanel({ onClose }: Props) {
  const { roomId } = useMeetingRoomContext()
  const { chatMessages, systemMessages, sendChat, markRead } = useMeetingChatContext()
  const inputRef = useRef<ChatInputHandle>(null)
  const noop = useCallback(() => {}, [])

  useEffect(() => {
    markRead()
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [markRead])

  const uploadAndSend = useCallback(
    async (file: File): Promise<ChatAttachment> => {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/room/${roomId}/chat/upload`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `Upload failed (${res.status})`)
      }
      return res.json() as Promise<ChatAttachment>
    },
    [roomId],
  )

  return (
    <aside className="meet-panel" style={panel}>
      {/* Header */}
      <div
        style={{
          height: 52,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <MessageSquare size={14} style={{ color: 'color-mix(in oklab, var(--sky-300) 70%, transparent)' }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>Chat</span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer',
          }}
          aria-label="Close chat"
        >
          <X size={15} />
        </button>
      </div>

      {/* Message list */}
      <ChatMessageList
        chatMessages={chatMessages}
        systemMessages={systemMessages}
        onScrollUnreadChange={noop}
        onDrop={(file) => {
          void uploadAndSend(file).then((att) => sendChat('', [att]))
        }}
      />

      {/* Input */}
      <ChatInput ref={inputRef} onSend={sendChat} onUpload={uploadAndSend} />
    </aside>
  )
}
