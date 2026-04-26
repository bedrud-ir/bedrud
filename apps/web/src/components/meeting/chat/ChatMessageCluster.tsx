import { type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ClusterGroup } from './chatGrouping'
import { absoluteTime, avatarColor, avatarInitials, relativeTime } from './chatGrouping'

// Telegram-style radius per bubble position
function bubbleRadius(isLocal: boolean, pos: 'only' | 'first' | 'middle' | 'last'): string {
  if (isLocal) {
    if (pos === 'only' || pos === 'first') return '14px 14px 4px 14px'
    if (pos === 'middle') return '14px 4px 4px 14px'
    return '14px 4px 14px 14px'
  }
  if (pos === 'only' || pos === 'first') return '14px 14px 14px 4px'
  if (pos === 'middle') return '4px 14px 14px 4px'
  return '4px 14px 14px 14px'
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function bubblePosition(idx: number, total: number): 'only' | 'first' | 'middle' | 'last' {
  if (total === 1) return 'only'
  if (idx === 0) return 'first'
  if (idx === total - 1) return 'last'
  return 'middle'
}

function ChatMarkdown({ content, isLocal }: { content: string; isLocal: boolean }) {
  const linkColor = isLocal ? 'rgba(255,255,255,0.9)' : 'rgba(165,180,252,0.9)'
  const codeBg = isLocal ? 'rgba(0,0,0,0.25)' : 'rgba(99,102,241,0.15)'

  type C = { children?: ReactNode }
  type CA = { href?: string; children?: ReactNode }
  type CC = { children?: ReactNode; className?: string }

  const components = {
    a: ({ href, children }: CA) => {
      if (!href || (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('/'))) {
        return <span>{children}</span>
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: linkColor, textDecoration: 'underline', wordBreak: 'break-all' }}
        >
          {children}
        </a>
      )
    },
    p: ({ children }: C) => <p style={{ margin: 0, lineHeight: 1.45 }}>{children}</p>,
    code: ({ children, className }: CC) => {
      const isBlock = Boolean(className)
      return isBlock ? (
        <pre
          style={{
            margin: '4px 0',
            padding: '6px 9px',
            borderRadius: 6,
            background: codeBg,
            overflowX: 'auto',
            fontSize: 12,
          }}
        >
          <code>{children}</code>
        </pre>
      ) : (
        <code style={{ background: codeBg, borderRadius: 4, padding: '1px 5px', fontSize: 12 }}>{children}</code>
      )
    },
    ul: ({ children }: C) => <ul style={{ margin: '2px 0', paddingLeft: 18 }}>{children}</ul>,
    ol: ({ children }: C) => <ol style={{ margin: '2px 0', paddingLeft: 18 }}>{children}</ol>,
    li: ({ children }: C) => <li style={{ lineHeight: 1.45 }}>{children}</li>,
    strong: ({ children }: C) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
    em: ({ children }: C) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
    blockquote: ({ children }: C) => (
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
    h1: ({ children }: C) => <strong style={{ fontSize: 15 }}>{children}</strong>,
    h2: ({ children }: C) => <strong style={{ fontSize: 14 }}>{children}</strong>,
    h3: ({ children }: C) => <strong style={{ fontSize: 13 }}>{children}</strong>,
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}

interface Props {
  cluster: ClusterGroup
}

export function ChatMessageCluster({ cluster }: Props) {
  const { isLocal, sender, identity, messages } = cluster
  const total = messages.length
  const color = avatarColor(identity)
  const initials = avatarInitials(sender)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLocal ? 'flex-end' : 'flex-start',
        gap: 2,
      }}
    >
      {/* Sender name (remote only) */}
      {!isLocal && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, paddingLeft: 36 }}>{sender}</span>}

      {messages.map((msg, idx) => {
        const pos = bubblePosition(idx, total)
        const hasAttachments = msg.attachments.length > 0

        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              flexDirection: isLocal ? 'row-reverse' : 'row',
              width: '100%',
            }}
          >
            {/* Avatar slot — 28px wide on remote side for alignment */}
            {!isLocal && (
              <div style={{ width: 28, flexShrink: 0 }}>
                {(pos === 'only' || pos === 'first') && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.95)',
                      userSelect: 'none',
                    }}
                  >
                    {initials}
                  </div>
                )}
              </div>
            )}

            {/* Bubble */}
            <div
              style={{
                maxWidth: '78%',
                padding: hasAttachments && !msg.message ? '4px' : '7px 12px',
                borderRadius: bubbleRadius(isLocal, pos),
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
              {msg.attachments.map((att, ai) => {
                if (att.kind !== 'image') return null
                if (!isSafeUrl(att.url)) return null
                return (
                  <a key={ai} href={att.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={att.url}
                      alt="attachment"
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
                )
              })}
              {/* Text */}
              {msg.message && (
                <div style={{ padding: hasAttachments ? '6px 8px 2px' : '0' }}>
                  <ChatMarkdown content={msg.message} isLocal={isLocal} />
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Timestamp on last bubble */}
      <span
        title={absoluteTime(messages[total - 1].timestamp)}
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.25)',
          paddingLeft: isLocal ? 0 : 36,
          paddingRight: isLocal ? 2 : 0,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        {relativeTime(messages[total - 1].timestamp)}
      </span>
    </div>
  )
}
