import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Search, Shield, UserCheck, UserX, ChevronDown, ChevronUp, ShieldOff } from 'lucide-react'
import { api } from '#/lib/api'

interface AdminUser {
  id: string
  email: string
  name: string
  provider: string
  isActive: boolean
  accesses: string[] | null
  createdAt: string
}

export const Route = createFileRoute('/admin/users')({ component: AdminUsersPage })

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    local: { bg: '#6366f115', color: '#818cf8' },
    google: { bg: '#ef444415', color: '#f87171' },
    github: { bg: '#71717a15', color: '#a1a1aa' },
    guest: { bg: '#f59e0b15', color: '#fbbf24' },
    passkey: { bg: '#10b98115', color: '#34d399' },
  }
  const s = colors[provider] ?? { bg: '#6366f115', color: '#818cf8' }
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      {provider}
    </span>
  )
}

function StatusToggle({ user, onToggle, isPending }: { user: AdminUser; onToggle: () => void; isPending: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
      style={
        user.isActive
          ? { background: '#10b98115', color: '#10b981', border: '1px solid #10b98130' }
          : { background: '#ef444415', color: '#f87171', border: '1px solid #ef444430' }
      }
    >
      {user.isActive
        ? <><UserCheck className="h-3.5 w-3.5" /> Active</>
        : <><UserX className="h-3.5 w-3.5" /> Banned</>}
    </button>
  )
}

type SortField = 'name' | 'email' | 'provider' | 'createdAt'

function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<{ users: AdminUser[] }>('/api/admin/users'),
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.put(`/api/admin/users/${id}/status`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const toggleAdmin = useMutation({
    mutationFn: ({ id, accesses }: { id: string; accesses: string[] }) =>
      api.put(`/api/admin/users/${id}/accesses`, { accesses }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc((v) => !v)
    else { setSortField(field); setSortAsc(true) }
  }

  const users = (data?.users ?? [])
    .filter((u) => {
      const q = search.toLowerCase()
      return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortField === 'email') cmp = a.email.localeCompare(b.email)
      else if (sortField === 'provider') cmp = a.provider.localeCompare(b.provider)
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
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
              Users
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.users.length ?? 0} registered accounts
          </p>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2 w-full sm:w-64"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
        {/* Table header */}
        <div
          className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          style={{ background: 'linear-gradient(135deg, #6366f108, #8b5cf608)' }}
        >
          <button className="text-left hover:text-foreground transition-colors" onClick={() => toggleSort('name')}>
            Name <SortIcon field="name" />
          </button>
          <button className="text-left hover:text-foreground transition-colors" onClick={() => toggleSort('email')}>
            Email <SortIcon field="email" />
          </button>
          <button className="text-left hover:text-foreground transition-colors" onClick={() => toggleSort('provider')}>
            Provider <SortIcon field="provider" />
          </button>
          <span>Status</span>
          <span>Role</span>
          <button className="text-left hover:text-foreground transition-colors" onClick={() => toggleSort('createdAt')}>
            Joined <SortIcon field="createdAt" />
          </button>
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 px-5 py-4 animate-pulse">
                <div className="h-4 rounded-full bg-muted" />
                <div className="h-4 rounded-full bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-5 w-8 rounded-full bg-muted" />
                <div className="h-4 w-20 rounded-full bg-muted" />
              </div>
            ))
          ) : users.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No users found</p>
          ) : users.map((user) => {
            const isSuperadmin = user.accesses?.includes('superadmin')
            return (
              <div
                key={user.id}
                className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <Link
                    to="/admin/users/$userId"
                    params={{ userId: user.id }}
                    className="truncate text-sm font-medium hover:text-indigo-400 transition-colors"
                  >
                    {user.name}
                  </Link>
                </div>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                <ProviderBadge provider={user.provider} />
                <StatusToggle
                  user={user}
                  isPending={toggleStatus.isPending}
                  onToggle={() => toggleStatus.mutate({ id: user.id, active: !user.isActive })}
                />
                {/* Promote/demote admin button */}
                <button
                  onClick={() => toggleAdmin.mutate({
                    id: user.id,
                    accesses: isSuperadmin ? ['user'] : ['superadmin', 'user'],
                  })}
                  disabled={toggleAdmin.isPending}
                  title={isSuperadmin ? 'Remove admin' : 'Make admin'}
                  className="flex items-center justify-center h-7 w-7 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                  style={isSuperadmin
                    ? { background: '#6366f115', color: '#818cf8', border: '1px solid #6366f130' }
                    : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                  }
                >
                  {isSuperadmin ? <Shield className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                </button>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
