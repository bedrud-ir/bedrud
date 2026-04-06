import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { LayoutDashboard, LogOut, Radio, Settings, Shield, Users, Video } from 'lucide-react'
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

function NavLink({ to, label, icon: Icon, exact }: { to: string; label: string; icon: React.ElementType; exact?: boolean }) {
  const { location } = useRouterState()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)
  return (
    <Link to={to}>
      <div className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}>
        <Icon className="h-3.5 w-3.5 shrink-0" />
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
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-52 flex-col border-r bg-card">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
          <Radio className="h-3 w-3 text-primary-foreground" />
        </div>
        <span className="font-mono text-xs font-semibold tracking-tight">bedrud</span>
      </div>

      <nav className="flex flex-1 flex-col gap-px overflow-y-auto p-2">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
          Main
        </p>
        {USER_NAV.map((item) => <NavLink key={item.to} {...item} />)}

        {user?.isAdmin && (
          <div className="mt-3">
            <div className="mb-1 flex items-center gap-2 px-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Admin</p>
              <span className="rounded border border-destructive/30 bg-destructive/10 px-1 py-px text-[9px] font-semibold uppercase text-destructive">
                Restricted
              </span>
            </div>
            {ADMIN_NAV.map((item) => <NavLink key={item.to} {...item} />)}
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t p-2">
        <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent">
          <Avatar className="h-6 w-6 shrink-0">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="bg-primary text-[9px] font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user?.name ?? '…'}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={onLogout}
            className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            title="Sign out"
          >
            <LogOut className="h-3 w-3" />
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
    <header className="sticky top-0 z-40 flex h-11 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-sm lg:pl-[13.5rem]">
      <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
          <Radio className="h-3 w-3 text-primary-foreground" />
        </div>
        <span className="font-mono text-xs font-semibold">bedrud</span>
      </Link>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-6 w-6">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="bg-primary text-[9px] font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="truncate text-xs font-semibold">{user?.name ?? '…'}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.email ?? ''}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="flex cursor-pointer items-center gap-2 text-xs">
                <Settings className="h-3.5 w-3.5" /> Settings
              </Link>
            </DropdownMenuItem>
            {user?.isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="flex cursor-pointer items-center gap-2 text-xs">
                    <Shield className="h-3.5 w-3.5" /> Admin panel
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive" onClick={onLogout}>
              <LogOut className="h-3.5 w-3.5" /> Sign out
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
        id: u.id, email: u.email, name: u.name, provider: u.provider,
        isAdmin: u.accesses?.includes('superadmin') ?? false,
        accesses: u.accesses ?? [], avatarUrl: u.avatarUrl,
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
      clearAuth(); clearUser()
      navigate({ to: '/auth' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} onLogout={handleLogout} />
      <TopBar user={user} onLogout={handleLogout} />
      <main className="p-4 lg:pl-52 lg:p-6">
        <Outlet />
      </main>
    </div>
  )
}
