import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Copy,
  Globe,
  Lock,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { api } from '#/lib/api'
import { type RecentRoom, useRecentRoomsStore } from '#/lib/recent-rooms.store'
import { useUserStore } from '#/lib/user.store'
import { CreateRoomDialog } from '@/components/dashboard/CreateRoomDialog'
import { RoomSettingsDialog } from '@/components/dashboard/RoomSettingsDialog'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

interface Room {
  id: string
  name: string
  isPublic: boolean
  maxParticipants: number
  isActive: boolean
  mode: string
  settings: {
    allowChat: boolean
    allowVideo: boolean
    allowAudio: boolean
    requireApproval: boolean
    e2ee: boolean
  }
}

export const Route = createFileRoute('/dashboard/')({ component: DashboardPage })

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Quick Join Bar ───────────────────────────────────────────────────────────

function QuickJoinBar({ onJoin, onCreate }: { onJoin: (name: string) => void; onCreate: () => void }) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const slug = value.trim().toLowerCase().replace(/\s+/g, '-')
    if (!slug) return
    onJoin(slug)
  }

  return (
    <div className="flex items-center gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Join by room name or invite code..."
          autoComplete="off"
          spellCheck={false}
          className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
        {value.trim() && (
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Join <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </form>
      <button
        onClick={onCreate}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">New room</span>
      </button>
    </div>
  )
}

// ── Room Row ─────────────────────────────────────────────────────────────────

function RoomRow({
  room,
  onJoin,
  onDelete,
  onSettings,
}: {
  room: Room
  onJoin: () => void
  onDelete: () => void
  onSettings: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function copyLink() {
    void navigator.clipboard.writeText(`${window.location.origin}/m/${room.name}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
        <p className="text-sm text-destructive">
          Delete <span className="font-mono font-medium">{room.name}</span>?
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onDelete()
              setConfirmDelete(false)
            }}
            className="rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground"
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50">
      {/* Status dot + name */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn('h-2 w-2 shrink-0 rounded-full', room.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/20')}
          title={room.isActive ? 'Live' : 'Inactive'}
        />
        <button onClick={onJoin} className="min-w-0 truncate font-mono text-sm font-medium hover:underline">
          {room.name}
        </button>
      </div>

      {/* Badges */}
      <div className="hidden items-center gap-1.5 sm:flex">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
            room.isPublic
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          )}
        >
          {room.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {room.isPublic ? 'Public' : 'Private'}
        </span>
        {room.isActive && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Live
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <button
          onClick={copyLink}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          title={copied ? 'Copied!' : 'Copy link'}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={onSettings}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          title="Settings"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Join button */}
      <button
        onClick={onJoin}
        className={cn(
          'inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors',
          room.isActive
            ? 'bg-primary text-primary-foreground hover:opacity-90'
            : 'border text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        {room.isActive ? 'Join' : 'Open'}
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  )
}

// ── Recent Room Row ──────────────────────────────────────────────────────────

function RecentRoomRow({ recent, onJoin, onRemove }: { recent: RecentRoom; onJoin: () => void; onRemove: () => void }) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50">
      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
      <button
        onClick={onJoin}
        className="min-w-0 flex-1 truncate text-left font-mono text-sm font-medium hover:underline"
      >
        {recent.name}
      </button>
      <span className="text-xs text-muted-foreground/50">{timeAgo(recent.joinedAt)}</span>
      <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <button
          onClick={onRemove}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Remove from recent"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        onClick={onJoin}
        className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        Join <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="h-2 w-2 rounded-full bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="ml-auto h-4 w-16 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useUserStore((s) => s.user)
  const recentRooms = useRecentRoomsStore((s) => s.rooms)
  const addRecent = useRecentRoomsStore((s) => s.add)
  const removeRecent = useRecentRoomsStore((s) => s.remove)

  const [createOpen, setCreateOpen] = useState(false)
  const [settingsRoom, setSettingsRoom] = useState<Room | null>(null)
  const [tab, setTab] = useState<'rooms' | 'recent'>('rooms')
  const [query, setQuery] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get<Room[]>('/api/room/list'),
  })

  function handleJoin(roomName: string) {
    addRecent(roomName)
    navigate({ to: '/m/$meetId', params: { meetId: roomName } })
  }

  async function handleDelete(roomId: string) {
    try {
      await api.delete(`/api/room/${roomId}`)
      setDeleteError(null)
      void queryClient.invalidateQueries({ queryKey: ['rooms'] })
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Failed to delete room'))
      setTimeout(() => setDeleteError(null), 4000)
    }
  }

  async function handleUpdateSettings(
    roomId: string,
    data: { isPublic: boolean; maxParticipants: number; settings: Room['settings'] },
  ) {
    await api.put(`/api/room/${roomId}/settings`, data)
    void queryClient.invalidateQueries({ queryKey: ['rooms'] })
  }

  async function handleCreate(data: {
    name?: string
    isPublic: boolean
    maxParticipants: number
    settings: Room['settings']
  }) {
    const res = await api.post<Room>('/api/room/create', data)
    setCreateOpen(false)
    void queryClient.invalidateQueries({ queryKey: ['rooms'] })
    addRecent(res.name)
    navigate({ to: '/m/$meetId', params: { meetId: res.name } })
  }

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = (rooms ?? [])
    .filter((r) => !normalizedQuery || r.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return Number(b.isActive) - Number(a.isActive)
      return a.name.localeCompare(b.name)
    })

  const filteredRecent = recentRooms.filter((r) => !normalizedQuery || r.name.toLowerCase().includes(normalizedQuery))

  const firstName = user?.name?.split(' ')[0]

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{firstName ? `${firstName}'s rooms` : 'Rooms'}</h1>
        <p className="text-sm text-muted-foreground">Create, join, or manage your meeting rooms.</p>
      </div>

      {/* Quick Join + New Room */}
      <QuickJoinBar onJoin={handleJoin} onCreate={() => setCreateOpen(true)} />

      {/* Error banner */}
      {deleteError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {deleteError}
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
          <button
            onClick={() => setTab('rooms')}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              tab === 'rooms' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            My Rooms
            {rooms && <span className="ml-1.5 text-xs text-muted-foreground">{rooms.length}</span>}
          </button>
          <button
            onClick={() => setTab('recent')}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              tab === 'recent' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Recent
            {recentRooms.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">{recentRooms.length}</span>
            )}
          </button>
        </div>

        <div className="flex h-8 w-full max-w-48 items-center gap-2 rounded-lg border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter..."
            className="h-full flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border bg-card/50">
        {tab === 'rooms' &&
          (isLoading ? (
            <div className="p-2">
              <SkeletonRows />
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-border/50 p-1">
              {filtered.map((room) => (
                <RoomRow
                  key={room.id}
                  room={room}
                  onJoin={() => handleJoin(room.name)}
                  onDelete={() => handleDelete(room.id)}
                  onSettings={() => setSettingsRoom(room)}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              {(rooms?.length ?? 0) > 0 ? (
                <>
                  <p className="text-sm font-medium">No rooms match "{query}"</p>
                  <button onClick={() => setQuery('')} className="mt-2 text-sm text-primary hover:underline">
                    Clear filter
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">No rooms yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Create your first room to get started.</p>
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New room
                  </button>
                </>
              )}
            </div>
          ))}

        {tab === 'recent' &&
          (filteredRecent.length > 0 ? (
            <div className="divide-y divide-border/50 p-1">
              {filteredRecent.map((recent) => (
                <RecentRoomRow
                  key={recent.name}
                  recent={recent}
                  onJoin={() => handleJoin(recent.name)}
                  onRemove={() => removeRecent(recent.name)}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <Clock className="mx-auto h-5 w-5 text-muted-foreground/30" />
              <p className="mt-2 text-sm font-medium">No recent rooms</p>
              <p className="mt-1 text-xs text-muted-foreground">Rooms you join will appear here for quick access.</p>
            </div>
          ))}
      </div>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
      {settingsRoom && (
        <RoomSettingsDialog
          room={settingsRoom}
          open={!!settingsRoom}
          onOpenChange={(open) => {
            if (!open) setSettingsRoom(null)
          }}
          onSave={handleUpdateSettings}
        />
      )}
    </div>
  )
}
