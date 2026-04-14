import { MessageSquare } from 'lucide-react'
import { type DragEvent, useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, SystemMessage } from '../MeetingContext'
import { ChatMessageCluster } from './ChatMessageCluster'
import { ChatScrollManager } from './ChatScrollManager'
import { groupMessages } from './chatGrouping'

interface Props {
  chatMessages: ChatMessage[]
  systemMessages: SystemMessage[]
  onScrollUnreadChange: (n: number) => void
  onDrop: (file: File) => void
}

export function ChatMessageList({ chatMessages, systemMessages, onScrollUnreadChange, onDrop }: Props) {
  const messagesRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoFollowRef = useRef(true)
  const prevCountRef = useRef(0)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [scrollUnread, setScrollUnread] = useState(0)

  const handleScroll = useCallback(() => {
    const el = messagesRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    autoFollowRef.current = atBottom
    setShowScrollBtn(!atBottom)
    if (atBottom) {
      setScrollUnread(0)
      onScrollUnreadChange(0)
    }
  }, [onScrollUnreadChange])

  const totalCount = chatMessages.length + systemMessages.length

  useEffect(() => {
    const delta = totalCount - prevCountRef.current
    if (delta <= 0) return
    prevCountRef.current = totalCount
    if (autoFollowRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setScrollUnread((n) => {
        const next = n + delta
        onScrollUnreadChange(next)
        return next
      })
    }
  }, [totalCount, onScrollUnreadChange])

  const scrollToBottom = useCallback(() => {
    autoFollowRef.current = true
    setShowScrollBtn(false)
    setScrollUnread(0)
    onScrollUnreadChange(0)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [onScrollUnreadChange])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
      if (file) onDrop(file)
    },
    [onDrop],
  )

  const items = groupMessages(chatMessages, systemMessages)

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <div
        ref={messagesRef}
        onScroll={handleScroll}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={18} style={{ color: 'rgba(99,102,241,0.5)' }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12, textAlign: 'center' }}>
              No messages yet.
              <br />
              Say hello!
            </p>
          </div>
        ) : (
          items.map((item, i) => {
            if (item.kind === 'date-separator') {
              return (
                <div key={`sep-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>{item.label}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )
            }

            if (item.kind === 'system') {
              const label = item.msg.event === 'kick' ? 'was kicked by' : 'was banned by'
              return (
                <div key={`sys-${i}`} style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 20,
                      padding: '3px 10px',
                      fontStyle: 'italic',
                    }}
                  >
                    {item.msg.target} {label} {item.msg.actor}
                  </span>
                </div>
              )
            }

            return <ChatMessageCluster key={`cluster-${i}`} cluster={item} />
          })
        )}
        <div ref={bottomRef} />
      </div>

      <ChatScrollManager show={showScrollBtn} unreadCount={scrollUnread} onScrollToBottom={scrollToBottom} />
    </div>
  )
}
