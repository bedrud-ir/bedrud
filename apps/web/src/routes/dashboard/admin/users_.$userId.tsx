import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Activity,
  ArrowLeft,
  Calendar,
  Globe,
  Hash,
  Lock,
  Mail,
  RefreshCw,
  Shield,
  ShieldOff,
  UserCheck,
  Users,
  UserX,
  Video,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { api } from '#/lib/api'

export const Route = createFileRoute('/dashboard/admin/users_/$userId')({ component: UserDetailPage })

interface UserDetail {
  id: string
  email: string
  name: string
  provider: string
  isActive: boolean
  accesses: string[] | null
  createdAt: string
}

interface Room {
  id: string
  name: string
  isPublic: boolean
  isActive: boolean
  maxParticipants: number
  createdAt: string
}

const PROVIDER_STYLE: Record<string, { bg: string; color: string }> = {
  local: { bg: '#6366f115', color: '#818cf8' },
  google: { bg: '#ef444415', color: '#f87171' },
  github: { bg: '#71717a15', color: '#a1a1aa' },
  guest: { bg: '#f59e0b15', color: '#fbbf24' },
  passkey: { bg: '#10b98115', color: '#34d399' },
}

function ProviderBadge({ provider }: { provider: string }) {
  const s = PROVIDER_STYLE[provider] ?? { bg: '#6366f115', color: '#818cf8' }
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color }}
    >
      {provider}
    </span>
  )
}

/** Last 8 weeks, one bar per week */
function buildWeeklyChart(rooms: Room[]) {
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (7 - i) * 7)
    return {
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()),
      rooms: 0,
    }
  })
  for (const room of rooms) {
    const created = new Date(room.createdAt)
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (created >= weeks[i].start) {
        weeks[i].rooms++
        break
      }
    }
  }
  return weeks.map(({ label, rooms }) => ({ label, rooms }))
}

