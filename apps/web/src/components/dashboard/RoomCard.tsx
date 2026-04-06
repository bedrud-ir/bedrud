import { Copy, Check, Users, Lock, Globe, MessageSquare, Mic, Video, ArrowRight, ShieldCheck, Trash2, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

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
  onSettings?: () => void
}

export function RoomCard({ room, onJoin, onDelete, onSettings }: Props) {
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function copyLink() {
    void navigator.clipboard.writeText(`${window.location.origin}/m/${room.name}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group flex flex-col rounded-lg border bg-card transition-colors hover:bg-accent/30">
      <div className="flex flex-col gap-3 p-3">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {room.isActive && (
              <div className="mb-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Live</span>
              </div>
            )}
            <p className="truncate font-mono text-xs font-semibold">{room.name}</p>
          </div>
          <span className={cn(
            'flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium shrink-0',
            room.isPublic
              ? 'border-sky-500/30 bg-sky-500/10 text-sky-500'
              : 'border-violet-500/30 bg-violet-500/10 text-violet-500',
          )}>
            {room.isPublic ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
            {room.isPublic ? 'Public' : 'Private'}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {room.maxParticipants}
          </span>
          <span className="flex items-center gap-1.5">
            {room.settings.allowAudio && <Mic className="h-3 w-3" />}
            {room.settings.allowVideo && <Video className="h-3 w-3" />}
            {room.settings.allowChat && <MessageSquare className="h-3 w-3" />}
            {room.settings.e2ee && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onJoin}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-opacity hover:opacity-90',
              room.isActive
                ? 'bg-emerald-500 text-white'
                : 'bg-secondary text-secondary-foreground border border-border hover:bg-accent',
            )}
          >
            {room.isActive ? 'Join live' : 'Join'} <ArrowRight className="h-3 w-3" />
          </button>

          <button
            onClick={copyLink}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-sky-500/10 hover:border-sky-500/30"
            aria-label="Copy link"
            title={copied ? 'Copied!' : 'Copy link'}
          >
            {copied
              ? <Check className="h-3 w-3 text-emerald-500" />
              : <Copy className="h-3 w-3 text-sky-500" />}
          </button>

          {onSettings && (
            <button
              onClick={onSettings}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-violet-500/10 hover:border-violet-500/30"
              aria-label="Settings"
              title="Settings"
            >
              <Settings2 className="h-3 w-3 text-violet-500" />
            </button>
          )}

          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onDelete(); setConfirmDelete(false) }}
                  className="rounded px-2 py-1 text-[11px] font-semibold text-destructive-foreground bg-destructive hover:opacity-90"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 transition-colors hover:bg-destructive/20"
                aria-label="Delete"
                title="Delete"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
