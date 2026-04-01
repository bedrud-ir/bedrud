import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { ArrowRight, Plus, Radio, Search, Sparkles } from 'lucide-react'
import { RoomCard } from '@/components/dashboard/RoomCard'
import { CreateRoomDialog } from '@/components/dashboard/CreateRoomDialog'
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

/* ── Quick-join bar ───────────────────────────────────────────────────────── */
function QuickJoin({ onJoin }: { onJoin: (name: string) => void }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const slug = value.trim().toLowerCase().replace(/\s+/g, '-')
    if (!slug) return
    onJoin(slug)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className="flex items-center gap-0 rounded-2xl p-1.5 transition-all duration-300"
        style={{
          border: '1px solid',
          borderColor: focused ? '#6366f150' : 'hsl(var(--border))',
          background: focused ? 'linear-gradient(135deg, #6366f108, #8b5cf608)' : 'hsl(var(--card))',
          boxShadow: focused ? '0 0 0 1px #6366f128, 0 8px 32px #6366f110' : undefined,
        }}
      >
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Enter a room name or code to join instantly…"
          autoComplete="off"
          spellCheck={false}
          className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground font-mono"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="h-8 shrink-0 cursor-pointer rounded-xl px-4 text-xs font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          style={{
            background: value.trim()
              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
              : 'hsl(var(--muted))',
            color: value.trim() ? 'white' : 'hsl(var(--muted-foreground))',
            boxShadow: value.trim() ? '0 2px 10px #6366f138' : undefined,
          }}
        >
          Join <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  )
}

/* ── Stat chip ────────────────────────────────────────────────────────────── */
function StatChip({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-2xl border px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: `${color}25`, background: `${color}07` }}
    >
      <span className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</span>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed py-20 text-center"
      style={{ borderColor: '#6366f130', background: 'linear-gradient(135deg, #6366f105, #8b5cf605)' }}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #6366f115, #8b5cf615)',
          boxShadow: 'inset 0 0 0 1px #6366f125',
        }}
      >
        <Radio className="h-7 w-7" style={{ color: '#818cf8' }} />
      </div>
      <p className="text-base font-semibold">No rooms yet</p>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">
        Create your first private room and start talking. Takes two seconds.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          boxShadow: '0 4px 20px #6366f140',
        }}
      >
        <Plus className="h-4 w-4" />
        Create a room
      </button>
    </div>
  )
}

/* ── Skeleton card ────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border p-5 space-y-4 animate-pulse" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-32 rounded-full bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-muted" />
        <div className="flex gap-1.5">
          <div className="h-5 w-12 rounded-full bg-muted" />
          <div className="h-5 w-14 rounded-full bg-muted" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-9 flex-1 rounded-xl bg-muted" />
        <div className="h-9 w-9 rounded-xl bg-muted" />
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────────────────── */
function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useUserStore((s) => s.user)
  const [createOpen, setCreateOpen] = useState(false)
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

  async function handleCreate(data: {
    name?: string
    isPublic: boolean
    maxParticipants: number
    settings: Room['settings']
  }) {
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

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {user?.name
              ? <>{user.name.split(' ')[0]}'s <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}>rooms</span></>
              : <>Your <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}>rooms</span></>
            }
          </h1>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 16px #6366f140',
          }}
        >
          <Sparkles className="h-4 w-4" />
          New room
        </button>
      </div>

      {/* ── Quick join ─────────────────────────────────────────────────── */}
      <QuickJoin onJoin={handleJoin} />

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip value={totalRooms} label="Total" color="#6366f1" />
        <StatChip value={activeRooms} label="Live now" color="#10b981" />
        <StatChip value={privateRooms} label="Private" color="#8b5cf6" />
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      {totalRooms > 0 && (
        <div
          className="flex items-center gap-1 rounded-xl p-1 w-fit"
          style={{ background: 'hsl(var(--muted))' }}
        >
          {(['all', 'active', 'private'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-all duration-150"
              style={
                filter === f
                  ? {
                      background: 'hsl(var(--background))',
                      color: '#818cf8',
                      boxShadow: '0 1px 4px #0002',
                    }
                  : { color: 'hsl(var(--muted-foreground))' }
              }
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* ── Delete error banner ────────────────────────────────────────── */}
      {deleteError && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#f87171' }}
        >
          {deleteError}
        </div>
      )}

      {/* ── Room grid ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={() => handleJoin(room.name)} onDelete={() => handleDelete(room.id)} />
          ))}
        </div>
      ) : rooms && rooms.length > 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No rooms match this filter.
        </p>
      ) : (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      )}

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
    </div>
  )
}
