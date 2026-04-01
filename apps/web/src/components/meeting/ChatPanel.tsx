import { useEffect, useRef, useState } from 'react'
import { useChat, useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'
import { X, Send, MessageSquare } from 'lucide-react'

interface Props {
  onClose: () => void
}

interface SystemMessage {
  type: 'system'
  event: 'kick' | 'ban'
  actor: string
  target: string
  ts: number
}

const panel: React.CSSProperties = {
  position: 'absolute', right: 0, top: 0, bottom: 0,
  width: 320, zIndex: 30,
  display: 'flex', flexDirection: 'column',
  background: 'rgba(10,10,22,0.94)',
  backdropFilter: 'blur(24px)',
  borderLeft: '1px solid rgba(255,255,255,0.07)',
}

export function ChatPanel({ onClose }: Props) {
  const { chatMessages, send, isSending } = useChat()
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [draft, setDraft] = useState('')
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Listen for system data messages (kick/ban events)
  useEffect(() => {
    const handler = (payload: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
      if (topic !== 'system') return
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload)) as SystemMessage
        if (msg.type === 'system') {
          setSystemMessages((prev) => [...prev, { ...msg, ts: Date.now() }])
        }
      } catch { /* ignore malformed */ }
    }
    room.on(RoomEvent.DataReceived, handler)
    return () => { room.off(RoomEvent.DataReceived, handler) }
  }, [room])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, systemMessages])

  async function handleSend(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || isSending) return
    await send(text)
    setDraft('')
  }

  // Merge chat and system messages by timestamp for ordered display
  type DisplayItem =
    | { kind: 'chat'; msg: (typeof chatMessages)[number]; idx: number }
    | { kind: 'system'; msg: SystemMessage }

  const items: DisplayItem[] = [
    ...chatMessages.map((msg, idx) => ({ kind: 'chat' as const, msg, idx })),
    ...systemMessages.map((msg) => ({ kind: 'system' as const, msg })),
  ].sort((a, b) => {
    const ta = a.kind === 'chat' ? a.msg.timestamp : a.msg.ts
    const tb = b.kind === 'chat' ? b.msg.timestamp : b.msg.ts
    return ta - tb
  })

  return (
    <aside className="meet-panel" style={panel}>
      {/* Header */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <MessageSquare size={14} style={{ color: 'rgba(165,180,252,0.7)' }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>Chat</span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          aria-label="Close chat"
        >
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={18} style={{ color: 'rgba(99,102,241,0.5)' }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12, textAlign: 'center' }}>
              No messages yet.<br />Say hello!
            </p>
          </div>
        ) : (
          items.map((item, i) => {
            if (item.kind === 'system') {
              const label = item.msg.event === 'kick' ? 'was kicked by' : 'was banned by'
              return (
                <div key={`sys-${i}`} style={{
                  display: 'flex', justifyContent: 'center',
                  padding: '2px 0',
                }}>
                  <span style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20, padding: '3px 10px',
                    fontStyle: 'italic',
                  }}>
                    {item.msg.target} {label} {item.msg.actor}
                  </span>
                </div>
              )
            }

            const msg = item.msg
            const isLocal = msg.from?.identity === localParticipant?.identity
            return (
              <div key={`chat-${item.idx}`} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isLocal ? 'flex-end' : 'flex-start',
                gap: 3,
              }}>
                {!isLocal && (
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, paddingLeft: 4 }}>
                    {msg.from?.name ?? msg.from?.identity}
                  </span>
                )}
                <div style={{
                  maxWidth: '82%',
                  padding: '7px 12px',
                  borderRadius: isLocal ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: isLocal
                    ? 'rgba(99,102,241,0.75)'
                    : 'rgba(255,255,255,0.07)',
                  border: isLocal
                    ? '1px solid rgba(165,180,252,0.25)'
                    : '1px solid rgba(255,255,255,0.06)',
                  color: isLocal ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
                  fontSize: 13, lineHeight: 1.45,
                  wordBreak: 'break-word',
                }}>
                  {msg.message}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            disabled={isSending}
            style={{
              flex: 1, height: 36,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10, padding: '0 12px',
              color: 'rgba(255,255,255,0.85)', fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSending}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: draft.trim() ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.06)',
              color: draft.trim() ? 'white' : 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: draft.trim() ? 'pointer' : 'default',
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
            }}
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </aside>
  )
}
