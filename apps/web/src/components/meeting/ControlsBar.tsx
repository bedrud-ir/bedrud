import { useEffect, useRef, useState } from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users, Volume2 } from 'lucide-react'
import { DeviceSelector } from '@/components/meeting/DeviceSelector'

interface Props {
  onToggleChat: () => void
  onToggleParticipants: () => void
  onLeave: () => void
  chatOpen: boolean
  participantsOpen: boolean
}

// Shared icon-button style
const iconBtn = (active = false, danger = false): React.CSSProperties => ({
  width: 44, height: 44, borderRadius: 12,
  border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: danger
    ? 'rgba(239,68,68,0.18)'
    : active
      ? 'rgba(99,102,241,0.25)'
      : 'rgba(255,255,255,0.07)',
  color: danger ? '#f87171' : active ? '#a5b4fc' : 'rgba(255,255,255,0.75)',
  transition: 'background 0.15s, color 0.15s, transform 0.1s',
})

const divider: React.CSSProperties = {
  width: 1, height: 28,
  background: 'rgba(255,255,255,0.08)',
  margin: '0 4px',
  flexShrink: 0,
}

export function ControlsBar({ onToggleChat, onToggleParticipants, onLeave, chatOpen, participantsOpen }: Props) {
  const { localParticipant } = useLocalParticipant()
  const micEnabled = localParticipant?.isMicrophoneEnabled ?? false
  const camEnabled = localParticipant?.isCameraEnabled ?? false

  const pttActiveRef   = useRef(false)
  const pttInitMicRef  = useRef(false)
  const [pttVisible, setPttVisible] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || e.repeat || pttActiveRef.current) return
      const tgt = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tgt.tagName) || tgt.isContentEditable) return
      if (!localParticipant) return
      pttActiveRef.current  = true
      pttInitMicRef.current = localParticipant.isMicrophoneEnabled
      localParticipant.setMicrophoneEnabled(!pttInitMicRef.current)
      setPttVisible(true)
      e.preventDefault()
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.code !== 'Space' || !pttActiveRef.current) return
      pttActiveRef.current = false
      localParticipant?.setMicrophoneEnabled(pttInitMicRef.current)
      setPttVisible(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [localParticipant])

  return (
    <>
      {/* Push-to-talk badge */}
      {pttVisible && (
        <div
          className="meet-ptt"
          style={{
            position: 'fixed', bottom: 80, left: '50%',
            zIndex: 50,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(99,102,241,0.9)',
            border: '1px solid rgba(165,180,252,0.4)',
            borderRadius: 24, padding: '7px 16px',
            color: 'white', fontSize: 12, fontWeight: 600,
            boxShadow: '0 4px 24px rgba(99,102,241,0.5)',
          }}
        >
          <Mic size={13} />
          {pttInitMicRef.current ? 'Push-to-Mute active' : 'Push-to-Talk active'}
        </div>
      )}

      {/* Floating controls pill */}
      <div
        style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 3,
          background: 'rgba(12,12,22,0.88)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, padding: '8px 10px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset',
          zIndex: 30,
          whiteSpace: 'nowrap',
        }}
      >
        {/* ── Mic + device caret ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <button
            onClick={() => localParticipant?.setMicrophoneEnabled(!micEnabled)}
            style={iconBtn(false, !micEnabled)}
            title={micEnabled ? 'Mute (Space)' : 'Unmute (Space)'}
            aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <DeviceSelector kind="audioinput" />
        </div>

        {/* ── Camera + device caret ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: 2 }}>
          <button
            onClick={() => localParticipant?.setCameraEnabled(!camEnabled)}
            style={iconBtn(false, !camEnabled)}
            title={camEnabled ? 'Disable camera' : 'Enable camera'}
            aria-label={camEnabled ? 'Disable camera' : 'Enable camera'}
          >
            {camEnabled ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
          <DeviceSelector kind="videoinput" />
        </div>

        <div style={divider} />

        {/* ── Leave button ── */}
        <button
          onClick={onLeave}
          style={{
            height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
            padding: '0 18px', marginLeft: 2, marginRight: 2,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(239,68,68,0.82)',
            color: 'white', fontSize: 13, fontWeight: 600,
            boxShadow: '0 2px 12px rgba(239,68,68,0.35)',
            transition: 'background 0.15s, box-shadow 0.15s',
          }}
          aria-label="Leave meeting"
        >
          <PhoneOff size={16} />
          Leave
        </button>

        <div style={divider} />

        {/* ── Speaker + Chat + Participants ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <button
              style={iconBtn()}
              title="Audio output"
              aria-label="Select speaker output"
            >
              <Volume2 size={17} />
            </button>
            <DeviceSelector kind="audiooutput" />
          </div>

          <button
            onClick={onToggleChat}
            style={iconBtn(chatOpen)}
            title="Chat"
            aria-label={chatOpen ? 'Close chat' : 'Open chat'}
          >
            <MessageSquare size={17} />
          </button>

          <button
            onClick={onToggleParticipants}
            style={iconBtn(participantsOpen)}
            title="Participants"
            aria-label={participantsOpen ? 'Close participants' : 'Open participants'}
          >
            <Users size={17} />
          </button>
        </div>
      </div>
    </>
  )
}
