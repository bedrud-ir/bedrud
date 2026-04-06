import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertCircle, ArrowRight, Plus, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoomCard } from '@/components/dashboard/RoomCard'
import { CreateRoomDialog } from '@/components/dashboard/CreateRoomDialog'
import { RoomSettingsDialog } from '@/components/dashboard/RoomSettingsDialog'
import { useUserStore } from '#/lib/user.store'
import { api } from '#/lib/api'

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

function QuickJoin({ onJoin }: { onJoin: (name: string) => void }) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const slug = value.trim().toLowerCase().replace(/\s+/g, '-')
    if (!slug) return
    onJoin(slug)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-0 rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Join by room name or code…"
        autoComplete="off"
        spellCheck={false}
        className="h-8 flex-1 bg-transparent px-3 font-mono text-xs outline-none placeholder:text-muted-foreground/40"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="m-0.5 inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-sm bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-30"
      >
        Join <ArrowRight className="h-3 w-3" />
      </button>
    </form>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-14 text-center">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Radio className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No rooms yet</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Create a room and share the link.</p>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" /> New room
      </button>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-4 w-14 rounded bg-muted" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-4 w-10 rounded bg-muted" />
        <div className="h-4 w-12 rounded bg-muted" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 flex-1 rounded-md bg-muted" />
        <div className="h-7 w-7 rounded-md bg-muted" />
      </div>
    </div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useUserStore((s) => s.user)
  const [createOpen, setCreateOpen] = useState(false)
  const [settingsRoom, setSettingsRoom] = useState<Room | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'private'>('all')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get<Room[]>('/api/room/list'),
  })

  function handleJoin(roomName: string) {
    navigate({ to: '/m/$meetId', params: { meetId: roomName } })
  }

  async function handleDelete(roomId: string) {
    try {
      await api.delete(`/api/room/${roomId}`)
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete room'
      setDeleteError(msg)
      setTimeout(() => setDeleteError(null), 4000)
    }
  }

  async function handleUpdateSettings(roomId: string, data: { isPublic: boolean; maxParticipants: number; settings: Room['settings'] }) {
    await api.put(`/api/room/${roomId}/settings`, data)
    queryClient.invalidateQueries({ queryKey: ['rooms'] })
  }

  async function handleCreate(data: { name?: string; isPublic: boolean; maxParticipants: number; settings: Room['settings'] }) {
    const res = await api.post<Room>('/api/room/create', data)
    setCreateOpen(false)
    queryClient.invalidateQueries({ queryKey: ['rooms'] })
    navigate({ to: '/m/$meetId', params: { meetId: res.name } })
  }

  const totalRooms = rooms?.length ?? 0
  const activeRooms = rooms?.filter((r) => r.isActive).length ?? 0
  const privateRooms = rooms?.filter((r) => !r.isPublic).length ?? 0

  const filtered = rooms?.filter((r) => {
    if (filter === 'active') return r.isActive
    if (filter === 'private') return !r.isPublic
    return true
  })

  const firstName = user?.name?.split(' ')[0]

  return (
    <div className="mx-auto max-w-4xl space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold">
          {firstName ? `${firstName}'s rooms` : 'Rooms'}
        </h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> New room
        </button>
      </div>

      {/* Quick join */}
      <QuickJoin onJoin={handleJoin} />

      {/* Stats + filters inline */}
      {totalRooms > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span><span className="font-medium text-foreground">{totalRooms}</span> total</span>
            <span><span className="font-medium text-emerald-500">{activeRooms}</span> live</span>
            <span><span className="font-medium text-foreground">{privateRooms}</span> private</span>
          </div>
          <div className="flex items-center gap-px rounded-md bg-muted p-0.5">
            {(['all', 'active', 'private'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded px-2.5 py-1 text-[11px] font-medium capitalize transition-colors',
                  filter === f ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete error */}
      {deleteError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {deleteError}
        </div>
      )}

      {/* Room grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={() => handleJoin(room.name)}
              onDelete={() => handleDelete(room.id)}
              onSettings={() => setSettingsRoom(room)}
            />
          ))}
        </div>
      ) : rooms && rooms.length > 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">No rooms match this filter.</p>
      ) : (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      )}

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
      {settingsRoom && (
        <RoomSettingsDialog
          room={settingsRoom}
          open={!!settingsRoom}
          onOpenChange={(open) => { if (!open) setSettingsRoom(null) }}
          onSave={handleUpdateSettings}
        />
      )}
    </div>
  )
}
