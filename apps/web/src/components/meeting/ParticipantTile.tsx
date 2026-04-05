import { useMemo, useState, useEffect, useCallback } from 'react'
import type { RemoteParticipant, Participant } from 'livekit-client'
import { Track, ParticipantEvent } from 'livekit-client'
import { useParticipantInfo, useIsSpeaking, VideoTrack } from '@livekit/components-react'
import { MicOff, Pin } from 'lucide-react'
import { useParticipantOverridesStore, selectVolume } from '#/lib/participant-overrides.store'
import { useLongPress } from '#/lib/useLongPress'
import { ParticipantContextMenu, ParticipantMenuButton } from '@/components/meeting/ParticipantContextMenu'

interface Props {
  participant: Participant
  totalCount: number
  index: number
  isPinned?: boolean
  onTogglePin?: () => void
}

// Unique gradient per participant — determined by name hash
const PALETTES = [
  { tile: 'rgba(99,102,241,0.13)',  avatar: 'linear-gradient(135deg,#6366f1,#8b5cf6)',  glow: 'rgba(99,102,241,0.4)' },
  { tile: 'rgba(6,182,212,0.13)',   avatar: 'linear-gradient(135deg,#06b6d4,#3b82f6)',  glow: 'rgba(6,182,212,0.4)' },
  { tile: 'rgba(236,72,153,0.12)',  avatar: 'linear-gradient(135deg,#ec4899,#f43f5e)',  glow: 'rgba(236,72,153,0.4)' },
  { tile: 'rgba(245,158,11,0.12)',  avatar: 'linear-gradient(135deg,#f59e0b,#ef4444)',  glow: 'rgba(245,158,11,0.4)' },
  { tile: 'rgba(16,185,129,0.12)',  avatar: 'linear-gradient(135deg,#10b981,#06b6d4)',  glow: 'rgba(16,185,129,0.4)' },
  { tile: 'rgba(168,85,247,0.12)',  avatar: 'linear-gradient(135deg,#a855f7,#ec4899)',  glow: 'rgba(168,85,247,0.4)' },
  { tile: 'rgba(14,165,233,0.12)',  avatar: 'linear-gradient(135deg,#0ea5e9,#6366f1)',  glow: 'rgba(14,165,233,0.4)' },
  { tile: 'rgba(244,63,94,0.12)',   avatar: 'linear-gradient(135deg,#f43f5e,#fb923c)',  glow: 'rgba(244,63,94,0.4)' },
]

function getPalette(name: string) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return PALETTES[Math.abs(hash) % PALETTES.length]
}

