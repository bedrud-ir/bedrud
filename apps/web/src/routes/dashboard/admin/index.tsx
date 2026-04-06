import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Activity, Globe, Lock, Radio, Shield, UserCheck, Users, UserX, Video } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { api } from '#/lib/api'
import { cn } from '@/lib/utils'

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

export const Route = createFileRoute('/dashboard/admin/')({ component: AdminOverview })

function StatCard({
  value,
  label,
  sub,
  icon: Icon,
}: {
  value: string | number
  label: string
  sub?: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
          {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { date: d.toLocaleDateString('en', { weekday: 'short' }), rooms: 0, full: d.toDateString() }
  })
  rooms.forEach((r) => {
    const d = new Date(r.createdAt).toDateString()
    const slot = last7Days.find((s) => s.full === d)
    if (slot) slot.rooms++
  })

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-sm font-semibold">System overview</h1>
        <p className="text-xs text-muted-foreground">Real-time stats for this Bedrud instance.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <StatCard value={users.length} label="Total users" sub={`${activeUsers} active`} icon={Users} />
        <StatCard value={rooms.length} label="Total rooms" sub={`${activeRooms} live`} icon={Video} />
        <StatCard value={onlineCount} label="Online users" sub="currently in rooms" icon={Radio} />
        <StatCard value={adminUsers} label="Admins" icon={Shield} />
        <StatCard value={publicRooms} label="Public rooms" sub={`${rooms.length - publicRooms} private`} icon={Globe} />
        <StatCard value={activeRooms} label="Active rooms" sub="currently live" icon={Activity} />
      </div>

      {/* Server status */}
      <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
          <Activity className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold">Server healthy</p>
          </div>
          <p className="text-[11px] text-muted-foreground">All systems operational</p>
        </div>
      </div>

      {/* Room activity chart */}
      <div className="rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
          <p className="text-xs font-semibold">Room creation activity</p>
          <span className="text-[11px] text-muted-foreground">Last 7 days</span>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={last7Days} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="roomGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="rooms"
                stroke="hsl(var(--primary))"
                fill="url(#roomGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: 'hsl(var(--primary))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-col: recent users + room breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent signups */}
        <div className="rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
            <p className="text-xs font-semibold">Recent sign-ups</p>
            <span className="text-[11px] text-muted-foreground">{users.length} total</span>
          </div>
          <div className="divide-y">
            {recentUsers.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">No users yet</p>
            ) : (
              recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{u.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ProviderBadge provider={u.provider} />
                    {u.isActive ? (
                      <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <UserX className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Room breakdown */}
        <div className="rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
            <p className="text-xs font-semibold">Room breakdown</p>
            <span className="text-[11px] text-muted-foreground">{rooms.length} total</span>
          </div>
          <div className="p-4 space-y-3">
            {[
              {
                label: 'Live rooms',
                value: activeRooms,
                total: rooms.length,
                icon: Activity,
                color: 'text-emerald-500',
                bar: 'bg-emerald-500',
              },
              {
                label: 'Public rooms',
                value: publicRooms,
                total: rooms.length,
                icon: Globe,
                color: 'text-sky-500',
                bar: 'bg-sky-500',
              },
              {
                label: 'Private rooms',
                value: rooms.length - publicRooms,
                total: rooms.length,
                icon: Lock,
                color: 'text-violet-500',
                bar: 'bg-violet-500',
              },
            ].map(({ label, value, total, icon: Icon, color, bar }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className={cn('flex items-center gap-1.5', color)}>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {value} / {total}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', bar)}
                    style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
            {rooms.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No rooms created yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
