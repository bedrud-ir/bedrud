import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Search, Globe, Lock, Activity, Trash2, ChevronDown, ChevronUp, Power } from 'lucide-react'
import { api } from '#/lib/api'

interface AdminRoom {
  id: string
  name: string
  createdBy: string
  isPublic: boolean
  isActive: boolean
  maxParticipants: number
  createdAt: string
  settings?: {
    allowChat: boolean
    allowVideo: boolean
    allowAudio: boolean
    e2ee: boolean
  }
}

export const Route = createFileRoute('/admin/rooms')({ component: AdminRoomsPage })

type SortField = 'name' | 'createdAt' | 'maxParticipants'

function AdminRoomsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)
  const [confirmClose, setConfirmClose] = useState<string | null>(null)
  const [editingLimit, setEditingLimit] = useState<string | null>(null)
  const [limitValue, setLimitValue] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'rooms'],
    queryFn: () => api.get<{ rooms: AdminRoom[] }>('/api/admin/rooms'),
  })

  const closeRoom = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] })
      setConfirmClose(null)
    },
  })

  const updateLimit = useMutation({
    mutationFn: ({ id, max }: { id: string; max: number }) =>
      api.put(`/api/admin/rooms/${id}`, { maxParticipants: max }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] }),
  })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc((v) => !v)
    else { setSortField(field); setSortAsc(true) }
  }

  const rooms = (data?.rooms ?? [])
    .filter((r) => {
      const q = search.toLowerCase()
      return !q || r.name.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortField === 'maxParticipants') cmp = a.maxParticipants - b.maxParticipants
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortAsc ? cmp : -cmp
    })

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null
    return sortAsc ? <ChevronUp className="h-3.5 w-3.5 inline ml-1" /> : <ChevronDown className="h-3.5 w-3.5 inline ml-1" />
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)' }}>
              All rooms
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{data?.rooms.length ?? 0} rooms in this instance</p>
        </div>

        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2 w-full sm:w-64"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
        <div
          className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          style={{ background: 'linear-gradient(135deg, #8b5cf608, #06b6d408)' }}
        >
          <button className="text-left hover:text-foreground transition-colors" onClick={() => toggleSort('name')}>
            Room <SortIcon field="name" />
          </button>
          <span>Visibility</span>
          <span>Status</span>
          <button className="text-left hover:text-foreground transition-colors" onClick={() => toggleSort('maxParticipants')}>
            Cap. <SortIcon field="maxParticipants" />
          </button>
          <button className="text-left hover:text-foreground transition-colors" onClick={() => toggleSort('createdAt')}>
            Created <SortIcon field="createdAt" />
          </button>
          <span className="sr-only">Actions</span>
        </div>

        <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-4 animate-pulse">
                {[...Array(6)].map((__, j) => <div key={j} className="h-4 rounded-full bg-muted" />)}
              </div>
            ))
          ) : rooms.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No rooms found</p>
          ) : rooms.map((room) => (
            <div
              key={room.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
            >
              <Link
                to="/admin/rooms/$roomId"
                params={{ roomId: room.id }}
                className="truncate font-mono text-sm font-medium hover:text-indigo-400 transition-colors"
              >
                {room.name}
              </Link>

              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={
                  room.isPublic
                    ? { background: '#06b6d415', color: '#06b6d4' }
                    : { background: '#8b5cf615', color: '#a78bfa' }
                }
              >
                {room.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {room.isPublic ? 'Public' : 'Private'}
              </span>

              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={
                  room.isActive
                    ? { background: '#10b98115', color: '#10b981' }
                    : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                }
              >
                {room.isActive && <Activity className="h-3 w-3 animate-pulse" />}
                {room.isActive ? 'Live' : 'Idle'}
              </span>

              {/* Editable participant limit */}
              {editingLimit === room.id ? (
                <input
                  className="w-14 rounded border px-1.5 py-0.5 text-xs text-center outline-none"
                  style={{ borderColor: '#6366f160', background: '#6366f108' }}
                  value={limitValue}
                  type="number"
                  min={1}
                  onChange={(e) => setLimitValue(+e.target.value)}
                  onBlur={() => {
                    if (limitValue > 0) updateLimit.mutate({ id: room.id, max: limitValue })
                    setEditingLimit(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (limitValue > 0) updateLimit.mutate({ id: room.id, max: limitValue })
                      setEditingLimit(null)
                    } else if (e.key === 'Escape') {
                      setEditingLimit(null)
                    }
                  }}
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => { setEditingLimit(room.id); setLimitValue(room.maxParticipants) }}
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                  title="Click to edit"
                >
                  {room.maxParticipants}
                </button>
              )}

              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(room.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>

              {/* Force-close */}
              {confirmClose === room.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => closeRoom.mutate(room.id)}
                    disabled={closeRoom.isPending}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-white transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: '#ef4444' }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmClose(null)}
                    className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClose(room.id)}
                  disabled={!room.isActive}
                  className="rounded-lg p-1.5 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
                  title={room.isActive ? 'Force close room' : 'Room already inactive'}
                >
                  <Power className="h-4 w-4" />
                  <Trash2 className="h-4 w-4 hidden" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
