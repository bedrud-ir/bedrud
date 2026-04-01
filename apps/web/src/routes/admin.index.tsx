import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Users, Video, Activity, Globe, Lock, Shield, UserCheck, UserX, Radio } from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
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

interface AdminRoom {
  id: string
  name: string
  isActive: boolean
  isPublic: boolean
  maxParticipants: number
  createdAt: string
}

export const Route = createFileRoute('/admin/')({ component: AdminOverview })

function StatCard({
  value,
  label,
  sub,
  icon: Icon,
  color,
}: {
  value: string | number
  label: string
  sub?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div
      className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: `${color}25`, background: `${color}07` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-bold tracking-tight" style={{ color }}>{value}</p>
          <p className="mt-1 text-sm font-medium">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${color}15`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    local: { bg: '#6366f115', color: '#818cf8' },
    google: { bg: '#ef444415', color: '#f87171' },
    github: { bg: '#71717a15', color: '#a1a1aa' },
    guest: { bg: '#f59e0b15', color: '#fbbf24' },
    passkey: { bg: '#10b98115', color: '#34d399' },
  }
  const style = colors[provider] ?? { bg: '#6366f115', color: '#818cf8' }
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: style.bg, color: style.color }}
    >
      {provider}
    </span>
  )
}

function AdminOverview() {
  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<{ users: AdminUser[] }>('/api/admin/users'),
  })
  const { data: roomsData } = useQuery({
    queryKey: ['admin', 'rooms'],
    queryFn: () => api.get<{ rooms: AdminRoom[] }>('/api/admin/rooms'),
  })
  const { data: onlineData } = useQuery({
    queryKey: ['admin', 'online'],
    queryFn: () => api.get<{ count: number }>('/api/admin/online-count'),
    refetchInterval: 30_000,
  })

  const users = usersData?.users ?? []
  const rooms = roomsData?.rooms ?? []
  const activeUsers = users.filter((u) => u.isActive).length
  const activeRooms = rooms.filter((r) => r.isActive).length
  const adminUsers = users.filter((u) => u.accesses?.includes('superadmin')).length
  const publicRooms = rooms.filter((r) => r.isPublic).length
  const onlineCount = onlineData?.count ?? 0

  // Recent users (last 5)
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Room creation activity over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      date: d.toLocaleDateString('en', { weekday: 'short' }),
      rooms: 0,
      full: d.toDateString(),
    }
  })
  rooms.forEach((r) => {
    const d = new Date(r.createdAt).toDateString()
    const slot = last7Days.find((s) => s.full === d)
    if (slot) slot.rooms++
  })

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          System{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }}
          >
            overview
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time stats for this Bedrud instance.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard value={users.length} label="Total users" sub={`${activeUsers} active`} icon={Users} color="#6366f1" />
        <StatCard value={rooms.length} label="Total rooms" sub={`${activeRooms} live`} icon={Video} color="#8b5cf6" />
        <StatCard value={onlineCount} label="Online users" sub="currently in rooms" icon={Radio} color="#10b981" />
        <StatCard value={adminUsers} label="Admins" icon={Shield} color="#ec4899" />
        <StatCard value={publicRooms} label="Public rooms" sub={`${rooms.length - publicRooms} private`} icon={Globe} color="#06b6d4" />
        <StatCard value={activeRooms} label="Active rooms" sub="currently live" icon={Activity} color="#f59e0b" />
      </div>

      {/* Server status */}
      <div
        className="flex items-center gap-4 rounded-2xl border p-5"
        style={{ borderColor: '#10b98125', background: '#10b98107' }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: '#10b98120', color: '#10b981' }}
        >
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-semibold">Server healthy</p>
          </div>
          <p className="text-xs text-muted-foreground">All systems operational</p>
        </div>
      </div>

      {/* Room activity chart */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ background: 'linear-gradient(135deg, #6366f108, #8b5cf608)' }}
        >
          <p className="text-sm font-semibold">Room creation activity</p>
          <span className="text-xs text-muted-foreground">Last 7 days</span>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={last7Days} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="roomGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="rooms"
                stroke="#6366f1"
                fill="url(#roomGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-col: recent users + room breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent signups */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ background: 'linear-gradient(135deg, #6366f108, #8b5cf608)' }}>
            <p className="text-sm font-semibold">Recent sign-ups</p>
            <span className="text-xs text-muted-foreground">{users.length} total</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
            {recentUsers.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground text-center">No users yet</p>
            ) : recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ProviderBadge provider={u.provider} />
                  {u.isActive
                    ? <UserCheck className="h-4 w-4 text-emerald-500" />
                    : <UserX className="h-4 w-4 text-destructive" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room breakdown */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ background: 'linear-gradient(135deg, #8b5cf608, #06b6d408)' }}>
            <p className="text-sm font-semibold">Room breakdown</p>
            <span className="text-xs text-muted-foreground">{rooms.length} total</span>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Live rooms', value: activeRooms, total: rooms.length, color: '#10b981', icon: Activity },
              { label: 'Public rooms', value: publicRooms, total: rooms.length, color: '#06b6d4', icon: Globe },
              { label: 'Private rooms', value: rooms.length - publicRooms, total: rooms.length, color: '#8b5cf6', icon: Lock },
            ].map(({ label, value, total, color, icon: Icon }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5" style={{ color }}>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <span className="text-muted-foreground">{value} / {total}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%', background: color }}
                  />
                </div>
              </div>
            ))}
            {rooms.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No rooms created yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
