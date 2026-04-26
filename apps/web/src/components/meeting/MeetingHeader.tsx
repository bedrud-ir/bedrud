import { useConnectionState } from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import { Radio } from 'lucide-react'
import { useEffect, useState } from 'react'

interface MeetingHeaderProps {
  meetId: string
}

/** Top-of-screen header showing live indicator, room name, clock, and connection status. */
export function MeetingHeader({ meetId }: MeetingHeaderProps) {
  const state = useConnectionState()
  const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, 10_000)
    return () => clearInterval(id)
  }, [])

  const isConnected = state === ConnectionState.Connected

  return (
    <header
      className="absolute left-0 right-0 top-0 z-20 flex items-center justify-center px-4"
      style={{
        pointerEvents: 'none',
        height: 'calc(56px + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center gap-2.5" style={{ pointerEvents: 'auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(99,102,241,0.18)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: 7,
            padding: '3px 9px',
          }}
        >
          <Radio size={11} style={{ color: '#818cf8' }} />
          <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'monospace' }}>{meetId}</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'monospace' }}>{time}</span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>·</span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: isConnected ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
            border: `1px solid ${isConnected ? 'rgba(34,197,94,0.25)' : 'rgba(234,179,8,0.25)'}`,
            borderRadius: 7,
            padding: '3px 9px',
          }}
        >
          {isConnected ? (
            <span
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}
            />
          ) : (
            <svg className="meet-connecting" width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4" fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="6 4" />
            </svg>
          )}
          <span style={{ color: isConnected ? '#86efac' : '#fde047', fontSize: 11, fontWeight: 500 }}>
            {isConnected ? 'Connected' : state}
          </span>
        </div>
      </div>
    </header>
  )
}
