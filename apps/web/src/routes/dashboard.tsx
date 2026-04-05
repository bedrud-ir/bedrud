import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, LogOut, Radio, Settings, Shield, Users, Video, ChevronRight } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '#/lib/auth.store'
import { useUserStore } from '#/lib/user.store'
import { api } from '#/lib/api'
import type { User } from '#/lib/user.store'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (!useAuthStore.getState().tokens) throw redirect({ to: '/auth' })
  },
  component: DashboardLayout,
})

const USER_NAV = [
  { to: '/dashboard' as const, label: 'Rooms', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/settings' as const, label: 'Settings', icon: Settings },
]

const ADMIN_NAV = [
  { to: '/admin' as const, label: 'Overview', icon: Shield, exact: true },
  { to: '/admin/users' as const, label: 'Users', icon: Users },
  { to: '/admin/rooms' as const, label: 'Rooms', icon: Video },
]

function NavLink({
  to,
  label,
  icon: Icon,
  exact,
}: {
  to: string
  label: string
  icon: React.ElementType
  exact?: boolean
}) {
  const { location } = useRouterState()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <Link to={to}>
      <div
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/60"
        style={
          active
            ? {
                background: 'linear-gradient(135deg, #6366f115 0%, #8b5cf615 100%)',
                color: '#818cf8',
                boxShadow: 'inset 0 0 0 1px #6366f125',
              }
            : undefined
        }
      >
        <Icon className="h-4 w-4 shrink-0" style={{ color: active ? '#818cf8' : undefined }} />
        {label}
      </div>
    </Link>
  )
}

function Sidebar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-60 flex-col border-r" style={{ background: 'hsl(var(--card))', backdropFilter: 'blur(12px)' }}>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 2px 12px #6366f140' }}
        >
          <Radio className="h-4 w-4 text-white" />
        </div>
        <span className="font-mono text-sm font-semibold tracking-tight">bedrud</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {/* User section */}
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Main
        </p>
        {USER_NAV.map((item) => <NavLink key={item.to} {...item} />)}

        {/* Admin section — only visible to admins */}
        {user?.isAdmin && (
          <div className="mt-4">
            <div className="mb-1 flex items-center gap-1.5 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Admin
              </p>
              <span
                className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ background: '#ef444415', color: '#f87171', border: '1px solid #ef444425' }}
              >
                <Shield className="h-2.5 w-2.5" />
                Restricted
              </span>
            </div>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.to} {...item} />
            ))}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50 transition-colors group">
          <Avatar className="h-8 w-8 shrink-0">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback
              className="text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? '…'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function TopBar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 lg:pl-64"
      style={{ background: 'hsl(var(--background) / 0.9)', backdropFilter: 'blur(16px)' }}
    >
      <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
        >
          <Radio className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="font-mono text-sm font-semibold">bedrud</span>
      </Link>

      {/* Breadcrumb-style page context on desktop */}
      <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>bedrud</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Dashboard</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback
                  className="text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-2">
              <p className="truncate text-sm font-semibold">{user?.name ?? '…'}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            {user?.isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                    <Shield className="h-4 w-4" style={{ color: '#818cf8' }} />
                    <span style={{ color: '#818cf8' }}>Admin panel</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer" onClick={onLogout}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function DashboardLayout() {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clear)
  const clearUser = useUserStore((s) => s.clear)
  const setUser = useUserStore((s) => s.setUser)

  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const u = await api.get<User & { accesses?: string[] }>('/api/auth/me')
      setUser({
        id: u.id,
        email: u.email,
        name: u.name,
        provider: u.provider,
        isAdmin: u.accesses?.includes('superadmin') ?? false,
        accesses: u.accesses ?? [],
        avatarUrl: u.avatarUrl,
      })
      return u
    },
    enabled: !user,
  })

  async function handleLogout() {
    try {
      const refreshToken = useAuthStore.getState().tokens?.refreshToken
      if (refreshToken) await api.post('/api/auth/logout', { refresh_token: refreshToken })
    } catch { /* ignore */ } finally {
      clearAuth()
      clearUser()
      navigate({ to: '/auth' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} onLogout={handleLogout} />
      <TopBar user={user} onLogout={handleLogout} />
      <main className="lg:pl-60 p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
