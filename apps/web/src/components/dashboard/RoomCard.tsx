import { Copy, Check, Users, Lock, Globe, MessageSquare, Mic, Video, ArrowRight, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Room {
  id: string
  name: string
  isPublic: boolean
  maxParticipants: number
  isActive: boolean
  settings: {
    allowChat: boolean
    allowVideo: boolean
    allowAudio: boolean
    e2ee?: boolean
  }
}

interface Props {
  room: Room
  onJoin: () => void
  onDelete?: () => void
}

export function RoomCard({ room, onJoin, onDelete }: Props) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function copyLink() {
    void navigator.clipboard.writeText(`${window.location.origin}/m/${room.name}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const accentColor = room.isActive ? '#10b981' : '#6366f1'

  return (
    <div
      className="group relative flex flex-col rounded-2xl border transition-all duration-200"
      style={{
        borderColor: hovered ? `${accentColor}35` : 'hsl(var(--border))',
        background: hovered
          ? `linear-gradient(135deg, ${accentColor}06 0%, transparent 100%)`
          : 'hsl(var(--card))',
        boxShadow: hovered ? `0 8px 32px ${accentColor}14` : undefined,
        transform: hovered ? 'translateY(-2px)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Accent left stripe */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full transition-all duration-200"
        style={{
          background: room.isActive
            ? 'linear-gradient(180deg, #10b981, #06b6d4)'
            : 'linear-gradient(180deg, #6366f1, #8b5cf6)',
          opacity: hovered ? 1 : 0.5,
        }}
      />

      <div className="p-5 pl-6 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Live indicator */}
            {room.isActive && (
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">
                  Live
                </span>
              </div>
            )}
            <p className="truncate font-mono text-sm font-semibold">{room.name}</p>
          </div>

          {/* Visibility badge */}
          <span
            className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shrink-0"
            style={
              room.isPublic
                ? { borderColor: '#06b6d430', color: '#06b6d4', background: '#06b6d408' }
                : { borderColor: '#8b5cf630', color: '#a78bfa', background: '#8b5cf608' }
            }
          >
            {room.isPublic ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
            {room.isPublic ? 'Public' : 'Private'}
          </span>
        </div>

        {/* Feature icons row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>Max {room.maxParticipants}</span>
          </div>
          <div className="flex items-center gap-2">
            {room.settings.allowAudio && (
              <span title="Audio enabled" className="text-muted-foreground/60 hover:text-muted-foreground">
                <Mic className="h-3.5 w-3.5" />
              </span>
            )}
            {room.settings.allowVideo && (
              <span title="Video enabled" className="text-muted-foreground/60 hover:text-muted-foreground">
                <Video className="h-3.5 w-3.5" />
              </span>
            )}
            {room.settings.allowChat && (
              <span title="Chat enabled" className="text-muted-foreground/60 hover:text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
              </span>
            )}
            {room.settings.e2ee && (
              <span title="End-to-end encrypted" style={{ color: '#10b981' }}>
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onJoin}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: room.isActive
                ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: room.isActive ? '0 4px 14px #10b98138' : '0 4px 14px #6366f138',
            }}
          >
            {room.isActive ? 'Join live' : 'Join'} <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={copyLink}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-150 hover:bg-muted active:scale-95"
            style={{ borderColor: 'hsl(var(--border))' }}
            aria-label="Copy meeting link"
            title={copied ? 'Copied!' : 'Copy link'}
          >
            {copied
              ? <Check className="h-4 w-4 text-emerald-500" />
              : <Copy className="h-4 w-4 text-muted-foreground" />}
          </button>

          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onDelete(); setConfirmDelete(false) }}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-white"
                  style={{ background: '#ef4444' }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-150 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive active:scale-95"
                style={{ borderColor: 'hsl(var(--border))' }}
                aria-label="Delete room"
                title="Delete room"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
