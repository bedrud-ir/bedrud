import { ArrowDown } from 'lucide-react'

interface Props {
  show: boolean
  unreadCount: number
  onScrollToBottom: () => void
}

export function ChatScrollManager({ show, unreadCount, onScrollToBottom }: Props) {
  if (!show) return null

  const label = unreadCount === 1 ? '↑ 1 new message' : `↑ ${unreadCount} new messages`

  return (
    <>
      {/* Inline banner — pill centered just above the input */}
      {unreadCount > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(88px + env(safe-area-inset-bottom, 0px) + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 6,
          }}
        >
          <button
            type="button"
            onClick={onScrollToBottom}
            style={{
              background: 'rgba(99,102,241,0.85)',
              border: 'none',
              borderRadius: 20,
              padding: '5px 14px',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {label}
          </button>
        </div>
      )}

      {/* Floating ↓ button */}
      <button
        type="button"
        onClick={onScrollToBottom}
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
        {unreadCount > 0 && (
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
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  )
}
