import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { ConnectionState, RoomEvent } from 'livekit-client'
import {
  Check,
  ChevronDown,
  Keyboard,
  Link2,
  Maximize,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  MoreVertical,
  PhoneOff,
  Settings,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type NoiseSuppressionMode, useAudioPreferencesStore } from '#/lib/audio-preferences.store'
import { AudioProcessorService } from '#/lib/audio-processor.service'
import { useAuthStore } from '#/lib/auth.store'
import { DeviceSelector } from '@/components/meeting/DeviceSelector'
import { useMeetingRoomContext } from '@/components/meeting/MeetingContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  onLeave: () => void
}

/* ── Mobile detection ──────────────────────────────────────────────────────── */

function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])
  return mobile
}

/* ── Shared styles ─────────────────────────────────────────────────────────── */

const iconBtn = (active = false, danger = false, size = 44): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: size > 40 ? 12 : 10,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: danger
    ? 'rgba(239,68,68,0.18)'
    : active
      ? 'color-mix(in oklab, var(--primary) 25%, transparent)'
      : 'rgba(255,255,255,0.07)',
  color: danger ? '#f87171' : active ? 'var(--sky-300)' : 'rgba(255,255,255,0.75)',
  transition: 'background 0.15s, color 0.15s',
  flexShrink: 0,
})

const divider: React.CSSProperties = {
  width: 1,
  height: 28,
  background: 'rgba(255,255,255,0.08)',
  margin: '0 4px',
  flexShrink: 0,
}

const darkMenuStyle: React.CSSProperties = {
  minWidth: 240,
  maxWidth: 'calc(100vw - 24px)',
  background: 'rgba(15,15,28,0.98)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  backdropFilter: 'blur(16px)',
}

const menuLabelStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.3)',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '6px 8px 2px',
}

const menuItemStyle: React.CSSProperties = {
  borderRadius: 6,
  gap: 8,
  fontSize: 12,
  color: 'rgba(255,255,255,0.75)',
}

const menuSepStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)' }

const NOISE_MODES: { value: NoiseSuppressionMode; label: string }[] = [
  { value: 'none', label: 'Off' },
  { value: 'browser', label: 'Browser' },
  { value: 'rnnoise', label: 'RNNoise' },
  { value: 'krisp', label: 'Krisp AI' },
]

const STORAGE_KEYS: Record<string, string> = {
  audioinput: 'bedrud_mic_device',
  audiooutput: 'bedrud_speaker_device',
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

/* ── Device list hook (replaces individual DeviceSelector for audio) ──────── */

function useDeviceList(kind: 'audioinput' | 'audiooutput') {
  const room = useRoomContext()
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [activeId, setActiveId] = useState(() => localStorage.getItem(STORAGE_KEYS[kind]) ?? '')

  // Sync activeId from the room's actual active device
  const syncActiveFromRoom = useCallback(() => {
    const actual = room.getActiveDevice(kind)
    if (actual) setActiveId(actual)
  }, [room, kind])

  useEffect(() => {
    const refresh = async () => {
      try {
        const all = await navigator.mediaDevices.enumerateDevices()
        const filtered = all.filter((d) => d.kind === kind)
        setDevices(filtered)
        // After device list refreshes, verify our activeId still exists
        syncActiveFromRoom()
      } catch {
        /* permissions not yet granted */
      }
    }
    refresh()
    navigator.mediaDevices.addEventListener('devicechange', refresh)
    return () => navigator.mediaDevices.removeEventListener('devicechange', refresh)
  }, [kind, syncActiveFromRoom])

  // Restore saved device on room connect, then sync actual active device
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS[kind])

    const applyDevice = async () => {
      if (saved) {
        await room.switchActiveDevice(kind, saved).catch(() => {})
      }
      // Always sync to what the room is actually using (handles fallback)
      syncActiveFromRoom()
    }

    if (room.state === ConnectionState.Connected) {
      applyDevice()
      return
    }
    const handler = () => {
      applyDevice()
    }
    room.once(RoomEvent.Connected, handler)
    return () => {
      room.off(RoomEvent.Connected, handler)
    }
  }, [room, kind, syncActiveFromRoom])

  // Listen for device changes from the room (e.g. system default change)
  useEffect(() => {
    const handler = () => syncActiveFromRoom()
    room.on(RoomEvent.ActiveDeviceChanged, handler)
    return () => {
      room.off(RoomEvent.ActiveDeviceChanged, handler)
    }
  }, [room, syncActiveFromRoom])

  const select = useCallback(
    async (deviceId: string) => {
      await room.switchActiveDevice(kind, deviceId).catch(() => {})
      setActiveId(deviceId)
      localStorage.setItem(STORAGE_KEYS[kind], deviceId)
    },
    [room, kind],
  )

  return { devices, activeId, select }
}

/* ── ControlsBar ──────────────────────────────────────────────────────────── */

