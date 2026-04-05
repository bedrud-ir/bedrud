import { useEffect, useRef, useState } from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users, Volume2, Mic2, Check, MonitorUp, MonitorOff } from 'lucide-react'
import { DeviceSelector } from '@/components/meeting/DeviceSelector'
import { useAudioPreferencesStore, type NoiseSuppressionMode } from '#/lib/audio-preferences.store'
import { useAuthStore } from '#/lib/auth.store'
import { AudioProcessorService } from '#/lib/audio-processor.service'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  onToggleChat: () => void
  onToggleParticipants: () => void
  onLeave: () => void
  chatOpen: boolean
  participantsOpen: boolean
  unreadCount?: number
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

const NOISE_MODES: { value: NoiseSuppressionMode; label: string }[] = [
  { value: 'none',    label: 'Off (RAW)' },
  { value: 'browser', label: 'Browser built-in' },
  { value: 'rnnoise', label: 'RNNoise' },
  { value: 'krisp',   label: 'Krisp AI' },
]
const MODE_LABELS: Record<NoiseSuppressionMode, string> = {
  none:    'Noise suppression: Off',
  browser: 'Noise suppression: Browser',
  rnnoise: 'Noise suppression: RNNoise',
  krisp:   'Noise suppression: Krisp AI',
}

/* ── Tooltip-wrapped control button ────────────────────────────────────────── */
function CtrlBtn({
  tip,
  style,
  onClick,
  children,
}: {
  tip: string
  style: React.CSSProperties
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={onClick} style={style} aria-label={tip}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {tip}
      </TooltipContent>
    </Tooltip>
  )
}

export function ControlsBar({ onToggleChat, onToggleParticipants, onLeave, chatOpen, participantsOpen, unreadCount = 0 }: Props) {
  const { localParticipant } = useLocalParticipant()
  const micEnabled = localParticipant?.isMicrophoneEnabled ?? false
  const camEnabled = localParticipant?.isCameraEnabled ?? false
  const isScreenShareEnabled = localParticipant?.isScreenShareEnabled ?? false
  const tokens    = useAuthStore((s) => s.tokens)
  const canShare  = Boolean(tokens) && Boolean(navigator.mediaDevices?.getDisplayMedia)
  const shareTip  = !tokens
    ? 'Sign in to share screen'
    : !navigator.mediaDevices?.getDisplayMedia
      ? 'Screen sharing not supported on this device'
      : isScreenShareEnabled
        ? 'Stop sharing'
        : 'Share screen'

  const noiseMode = useAudioPreferencesStore((s) => s.noiseSuppressionMode)
  const setMode   = useAudioPreferencesStore((s) => s.setMode)

  const pttActiveRef   = useRef(false)
  const pttInitMicRef  = useRef(false)
  const [pttInitMic, setPttInitMic] = useState(false)
  const [pttVisible, setPttVisible] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || e.repeat || pttActiveRef.current) return
      const tgt = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tgt.tagName) || tgt.isContentEditable) return
      if (!localParticipant) return
      pttActiveRef.current  = true
      pttInitMicRef.current = localParticipant.isMicrophoneEnabled
      setPttInitMic(localParticipant.isMicrophoneEnabled)
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
    <TooltipProvider delayDuration={300}>
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
          {pttInitMic ? 'Push-to-Mute active' : 'Push-to-Talk active'}
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
          <CtrlBtn
            tip={micEnabled ? 'Mute (Space)' : 'Unmute (Space)'}
            style={iconBtn(false, !micEnabled)}
            onClick={() => localParticipant?.setMicrophoneEnabled(!micEnabled)}
          >
            {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </CtrlBtn>
          <DeviceSelector kind="audioinput" />
        </div>

        {/* ── Camera + device caret ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: 2 }}>
          <CtrlBtn
            tip={camEnabled ? 'Disable camera' : 'Enable camera'}
            style={iconBtn(false, !camEnabled)}
            onClick={() => localParticipant?.setCameraEnabled(!camEnabled)}
          >
            {camEnabled ? <Video size={18} /> : <VideoOff size={18} />}
          </CtrlBtn>
          <DeviceSelector kind="videoinput" />
        </div>

        {/* ── Noise suppression dropdown ── */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button style={iconBtn(noiseMode !== 'none')} aria-label={MODE_LABELS[noiseMode]}>
                  <Mic2 size={17} />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>{MODE_LABELS[noiseMode]}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="top" align="center" sideOffset={12}
            style={{ minWidth: 180, background: 'rgba(18,18,30,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
            {NOISE_MODES.map(({ value, label }) => {
              const disabled = value === 'krisp' && !AudioProcessorService.isKrispSupported()
              return (
                <DropdownMenuItem
                  key={value}
                  disabled={disabled}
                  onSelect={() => setMode(value)}
                  style={{ borderRadius: 8, gap: 10, cursor: disabled ? 'not-allowed' : 'pointer' }}
                >
                  <Check size={13} style={{ opacity: noiseMode === value ? 1 : 0, color: '#a5b4fc', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
                  {disabled && (
                    <span style={{ fontSize: 10, color: '#f87171', background: 'rgba(239,68,68,0.15)', borderRadius: 4, padding: '1px 5px' }}>
                      N/A
                    </span>
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Screen share ── */}
        <CtrlBtn
          tip={shareTip}
          style={{ ...iconBtn(false, isScreenShareEnabled), opacity: canShare ? 1 : 0.4, cursor: canShare ? 'pointer' : 'not-allowed' }}
          onClick={canShare ? () => localParticipant?.setScreenShareEnabled(!isScreenShareEnabled) : undefined}
        >
          {isScreenShareEnabled ? <MonitorOff size={17} /> : <MonitorUp size={17} />}
        </CtrlBtn>

        <div style={divider} />

        {/* ── Leave button ── */}
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            Leave meeting
          </TooltipContent>
        </Tooltip>

        <div style={divider} />

        {/* ── Speaker + Chat + Participants ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CtrlBtn tip="Select speaker output" style={iconBtn()}>
              <Volume2 size={17} />
            </CtrlBtn>
            <DeviceSelector kind="audiooutput" />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleChat}
                style={{ ...iconBtn(chatOpen), position: 'relative' }}
                aria-label={chatOpen ? 'Close chat' : 'Open chat'}
              >
                <MessageSquare size={17} />
                {unreadCount > 0 && !chatOpen && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    minWidth: 14, height: 14, borderRadius: 7,
                    background: '#6366f1', color: 'white',
                    fontSize: 9, fontWeight: 700, lineHeight: '14px',
                    textAlign: 'center', padding: '0 3px',
                    pointerEvents: 'none',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {chatOpen ? 'Close chat' : unreadCount > 0 ? `Chat (${unreadCount} unread)` : 'Open chat'}
            </TooltipContent>
          </Tooltip>

          <CtrlBtn
            tip={participantsOpen ? 'Close participants' : 'Show participants'}
            style={iconBtn(participantsOpen)}
            onClick={onToggleParticipants}
          >
            <Users size={17} />
          </CtrlBtn>
        </div>
      </div>
    </TooltipProvider>
  )
}
