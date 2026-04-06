import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Lock, Mic, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsLayout,
})

const TABS = [
  { to: '/dashboard/settings' as const, label: 'Profile', icon: User, isIndex: true },
  { to: '/dashboard/settings/security' as const, label: 'Security', icon: Lock },
  { to: '/dashboard/settings/audio' as const, label: 'Audio', icon: Mic },
]

function SettingsLayout() {
  const { location } = useRouterState()
  const path = location.pathname

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
      </div>

      {/* Tab strip */}
      <div className="flex gap-px rounded-lg bg-muted p-0.5 w-fit">
        {TABS.map(({ to, label, icon: Icon, isIndex }) => {
          const active = isIndex
            ? path === '/dashboard/settings' || path === '/dashboard/settings/'
            : path.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                active ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </div>

      <Outlet />
    </div>
  )
}