export function ControlsBar({ onLeave }: Props) {
  const isMobile = useIsMobile()
  const { localParticipant } = useLocalParticipant()
  const { isSelfDeafened, toggleSelfDeafen } = useMeetingRoomContext()

  const micEnabled = localParticipant?.isMicrophoneEnabled ?? false
  const camEnabled = localParticipant?.isCameraEnabled ?? false
  const isScreenShareEnabled = localParticipant?.isScreenShareEnabled ?? false

  const tokens = useAuthStore((s) => s.tokens)
  const canShare = Boolean(tokens) && Boolean(navigator.mediaDevices?.getDisplayMedia)
  const shareTip = !tokens
    ? 'Sign in to share screen'
    : !navigator.mediaDevices?.getDisplayMedia
      ? 'Screen sharing not supported'
      : isScreenShareEnabled
        ? 'Stop sharing'
        : 'Share screen'

  const noiseMode = useAudioPreferencesStore((s) => s.noiseSuppressionMode)
  const setMode = useAudioPreferencesStore((s) => s.setMode)

  const mics = useDeviceList('audioinput')
  const speakers = useDeviceList('audiooutput')

  // Responsive sizes
  const btnSize = isMobile ? 38 : 44
  const iconSize = isMobile ? 16 : 18
  const iconSizeSm = isMobile ? 15 : 17

  // ── Push-to-talk ──
  const pttActiveRef = useRef(false)
  const pttInitMicRef = useRef(false)
  const [pttInitMic, setPttInitMic] = useState(false)
  const [pttVisible, setPttVisible] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || e.repeat || pttActiveRef.current) return
      const tgt = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tgt.tagName) || tgt.isContentEditable) return
      if (!localParticipant || isSelfDeafened) return
      pttActiveRef.current = true
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
  }, [localParticipant, isSelfDeafened])

  // ── Copy link feedback ──
  const [linkCopied, setLinkCopied] = useState(false)

  return (
    <TooltipProvider delayDuration={300}>
      {/* Push-to-talk badge */}
      {pttVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'color-mix(in oklab, var(--primary) 90%, transparent)',
            border: '1px solid color-mix(in oklab, var(--sky-300) 40%, transparent)',
            borderRadius: 24,
            padding: '7px 16px',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 4px 24px color-mix(in oklab, var(--primary) 50%, transparent)',
          }}
        >
          <Mic size={13} />
          {pttInitMic ? 'Push-to-Mute active' : 'Push-to-Talk active'}
        </div>
      )}

      {/* Floating controls pill */}
      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? 'calc(12px + env(safe-area-inset-bottom, 0px))' : 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 2 : 3,
          background: 'rgba(12,12,22,0.88)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: isMobile ? 16 : 18,
          padding: isMobile ? '6px 8px' : '8px 10px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset',
          zIndex: 30,
          whiteSpace: 'nowrap',
          maxWidth: 'calc(100vw - 16px)',
        }}
      >
        {/* ── Left: Video + Screen Share ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CtrlBtn
            tip={camEnabled ? 'Disable camera' : 'Enable camera'}
            style={iconBtn(false, !camEnabled, btnSize)}
            onClick={() => localParticipant?.setCameraEnabled(!camEnabled)}
          >
            {camEnabled ? <Video size={iconSize} /> : <VideoOff size={iconSize} />}
          </CtrlBtn>
          {!isMobile && <DeviceSelector kind="videoinput" />}
        </div>

        <CtrlBtn
          tip={shareTip}
          style={{
            ...iconBtn(false, isScreenShareEnabled, btnSize),
            opacity: canShare ? 1 : 0.4,
            cursor: canShare ? 'pointer' : 'not-allowed',
          }}
          onClick={canShare ? () => localParticipant?.setScreenShareEnabled(!isScreenShareEnabled) : undefined}
        >
          {isScreenShareEnabled ? <MonitorOff size={iconSizeSm} /> : <MonitorUp size={iconSizeSm} />}
        </CtrlBtn>

        {!isMobile && <div style={divider} />}

        {/* ── Center: Leave ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onLeave}
              style={{
                height: btnSize,
                borderRadius: isMobile ? 10 : 12,
                border: 'none',
                cursor: 'pointer',
                padding: isMobile ? '0 12px' : '0 18px',
                marginLeft: isMobile ? 2 : 2,
                marginRight: isMobile ? 2 : 2,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(239,68,68,0.82)',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 2px 12px rgba(239,68,68,0.35)',
                transition: 'background 0.15s, box-shadow 0.15s',
                flexShrink: 0,
              }}
              aria-label="Leave meeting"
            >
              <PhoneOff size={isMobile ? 15 : 16} />
              {!isMobile && 'Leave'}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            Leave meeting
          </TooltipContent>
        </Tooltip>

        {!isMobile && <div style={divider} />}

        {/* ── Right: Mic + Speaker/Deafen + Combined Audio Dropdown ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CtrlBtn
            tip={isSelfDeafened ? 'Undeafen & Unmute' : micEnabled ? 'Mute (Space)' : 'Unmute (Space)'}
            style={iconBtn(false, !micEnabled || isSelfDeafened, btnSize)}
            onClick={() => {
              if (isSelfDeafened) {
                toggleSelfDeafen()
                return
              }
              localParticipant?.setMicrophoneEnabled(!micEnabled)
            }}
          >
            {micEnabled ? <Mic size={iconSize} /> : <MicOff size={iconSize} />}
          </CtrlBtn>

          <CtrlBtn
            tip={isSelfDeafened ? 'Undeafen' : 'Deafen'}
            style={iconBtn(false, isSelfDeafened, btnSize)}
            onClick={toggleSelfDeafen}
          >
            {isSelfDeafened ? <VolumeX size={iconSizeSm} /> : <Volume2 size={iconSizeSm} />}
          </CtrlBtn>

          {/* Combined audio dropdown: devices + noise mode + settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                style={{
                  width: isMobile ? 20 : 24,
                  height: btnSize,
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                  flexShrink: 0,
                }}
                aria-label="Audio settings"
              >
                <ChevronDown size={isMobile ? 12 : 13} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" sideOffset={12} style={darkMenuStyle}>
              {/* Microphone devices */}
              {mics.devices.length > 0 && (
                <>
                  <DropdownMenuLabel style={menuLabelStyle}>Microphone</DropdownMenuLabel>
                  {mics.devices.map((d, i) => (
                    <DropdownMenuItem key={d.deviceId} onClick={() => mics.select(d.deviceId)} style={menuItemStyle}>
                      <Check
                        size={12}
                        style={{
                          opacity: mics.activeId === d.deviceId ? 1 : 0,
                          color: 'var(--sky-300)',
                          flexShrink: 0,
                        }}
                      />
                      <span className="truncate">{d.label || `Microphone ${i + 1}`}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator style={menuSepStyle} />
                </>
              )}

              {/* Speaker devices */}
              {speakers.devices.length > 0 && (
                <>
                  <DropdownMenuLabel style={menuLabelStyle}>Speaker</DropdownMenuLabel>
                  {speakers.devices.map((d, i) => (
                    <DropdownMenuItem
                      key={d.deviceId}
                      onClick={() => speakers.select(d.deviceId)}
                      style={menuItemStyle}
                    >
                      <Check
                        size={12}
                        style={{
                          opacity: speakers.activeId === d.deviceId ? 1 : 0,
                          color: 'var(--sky-300)',
                          flexShrink: 0,
                        }}
                      />
                      <span className="truncate">{d.label || `Speaker ${i + 1}`}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator style={menuSepStyle} />
                </>
              )}

              {/* Noise suppression */}
              <DropdownMenuLabel style={menuLabelStyle}>Noise Suppression</DropdownMenuLabel>
              {NOISE_MODES.map(({ value, label }) => {
                const disabled = value === 'krisp' && !AudioProcessorService.isKrispSupported()
                return (
                  <DropdownMenuItem
                    key={value}
                    disabled={disabled}
                    onSelect={() => setMode(value)}
                    style={{ ...menuItemStyle, cursor: disabled ? 'not-allowed' : 'pointer' }}
                  >
                    <Check
                      size={12}
                      style={{ opacity: noiseMode === value ? 1 : 0, color: 'var(--sky-300)', flexShrink: 0 }}
                    />
                    <span style={{ flex: 1 }}>{label}</span>
                    {disabled && (
                      <span
                        style={{
                          fontSize: 9,
                          color: '#f87171',
                          background: 'rgba(239,68,68,0.15)',
                          borderRadius: 3,
                          padding: '1px 4px',
                        }}
                      >
                        N/A
                      </span>
                    )}
                  </DropdownMenuItem>
                )
              })}

              <DropdownMenuSeparator style={menuSepStyle} />

              {/* Settings link */}
              <DropdownMenuItem
                onClick={() => window.open('/dashboard/settings/audio', '_blank')}
                style={{ ...menuItemStyle, color: 'rgba(255,255,255,0.5)' }}
              >
                <Settings size={12} style={{ flexShrink: 0 }} />
                Audio settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {!isMobile && <div style={divider} />}

        {/* ── Far right: More options ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              style={{ ...iconBtn(false, false, isMobile ? 34 : 44), width: isMobile ? 34 : 36 }}
              aria-label="More options"
            >
              <MoreVertical size={iconSizeSm} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={12} style={{ ...darkMenuStyle, minWidth: 200 }}>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                setLinkCopied(true)
                setTimeout(() => setLinkCopied(false), 2000)
              }}
              style={menuItemStyle}
            >
              {linkCopied ? (
                <Check size={13} style={{ flexShrink: 0, color: '#34d399' }} />
              ) : (
                <Link2 size={13} style={{ flexShrink: 0 }} />
              )}
              {linkCopied ? 'Copied!' : 'Copy room link'}
            </DropdownMenuItem>

            {typeof document !== 'undefined' && document.fullscreenEnabled && (
              <DropdownMenuItem
                onClick={() => {
                  if (document.fullscreenElement) document.exitFullscreen()
                  else document.documentElement.requestFullscreen()
                }}
                style={menuItemStyle}
              >
                <Maximize size={13} style={{ flexShrink: 0 }} />
                {typeof document !== 'undefined' && document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen'}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator style={menuSepStyle} />

            <DropdownMenuItem disabled style={{ ...menuItemStyle, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              <Keyboard size={12} style={{ flexShrink: 0 }} />
              Space — Push to talk/mute
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  )
}
