import { ArrowDown, Image, MessageSquare, Send, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type ChatAttachment, useMeetingContext } from '@/components/meeting/MeetingContext'

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
    p: ({ children }) => <p style={{ margin: 0, lineHeight: 1.45 }}>{children}</p>,
    code: ({ children, className }) => {
      const isBlock = Boolean(className)
      return isBlock ? (
        <pre
          style={{
            margin: '4px 0',
            padding: '6px 9px',
            borderRadius: 6,
            background: codeBackground,
            overflowX: 'auto',
            fontSize: 12,
          }}
        >
          <code>{children}</code>
        </pre>
      ) : (
        <code
          style={{
            background: codeBackground,
            borderRadius: 4,
            padding: '1px 5px',
            fontSize: 12,
          }}
        >
          {children}
        </code>
      )
    },
    ul: ({ children }) => <ul style={{ margin: '2px 0', paddingLeft: 18 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ margin: '2px 0', paddingLeft: 18 }}>{children}</ol>,
    li: ({ children }) => <li style={{ lineHeight: 1.45 }}>{children}</li>,
    strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
    em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
    blockquote: ({ children }) => (
      <blockquote
        style={{
          margin: '4px 0',
          paddingLeft: 10,
          borderLeft: `2px solid ${isLocal ? 'rgba(255,255,255,0.4)' : 'rgba(165,180,252,0.4)'}`,
          color: isLocal ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)',
        }}
      >
        {children}
      </blockquote>
    ),
    h1: ({ children }) => <strong style={{ fontSize: 15 }}>{children}</strong>,
    h2: ({ children }) => <strong style={{ fontSize: 14 }}>{children}</strong>,
    h3: ({ children }) => <strong style={{ fontSize: 13 }}>{children}</strong>,
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
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
  paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
}

