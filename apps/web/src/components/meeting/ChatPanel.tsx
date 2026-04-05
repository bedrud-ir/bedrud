import { useEffect, useRef, useState } from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { X, Send, MessageSquare } from 'lucide-react'
import { useMeetingContext } from '@/components/meeting/MeetingContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface Props {
  onClose: () => void
}

function ChatMarkdown({ content, isLocal }: { content: string; isLocal: boolean }) {
  const linkColor = isLocal ? 'rgba(255,255,255,0.9)' : 'rgba(165,180,252,0.9)'
  const codeBackground = isLocal ? 'rgba(0,0,0,0.25)' : 'rgba(99,102,241,0.15)'

  const components: Components = {
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: linkColor, textDecoration: 'underline', wordBreak: 'break-all' }}
      >
        {children}
      </a>
    ),
    p: ({ children }) => (
      <p style={{ margin: 0, lineHeight: 1.45 }}>{children}</p>
    ),
    code: ({ children, className }) => {
      const isBlock = Boolean(className)
      return isBlock ? (
        <pre style={{
          margin: '4px 0', padding: '6px 9px', borderRadius: 6,
          background: codeBackground, overflowX: 'auto', fontSize: 12,
        }}>
          <code>{children}</code>
        </pre>
      ) : (
        <code style={{
          background: codeBackground, borderRadius: 4,
          padding: '1px 5px', fontSize: 12,
        }}>
          {children}
        </code>
      )
    },
    ul: ({ children }) => (
      <ul style={{ margin: '2px 0', paddingLeft: 18 }}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol style={{ margin: '2px 0', paddingLeft: 18 }}>{children}</ol>
    ),
    li: ({ children }) => (
      <li style={{ lineHeight: 1.45 }}>{children}</li>
    ),
    strong: ({ children }) => (
      <strong style={{ fontWeight: 700 }}>{children}</strong>
    ),
    em: ({ children }) => (
      <em style={{ fontStyle: 'italic' }}>{children}</em>
    ),
    blockquote: ({ children }) => (
      <blockquote style={{
        margin: '4px 0', paddingLeft: 10,
        borderLeft: `2px solid ${isLocal ? 'rgba(255,255,255,0.4)' : 'rgba(165,180,252,0.4)'}`,
        color: isLocal ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)',
      }}>
        {children}
      </blockquote>
    ),
    h1: ({ children }) => <strong style={{ fontSize: 15 }}>{children}</strong>,
    h2: ({ children }) => <strong style={{ fontSize: 14 }}>{children}</strong>,
    h3: ({ children }) => <strong style={{ fontSize: 13 }}>{children}</strong>,
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}

const panel: React.CSSProperties = {
  position: 'absolute', right: 0, top: 0, bottom: 0,
  width: 'min(320px, 100vw)', zIndex: 30,
  display: 'flex', flexDirection: 'column',
  background: 'rgba(10,10,22,0.94)',
  backdropFilter: 'blur(24px)',
  borderLeft: '1px solid rgba(255,255,255,0.07)',
  // On mobile the panel fills full height but the input box must clear the controls bar
  // (bottom:20 + ~60px tall) plus device safe-area
  paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
}

export function ChatPanel({ onClose }: Props) {
  const { chatMessages, systemMessages, send, isSending, markRead } = useMeetingContext()
  const { localParticipant } = useLocalParticipant()
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mark all messages as read when the panel opens + focus input
  useEffect(() => {
    markRead()
    // Small delay so the panel animation doesn't fight the focus
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [markRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, systemMessages])

  async function handleSend(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || isSending) return
    setSendError(null)
    try {
      await send(text)
      setDraft('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  // Merge chat and system messages by timestamp for ordered display
  type DisplayItem =
    | { kind: 'chat'; msg: (typeof chatMessages)[number]; idx: number }
    | { kind: 'system'; msg: (typeof systemMessages)[number] }

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
                <div key={`sys-${i}`} style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
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
                  background: isLocal ? 'rgba(99,102,241,0.75)' : 'rgba(255,255,255,0.07)',
                  border: isLocal ? '1px solid rgba(165,180,252,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  color: isLocal ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
                  fontSize: 13, lineHeight: 1.45,
                  wordBreak: 'break-word',
                }}>
                  <ChatMarkdown content={msg.message} isLocal={isLocal} />
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px' }}>
        {sendError && (
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(248,113,113,0.9)' }}>{sendError}</p>
        )}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={inputRef}
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