function StatCard({
  value,
  label,
  icon: Icon,
  color,
}: {
  value: number | string
  label: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${color}25`, background: `${color}07` }}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xl font-bold tracking-tight" style={{ color }}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 opacity-70" style={{ color }} />
      </div>
    </div>
  )
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function UserDetailPage() {
  const { userId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => api.get<{ user: UserDetail; rooms: Room[] }>(`/api/admin/users/${userId}`),
  })

  const toggleStatus = useMutation({
    mutationFn: (active: boolean) => api.put(`/api/admin/users/${userId}/status`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] }),
  })

  const toggleAdmin = useMutation({
    mutationFn: (accesses: string[]) => api.put(`/api/admin/users/${userId}/accesses`, { accesses }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] }),
  })

  const user = data?.user
  const rooms = data?.rooms ?? []
  const isSuperadmin = user?.accesses?.includes('superadmin')

  const activeRooms = rooms.filter((r) => r.isActive).length
  const publicRooms = rooms.filter((r) => r.isPublic).length
  const weeklyData = user ? buildWeeklyChart(rooms) : []

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/dashboard/admin/users' })}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{user?.name ?? userId}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">User detail</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] })}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !user ? (
        <div className="rounded-2xl border px-5 py-16 text-center" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm text-muted-foreground">User not found</p>
        </div>
      ) : (
        <>
          {/* ── Hero card ──────────────────────────────────── */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
            {/* gradient banner */}
            <div
              className="h-20 w-full"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #06b6d4 100%)' }}
            />

            <div className="px-5 pb-5">
              {/* Avatar overlapping banner */}
              <div className="flex items-end justify-between -mt-9 mb-3">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white ring-4"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    boxShadow: '0 0 0 4px hsl(var(--background))',
                  }}
                >
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pb-1">
                  <button
                    onClick={() => toggleAdmin.mutate(isSuperadmin ? ['user'] : ['superadmin', 'user'])}
                    disabled={toggleAdmin.isPending}
                    title={isSuperadmin ? 'Remove admin' : 'Promote to admin'}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                    style={
                      isSuperadmin
                        ? { background: '#6366f115', color: '#818cf8', border: '1px solid #6366f130' }
                        : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                    }
                  >
                    {isSuperadmin ? <Shield className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                    {isSuperadmin ? 'Admin' : 'User'}
                  </button>
                  <button
                    onClick={() => toggleStatus.mutate(!user.isActive)}
                    disabled={toggleStatus.isPending}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                    style={
                      user.isActive
                        ? { background: '#10b98115', color: '#10b981', border: '1px solid #10b98130' }
                        : { background: '#ef444415', color: '#f87171', border: '1px solid #ef444430' }
                    }
                  >
                    {user.isActive ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        Active
                      </>
                    ) : (
                      <>
                        <UserX className="h-3.5 w-3.5" />
                        Banned
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Name + badges */}
              <p className="text-xl font-bold">{user.name || '—'}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <ProviderBadge provider={user.provider} />
                {isSuperadmin && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: '#6366f115', color: '#818cf8' }}
                  >
                    superadmin
                  </span>
                )}
                {!user.isActive && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: '#ef444415', color: '#f87171' }}
                  >
                    banned
                  </span>
                )}
              </div>

              {/* Detail grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4" style={{ borderColor: 'hsl(var(--border))' }}>
                {[
                  { icon: Hash, label: 'User ID', value: user.id, mono: true },
                  {
                    icon: Calendar,
                    label: 'Joined',
                    value: new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }),
                  },
                  { icon: Mail, label: 'Email', value: user.email },
                  { icon: Shield, label: 'Accesses', value: (user.accesses ?? []).join(', ') || 'none' },
                ].map(({ icon: Icon, label, value, mono }) => (
                  <div
                    key={label}
                    className="flex items-start gap-2.5 rounded-xl p-3"
                    style={{ background: 'hsl(var(--muted)/0.4)' }}
                  >
                    <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                      <p className={`mt-0.5 truncate text-sm ${mono ? 'font-mono text-[11px]' : 'font-medium'}`}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Stats row ──────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard value={rooms.length} label="Rooms created" icon={Video} color="#6366f1" />
            <StatCard value={activeRooms} label="Currently live" icon={Activity} color="#10b981" />
            <StatCard value={publicRooms} label="Public rooms" icon={Globe} color="#06b6d4" />
            <StatCard value={`${daysSince(user.createdAt)}d`} label="Member for" icon={Users} color="#f59e0b" />
          </div>

          {/* ── Room activity chart ─────────────────────────── */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
            <div
              className="flex items-center justify-between border-b px-5 py-3"
              style={{ background: 'linear-gradient(135deg, #6366f108, #8b5cf608)' }}
            >
              <p className="text-sm font-semibold">Room creation activity</p>
              <span className="text-xs text-muted-foreground">last 8 weeks</span>
            </div>
            <div className="p-5">
              {rooms.length === 0 ? (
                <div className="flex h-24 items-center justify-center">
                  <p className="text-xs text-muted-foreground">No rooms created yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="uGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(v: any) => [`${v} room${v !== 1 ? 's' : ''}`, 'Created']}
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
                      fill="url(#uGrad)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#6366f1' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Rooms table ────────────────────────────────── */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
            <div
              className="flex items-center justify-between border-b px-5 py-3"
              style={{ background: 'linear-gradient(135deg, #8b5cf608, #06b6d408)' }}
            >
              <p className="text-sm font-semibold">Rooms</p>
              <span className="text-xs text-muted-foreground">{rooms.length} total</span>
            </div>

            {rooms.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <Video className="h-7 w-7 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No rooms created by this user</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[460px]">
                  {/* header row */}
                  <div
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    <span>Name</span>
                    <span className="hidden sm:block">Visibility</span>
                    <span>Status</span>
                    <span>Cap.</span>
                    <span className="hidden sm:block">Created</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors"
                      >
                        <Link
                          to="/dashboard/admin/rooms/$roomId"
                          params={{ roomId: room.id }}
                          className="text-sm font-mono font-medium hover:text-indigo-400 transition-colors truncate"
                        >
                          {room.name}
                        </Link>
                        <span
                          className="hidden sm:flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
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
                          {room.isActive && <Activity className="h-2.5 w-2.5 animate-pulse" />}
                          {room.isActive ? 'Live' : 'Idle'}
                        </span>
                        <span className="text-xs text-muted-foreground text-center">{room.maxParticipants}</span>
                        <p className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(room.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        <Link to="/dashboard/admin/users" className="hover:text-foreground underline-offset-4 hover:underline">
          ← Back to all users
        </Link>
      </p>
    </div>
  )
}