export function ParticipantTile({ participant, totalCount, index, isPinned = false, onTogglePin }: Props) {
  const { name, identity } = useParticipantInfo({ participant })
  const isSpeaking = useIsSpeaking(participant)

  const volume = useParticipantOverridesStore(selectVolume(identity ?? ''))

  useEffect(() => {
    if (participant.isLocal) return
    const remote = participant as RemoteParticipant
    remote.setVolume(volume)
    return () => {
      remote.setVolume(1)
    }
  }, [participant, volume])

  const noopLongPress = useCallback(() => {
    // No-op: Radix ContextMenu handles contextmenu event natively on mobile long-press
  }, [])
  const longPressHandlers = useLongPress(noopLongPress, 500)

  const [cameraTrack, setCameraTrack] = useState(
    () => participant.getTrackPublication(Track.Source.Camera)
  )
  useEffect(() => {
    const refresh = () => setCameraTrack(participant.getTrackPublication(Track.Source.Camera))
    participant.on(ParticipantEvent.TrackPublished, refresh)
    participant.on(ParticipantEvent.TrackUnpublished, refresh)
    participant.on(ParticipantEvent.TrackMuted, refresh)
    participant.on(ParticipantEvent.TrackUnmuted, refresh)
    participant.on(ParticipantEvent.TrackSubscribed, refresh)
    participant.on(ParticipantEvent.TrackUnsubscribed, refresh)
    return () => {
      participant.off(ParticipantEvent.TrackPublished, refresh)
      participant.off(ParticipantEvent.TrackUnpublished, refresh)
      participant.off(ParticipantEvent.TrackMuted, refresh)
      participant.off(ParticipantEvent.TrackUnmuted, refresh)
      participant.off(ParticipantEvent.TrackSubscribed, refresh)
      participant.off(ParticipantEvent.TrackUnsubscribed, refresh)
    }
  }, [participant])

  const hasCameraVideo = Boolean(cameraTrack?.isSubscribed && !cameraTrack.isMuted)
  const displayName = name ?? identity ?? '?'
  const initial = displayName.charAt(0).toUpperCase()

  const palette = useMemo(() => getPalette(displayName), [displayName])

  // Scale avatar to available tile size
  const avatarPx   = totalCount === 1 ? 120 : totalCount <= 4 ? 72 : 48
  const fontSizePx = totalCount === 1 ? 44  : totalCount <= 4 ? 26 : 18

  return (
    <ParticipantContextMenu
      participant={participant}
      isPinned={isPinned}
      onTogglePin={onTogglePin}
    >
      <div
        className={`meet-tile group${isSpeaking ? ' meet-speaking' : ''}`}
        {...longPressHandlers}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: totalCount === 1 ? 0 : 10,
          background: `radial-gradient(ellipse 90% 70% at 50% 35%, ${palette.tile}, #08080f 72%)`,
          animationDelay: `${index * 0.04}s`,
        }}
      >
        {hasCameraVideo && cameraTrack ? (
          /* Video stream — wrapper suppresses browser's native <video> context menu
             so right-click bubbles to the Radix ContextMenuTrigger instead */
          <div
            style={{ position: 'absolute', inset: 0 }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <VideoTrack
              trackRef={{ participant, source: Track.Source.Camera, publication: cameraTrack }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          /* No video: gradient avatar */
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 14,
          }}>
            <div style={{
              width: avatarPx, height: avatarPx, borderRadius: '50%',
              background: palette.avatar, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: fontSizePx, fontWeight: 700, color: 'white',
              boxShadow: isSpeaking
                ? `0 0 0 3px rgba(255,255,255,0.18), 0 0 ${avatarPx * 0.6}px ${palette.glow}`
                : `0 0 ${avatarPx * 0.4}px ${palette.glow}`,
              transition: 'box-shadow 0.3s ease',
            }}>
              {initial}
            </div>

            {/* Name label (only when large enough to be readable) */}
            {totalCount <= 2 && (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500 }}>
                {displayName}
                {participant.isLocal && (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 6 }}>you</span>
                )}
              </span>
            )}

            {/* Speaking waveform bars */}
            {isSpeaking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} style={{
                    display: 'inline-block', width: 3, height: 18, borderRadius: 2,
                    background: '#6366f1', transformOrigin: 'bottom center',
                    animation: `meet-speak-bar 0.7s ease-in-out ${i * 0.12}s infinite`,
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Name + mute badge at bottom-left — for video tiles or dense grids */}
        {(hasCameraVideo || totalCount > 2) && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            borderRadius: 7, padding: '3px 8px',
            maxWidth: 'calc(100% - 50px)',
          }}>
            <span style={{
              color: 'white', fontSize: 12, fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {displayName}
              {participant.isLocal && (
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginLeft: 4 }}>you</span>
              )}
            </span>
            {!participant.isMicrophoneEnabled && (
              <MicOff size={11} style={{ color: '#f87171', flexShrink: 0 }} />
            )}
          </div>
        )}

        {/* Pin button — always visible when pinned, appears on hover otherwise */}
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            className={isPinned ? undefined : 'group-hover:opacity-100'}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 30, height: 30, borderRadius: 8,
              background: isPinned ? 'rgba(99,102,241,0.7)' : 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${isPinned ? 'rgba(165,180,252,0.5)' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isPinned ? '#e0e7ff' : 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              opacity: isPinned ? 1 : 0,
              transition: 'opacity 0.15s ease, background 0.15s ease',
            }}
            aria-label={isPinned ? 'Unpin participant' : 'Pin participant'}
          >
            <Pin size={13} style={{ fill: isPinned ? 'currentColor' : 'none' }} />
          </button>
        )}

        {/* 3-dot button — top-left corner (pin button is top-right) */}
        <div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ position: 'absolute', top: 8, left: 8 }}
          >
            <ParticipantMenuButton
              participant={participant}
              isPinned={isPinned}
              onTogglePin={onTogglePin}
            />
          </div>
      </div>
    </ParticipantContextMenu>
  )
}
