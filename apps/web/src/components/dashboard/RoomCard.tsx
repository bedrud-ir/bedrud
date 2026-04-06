import {
  ArrowRight,
  Check,
  Copy,
  Globe,
  Lock,
  MessageSquare,
  Mic,
  Settings2,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  Video,
} from 'lucide-react'
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
    requireApproval: boolean
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
  const capabilities = [
    room.settings.allowAudio ? { icon: Mic, label: 'Audio' } : null,
    room.settings.allowVideo ? { icon: Video, label: 'Video' } : null,
    room.settings.allowChat ? { icon: MessageSquare, label: 'Chat' } : null,
  ].filter((item): item is { icon: typeof Mic; label: string } => Boolean(item))

  function copyLink() {
    void navigator.clipboard.writeText(`${window.location.origin}/m/${room.name}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group flex h-full flex-col rounded-[1.5rem] border bg-card/90 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {room.isActive && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {room.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {room.isPublic ? 'Public' : 'Private'}
            </span>
            {room.settings.e2ee && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                <ShieldCheck className="h-3 w-3" />
                Encrypted
              </span>
            )}
            {room.settings.requireApproval && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <UserCheck className="h-3 w-3" />
                Approval
              </span>
            )}
          </div>

          <h3 className="mt-3 truncate font-mono text-sm font-semibold">{room.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {room.isActive ? 'Participants can join immediately.' : 'Ready for the next session.'}
          </p>
        </div>

        <button
          onClick={copyLink}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background transition-colors hover:bg-accent"
          aria-label="Copy link"
          title={copied ? 'Copied!' : 'Copy invite link'}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border bg-background/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Capacity</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            {room.maxParticipants} seats
          </p>
        </div>

        <div className="rounded-2xl border bg-background/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Access</p>
          <p className="mt-2 text-sm font-medium">
            {room.isPublic ? 'Anyone with the link can join.' : 'Only invited participants can enter.'}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-background/70 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Enabled</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {capabilities.length > 0 ? (
            capabilities.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No participant features enabled.</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onJoin}
          className={cn(
            'flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-opacity hover:opacity-90',
            room.isActive
              ? 'bg-primary text-primary-foreground'
              : 'border border-input bg-background text-foreground hover:bg-accent',
          )}
        >
          {room.isActive ? 'Join live room' : 'Open room'}
          <ArrowRight className="h-4 w-4" />
        </button>

        {onSettings && (
          <button
            onClick={onSettings}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background transition-colors hover:bg-accent"
            aria-label="Room settings"
            title="Room settings"
          >
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {onDelete && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 transition-colors hover:bg-destructive/15"
            aria-label="Delete room"
            title="Delete room"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        )}
      </div>

      {confirmDelete && onDelete && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-3">
          <div>
            <p className="text-sm font-medium text-destructive">Delete this room?</p>
            <p className="text-xs text-destructive/80">This removes the room from the dashboard.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDelete()
                setConfirmDelete(false)
              }}
              className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
