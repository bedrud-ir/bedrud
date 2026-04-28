import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Activity, ChevronDown, ChevronUp, Globe, Lock, Power, Search } from 'lucide-react'
import { useState } from 'react'
import { api } from '#/lib/api'
import { cn } from '@/lib/utils'

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

export const Route = createFileRoute('/dashboard/admin/rooms')({ component: AdminRoomsPage })

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
 else {
 setSortField(field)
 setSortAsc(true)
 }
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
 return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />
 }

 return (
 <div className="mx-auto max-w-5xl space-y-4">
 {/* Header */}
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h1 className="text-sm font-semibold">Rooms</h1>
 <p className="text-xs text-muted-foreground">{data?.rooms.length ?? 0} rooms in this instance</p>
 </div>

 <div className="flex items-center gap-2 border bg-background px-2.5 py-1.5 w-full sm:w-56">
 <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search rooms…"
 className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
 />
 </div>
 </div>

 {/* Table */}
 <div className="border overflow-hidden">
 <div className="overflow-x-auto">
 <div className="min-w-[560px]">
 <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 border-b bg-muted/30 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
 <button className="text-left hover:text-foreground transition-colors" onClick={() => toggleSort('name')}>
 Room <SortIcon field="name" />
 </button>
 <span>Visibility</span>
 <span>Status</span>
 <button
 className="text-left hover:text-foreground transition-colors"
 onClick={() => toggleSort('maxParticipants')}
 >
 Cap. <SortIcon field="maxParticipants" />
 </button>
 <button
 className="text-left hover:text-foreground transition-colors hidden sm:block"
 onClick={() => toggleSort('createdAt')}
 >
 Created <SortIcon field="createdAt" />
 </button>
 <span className="sr-only">Actions</span>
 </div>

 <div className="divide-y">
 {isLoading ? (
 [...Array(4)].map((_, i) => (
 <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 px-4 py-3 animate-pulse">
 {[...Array(6)].map((__, j) => (
 <div key={j} className="h-3.5 rounded-full bg-muted" />
 ))}
 </div>
 ))
 ) : rooms.length === 0 ? (
 <p className="px-4 py-8 text-center text-xs text-muted-foreground">No rooms found</p>
 ) : (
 rooms.map((room) => (
 <div
 key={room.id}
 className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
 >
 <Link
 to="/dashboard/admin/rooms/$roomId"
 params={{ roomId: room.id }}
 className="truncate font-mono text-xs font-medium hover:text-primary transition-colors"
 >
 {room.name}
 </Link>

 <span
 className={cn(
 'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
 room.isPublic
 ? 'border-sky-500/30 bg-sky-500/10 text-sky-500'
 : 'border-violet-500/30 bg-violet-500/10 text-violet-500',
 )}
 >
 {room.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
 {room.isPublic ? 'Public' : 'Private'}
 </span>

 <span
 className={cn(
 'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
 room.isActive
 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
 : 'border-border bg-muted text-muted-foreground',
 )}
 >
 {room.isActive && <Activity className="h-3 w-3 animate-pulse" />}
 {room.isActive ? 'Live' : 'Idle'}
 </span>

 {editingLimit === room.id ? (
 <input
 className="w-14 border border-primary/40 bg-primary/5 px-1.5 py-0.5 text-xs text-center outline-none"
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
 />
 ) : (
 <button
 onClick={() => {
 setEditingLimit(room.id)
 setLimitValue(room.maxParticipants)
 }}
 className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
 title="Click to edit"
 >
 {room.maxParticipants}
 </button>
 )}

 <p className="hidden sm:block text-[11px] text-muted-foreground whitespace-nowrap">
 {new Date(room.createdAt).toLocaleDateString(undefined, {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 })}
 </p>

 {confirmClose === room.id ? (
 <div className="flex items-center gap-1">
 <button
 onClick={() => closeRoom.mutate(room.id)}
 disabled={closeRoom.isPending}
 className="bg-destructive px-2 py-1 text-[10px] font-semibold text-destructive-foreground transition-opacity hover:opacity-80 disabled:opacity-50"
 >
 Confirm
 </button>
 <button
 onClick={() => setConfirmClose(null)}
 className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
 >
 ×
 </button>
 </div>
 ) : (
 <button
 onClick={() => setConfirmClose(room.id)}
 disabled={!room.isActive}
 className="p-1.5 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground"
 title={room.isActive ? 'Force close room' : 'Room already inactive'}
 >
 <Power className="h-3.5 w-3.5" />
 </button>
 )}
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}
