import { createFileRoute, Link, Outlet, redirect, useRouterState } from '@tanstack/react-router'
import { Radio, Shield, Users, Video, LayoutDashboard, ChevronRight, Settings } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuthStore } from '#/lib/auth.store'
import { useUserStore } from '#/lib/user.store'

export const Route = createFileRoute('/admin')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (!useAuthStore.getState().tokens) throw redirect({ to: '/auth' })
    const user = useUserStore.getState().user
    if (user && !user.isAdmin) throw redirect({ to: '/dashboard' })
  },
  component: AdminLayout,
})

const ADMIN_NAV = [
  { to: '/admin' as const, label: 'Overview', icon: Shield, exact: true },
  { to: '/admin/users' as const, label: 'Users', icon: Users },
  { to: '/admin/rooms' as const, label: 'Rooms', icon: Video },
  { to: '/admin/settings' as const, label: 'Settings', icon: Settings },
]

function NavLink({ to, label, icon: Icon, exact }: { to: string; label: string; icon: React.ElementType; exact?: boolean }) {
  const { location } = useRouterState()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)
  return (
    <Link to={to}>
      <div
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted/60"
        style={active ? { background: 'linear-gradient(135deg, #6366f115, #8b5cf615)', color: '#818cf8', boxShadow: 'inset 0 0 0 1px #6366f125' } : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" style={{ color: active ? '#818cf8' : undefined }} />
        {label}
      </div>
    </Link>
  )
}

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-60 flex-col border-r" style={{ background: 'hsl(var(--card))' }}>
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

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {/* Back to dashboard */}
          <Link to="/dashboard">
            <div className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60">
              <LayoutDashboard className="h-3.5 w-3.5" />
              ← Back to dashboard
            </div>
          </Link>

          <div
            className="mb-2 flex items-center gap-1.5 rounded-xl px-3 py-2"
            style={{ background: 'linear-gradient(135deg, #ef444410, #f9731610)', border: '1px solid #ef444420' }}
          >
            <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: '#f87171' }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#f87171' }}>
              Admin Panel
            </span>
          </div>

          {ADMIN_NAV.map((item) => <NavLink key={item.to} {...item} />)}
        </nav>
      </aside>

      {/* Top bar */}
      <header
        className="sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 lg:pl-64"
        style={{ background: 'hsl(var(--background) / 0.9)', backdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center gap-2 lg:hidden">
          <Shield className="h-4 w-4" style={{ color: '#818cf8' }} />
          <span className="font-semibold text-sm">Admin</span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground transition-colors">bedrud</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span
            className="font-medium"
            style={{ color: '#818cf8' }}
          >
            Admin
          </span>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="lg:pl-60 p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
