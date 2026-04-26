import { useIsSpeaking, useParticipantInfo, VideoTrack } from '@livekit/components-react'
import type { Participant } from 'livekit-client'
import { Track } from 'livekit-client'
import { MicOff, Minimize2 } from 'lucide-react'
import { useMemo } from 'react'
import { getPalette } from '#/lib/participant-palette'

interface Props {
  participant: Participant
  onClose: () => void
}

export function SpotlightView({ participant, onClose }: Props) {
  const { name, identity } = useParticipantInfo({ participant })
  const isSpeaking = useIsSpeaking(participant)
  const cameraTrack = participant.getTrackPublication(Track.Source.Camera)
  const hasCameraVideo = Boolean(cameraTrack?.isSubscribed && !cameraTrack.isMuted)
  const displayName = name ?? identity ?? '?'
  const palette = useMemo(() => getPalette(displayName), [displayName])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#030308',
        padding: '20px 24px',
      }}
    >
      {/* Main content area — 16:9 with max width */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: 'min(100%, calc(100vh * 16/9))',
          overflow: 'hidden',
          borderRadius: 16,
          background: hasCameraVideo
            ? '#000'
            : `radial-gradient(ellipse 80% 60% at 50% 35%, ${palette.glow.replace('0.5', '0.12')}, #0c0c1a 70%)`,
          boxShadow: isSpeaking
            ? `0 0 0 3px rgba(99,102,241,0.8), 0 0 60px rgba(99,102,241,0.3)`
            : '0 0 0 1px rgba(255,255,255,0.06)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {hasCameraVideo && cameraTrack ? (
          <VideoTrack
            trackRef={{ participant, source: Track.Source.Camera, publication: cameraTrack }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: palette.avatar,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 42,
                fontWeight: 700,
                color: 'white',
                boxShadow: `0 0 70px ${palette.glow}`,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, fontWeight: 500 }}>{displayName}</span>
            {isSpeaking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      width: 4,
                      height: 22,
                      borderRadius: 2,
                      background: '#6366f1',
                      transformOrigin: 'bottom center',
                      animation: `meet-speak-bar 0.7s ease-in-out ${i * 0.12}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Name + mute badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: 8,
            padding: '5px 12px',
          }}
        >
          <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{displayName}</span>
          {!participant.isMicrophoneEnabled && <MicOff size={13} style={{ color: '#f87171' }} />}
        </div>

        {/* Exit spotlight */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
          }}
          aria-label="Exit spotlight"
        >
          <Minimize2 size={15} />
        </button>
      </div>
    </div>
  )
}
