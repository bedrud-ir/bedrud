import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '#/lib/auth.store'
import { useUserStore } from '#/lib/user.store'
import { Shield, Users, Video } from 'lucide-react'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/admin')({
  beforeLoad: () => {
    if (!useAuthStore.getState().tokens) {
      throw redirect({ to: '/auth' })
    }
    const user = useUserStore.getState().user
    if (user && !user.isAdmin) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminLayout,
})

const navItems = [
  { to: '/admin' as const, label: 'Overview', icon: Shield, exact: true },
  { to: '/admin/users' as const, label: 'Users', icon: Users },
  { to: '/admin/rooms' as const, label: 'Rooms', icon: Video },
]

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r bg-muted/30">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold">Admin</span>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                '[&.active]:bg-accent [&.active]:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