export function ChatPanel({ onClose }: Props) {
  const { roomId, chatMessages, systemMessages, sendChat, markRead } = useMeetingContext()
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoFollowRef = useRef(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  // unread messages that arrived while user scrolled up
  const [scrollUnread, setScrollUnread] = useState(0)
  const prevMsgCountRef = useRef(0)

  // Mark all messages as read when the panel opens + focus input
  useEffect(() => {
    markRead()
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [markRead])

  // Track scroll position to decide whether auto-follow is active
  const handleScroll = useCallback(() => {
    const el = messagesRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    autoFollowRef.current = atBottom
    setShowScrollBtn(!atBottom)
    if (atBottom) setScrollUnread(0)
  }, [])

  // Auto-follow: scroll to bottom when new messages arrive (if following)
  const totalMessages = chatMessages.length + systemMessages.length
  useEffect(() => {
    const newCount = chatMessages.length + systemMessages.length
    const delta = newCount - prevMsgCountRef.current
    if (delta <= 0) return
    prevMsgCountRef.current = newCount

    if (autoFollowRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setScrollUnread((n) => n + delta)
    }
  }, [totalMessages]) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = useCallback(() => {
    autoFollowRef.current = true
    setShowScrollBtn(false)
    setScrollUnread(0)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  async function handleSend(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = draft.trim()
    if (!text && !uploading) return
    setSendError(null)
    sendChat(text)
    setDraft('')
    // Sending snaps to bottom
    autoFollowRef.current = true
    setShowScrollBtn(false)
    setScrollUnread(0)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
  }

  // Upload an image file and send it as an attachment
  const uploadAndSend = useCallback(
    async (file: File) => {
      setUploadError(null)
      setUploading(true)

      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`/api/room/${roomId}/chat/upload`, {
          method: 'POST',
          body: form,
          // JWT cookie is sent automatically (cookie-based auth from recent auth commit)
          credentials: 'include',
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error((body as { error?: string }).error ?? `Upload failed (${res.status})`)
        }
        const attachment = (await res.json()) as ChatAttachment
        sendChat(draft.trim(), [attachment])
        setDraft('')
        autoFollowRef.current = true
        setShowScrollBtn(false)
        setScrollUnread(0)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [roomId, draft, sendChat],
  )

  // Paste handler: intercept images pasted into the input
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const items = Array.from(e.clipboardData.items)
      const imageItem = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'))
      if (!imageItem) return
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) uploadAndSend(file)
    },
    [uploadAndSend],
  )

  // Drag-and-drop onto the messages area
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
      if (file) uploadAndSend(file)
    },
    [uploadAndSend],
  )

  // File-picker button handler
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) uploadAndSend(file)
      // Reset so the same file can be picked again
      e.target.value = ''
    },
    [uploadAndSend],
  )

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
          <MessageSquare size={14} style={{ color: 'rgba(165,180,252,0.7)' }} />
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
            transition: 'background 0.15s, color 0.15s',
          }}
          aria-label="Close chat"
        >
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        onScroll={handleScroll}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          position: 'relative',
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

            const msg = item.msg
            const isLocal = msg.isLocal
            return (
              <div
                key={`chat-${item.idx}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isLocal ? 'flex-end' : 'flex-start',
                  gap: 3,
                }}
              >
                {!isLocal && (
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, paddingLeft: 4 }}>
                    {msg.senderName}
                  </span>
                )}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: msg.attachments.length > 0 && !msg.message ? '4px' : '7px 12px',
                    borderRadius: isLocal ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isLocal ? 'rgba(99,102,241,0.75)' : 'rgba(255,255,255,0.07)',
                    border: isLocal ? '1px solid rgba(165,180,252,0.25)' : '1px solid rgba(255,255,255,0.06)',
                    color: isLocal ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
                    fontSize: 13,
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                  }}
                >
                  {/* Image attachments */}
                  {msg.attachments.map((att, ai) =>
                    att.kind === 'image' ? (
                      <a key={ai} href={att.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={att.url}
                          alt="shared image"
                          loading="lazy"
                          style={{
                            display: 'block',
                            maxWidth: '100%',
                            maxHeight: 240,
                            borderRadius: 10,
                            objectFit: 'contain',
                          }}
                        />
                      </a>
                    ) : null,
                  )}
                  {/* Text content */}
                  {msg.message && (
                    <div style={{ padding: msg.attachments.length > 0 ? '6px 8px 2px' : '0' }}>
                      <ChatMarkdown content={msg.message} isLocal={isLocal} />
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom floating button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to latest messages"
          style={{
            position: 'absolute',
            bottom: 'calc(88px + env(safe-area-inset-bottom, 0px) + 56px)',
            right: 14,
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(30,30,50,0.92)',
            color: 'rgba(165,180,252,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            zIndex: 5,
          }}
        >
          <ArrowDown size={14} />
          {scrollUnread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                background: 'rgba(99,102,241,0.9)',
                color: 'white',
                fontSize: 9,
                fontWeight: 700,
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {scrollUnread > 9 ? '9+' : scrollUnread}
            </span>
          )}
        </button>
      )}

      {/* Input */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px' }}>
        {(sendError || uploadError) && (
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(248,113,113,0.9)' }}>{sendError || uploadError}</p>
        )}
        {uploading && (
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(165,180,252,0.7)' }}>Uploading image…</p>
        )}
        {/* Hidden file input for the image-picker button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Attach image button */}
          <button
            type="button"
            onClick={handlePickFile}
            disabled={uploading}
            title="Attach image"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.09)',
              background: 'rgba(255,255,255,0.04)',
              color: uploading ? 'rgba(255,255,255,0.15)' : 'rgba(165,180,252,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploading ? 'default' : 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
            aria-label="Attach image"
          >
            <Image size={14} />
          </button>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={handlePaste}
            placeholder="Type or paste an image…"
            disabled={uploading}
            style={{
              flex: 1,
              height: 36,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10,
              padding: '0 12px',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={(!draft.trim() && !uploading) || uploading}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: draft.trim() ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.06)',
              color: draft.trim() ? 'white' : 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
